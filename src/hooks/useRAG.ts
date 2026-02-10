import { useState, useCallback } from "react";
import { PDFDocument, DocumentChunk, ChatMessage, SourceCitation, ExplanationMode } from "@/types/rag";
import { extractTextFromFile, chunkText } from "@/lib/fileProcessing";
import { toast } from "sonner";

export function useRAG() {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [explanationMode, setExplanationMode] = useState<ExplanationMode>("simple");
 
   const addDocument = useCallback(async (file: File) => {
     const docId = crypto.randomUUID();
     const newDoc: PDFDocument = {
       id: docId,
       name: file.name,
       size: file.size,
       status: "uploading",
       chunks: [],
     };
 
     setDocuments((prev) => [...prev, newDoc]);
 
     try {
       setDocuments((prev) =>
         prev.map((d) => (d.id === docId ? { ...d, status: "indexing" as const } : d))
       );
 
       const { text, pageCount } = await extractTextFromFile(file);
       const chunks = chunkText(text, docId, file.name);
 
       setDocuments((prev) =>
         prev.map((d) =>
           d.id === docId
             ? { ...d, status: "ready" as const, chunks, pageCount }
             : d
         )
       );
 
       toast.success(`${file.name} indexed successfully`);
     } catch (error) {
       console.error("Error processing PDF:", error);
       setDocuments((prev) =>
         prev.map((d) =>
           d.id === docId ? { ...d, status: "error" as const } : d
         )
       );
       toast.error(`Failed to process ${file.name}`);
     }
   }, []);
 
   const removeDocument = useCallback((docId: string) => {
     setDocuments((prev) => prev.filter((d) => d.id !== docId));
   }, []);
 
   const getAllChunks = useCallback((): DocumentChunk[] => {
     return documents.flatMap((doc) => doc.chunks);
   }, [documents]);
 
   const searchRelevantChunks = useCallback(
     (query: string, topK: number = 5): DocumentChunk[] => {
       const allChunks = getAllChunks();
       if (allChunks.length === 0) return [];
 
       // Simple TF-IDF-like scoring using Jaccard similarity
       const queryWords = new Set(
         query.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
       );
 
       const scored = allChunks.map((chunk) => {
         const chunkWords = new Set(
           chunk.content.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
         );
         const intersection = [...queryWords].filter((w) => chunkWords.has(w));
         const union = new Set([...queryWords, ...chunkWords]);
         const score = intersection.length / union.size;
         return { chunk, score };
       });
 
       return scored
         .sort((a, b) => b.score - a.score)
         .slice(0, topK)
         .filter((s) => s.score > 0)
         .map((s) => s.chunk);
     },
     [getAllChunks]
   );
 
   const sendMessage = useCallback(
     async (content: string) => {
       if (!content.trim()) return;
 
       const userMessage: ChatMessage = {
         id: crypto.randomUUID(),
         role: "user",
         content: content.trim(),
         timestamp: new Date(),
       };
 
       setMessages((prev) => [...prev, userMessage]);
       setIsLoading(true);
 
       try {
         const relevantChunks = searchRelevantChunks(content, 5);
         const sources: SourceCitation[] = relevantChunks.map((c) => ({
           documentName: c.documentName,
           page: c.page,
           snippet: c.content.slice(0, 100) + "...",
         }));
 
         // Build context from relevant chunks
         const context = relevantChunks.length > 0
           ? relevantChunks
               .map((c) => `[Source: ${c.documentName}, Page ${c.page}]\n${c.content}`)
               .join("\n\n---\n\n")
           : "";
 
         // Prepare conversation history for context
         const conversationHistory = messages.slice(-10).map((m) => ({
           role: m.role,
           content: m.content,
         }));
 
         const response = await fetch(
           `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-chat`,
           {
             method: "POST",
             headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
             },
              body: JSON.stringify({
                messages: [{ role: "user", content: content.trim() }],
                context,
                conversationHistory,
                explanationMode,
              }),
           }
         );
 
         if (!response.ok) {
           const errorData = await response.json().catch(() => ({}));
           throw new Error(errorData.error || `Request failed: ${response.status}`);
         }
 
         if (!response.body) {
           throw new Error("No response body");
         }
 
         // Stream the response
         const reader = response.body.getReader();
         const decoder = new TextDecoder();
         let assistantContent = "";
         let textBuffer = "";
 
         const assistantMessage: ChatMessage = {
           id: crypto.randomUUID(),
           role: "assistant",
           content: "",
           sources: sources.length > 0 ? sources : undefined,
           timestamp: new Date(),
         };
 
         setMessages((prev) => [...prev, assistantMessage]);
 
         while (true) {
           const { done, value } = await reader.read();
           if (done) break;
 
           textBuffer += decoder.decode(value, { stream: true });
 
           let newlineIndex: number;
           while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
             let line = textBuffer.slice(0, newlineIndex);
             textBuffer = textBuffer.slice(newlineIndex + 1);
 
             if (line.endsWith("\r")) line = line.slice(0, -1);
             if (line.startsWith(":") || line.trim() === "") continue;
             if (!line.startsWith("data: ")) continue;
 
             const jsonStr = line.slice(6).trim();
             if (jsonStr === "[DONE]") break;
 
             try {
               const parsed = JSON.parse(jsonStr);
               const delta = parsed.choices?.[0]?.delta?.content;
               if (delta) {
                 assistantContent += delta;
                 setMessages((prev) =>
                   prev.map((m) =>
                     m.id === assistantMessage.id
                       ? { ...m, content: assistantContent }
                       : m
                   )
                 );
               }
             } catch {
               textBuffer = line + "\n" + textBuffer;
               break;
             }
           }
         }
       } catch (error) {
         console.error("Chat error:", error);
         const errorMessage = error instanceof Error ? error.message : "Unknown error";
         toast.error(errorMessage);
 
         // Add error message to chat
         setMessages((prev) => [
           ...prev,
           {
             id: crypto.randomUUID(),
             role: "assistant",
             content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
             timestamp: new Date(),
           },
         ]);
       } finally {
         setIsLoading(false);
       }
     },
     [messages, searchRelevantChunks, explanationMode]
   );
 
  const clearConversation = useCallback(() => {
    setMessages([]);
  }, []);

  const toggleExplanationMode = useCallback(() => {
    setExplanationMode((prev) => (prev === "simple" ? "technical" : "simple"));
  }, []);

  return {
    documents,
    messages,
    isLoading,
    explanationMode,
    addDocument,
    removeDocument,
    sendMessage,
    clearConversation,
    toggleExplanationMode,
    readyDocuments: documents.filter((d) => d.status === "ready").length,
  };
 }