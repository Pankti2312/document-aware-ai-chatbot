 export interface PDFDocument {
   id: string;
   name: string;
   size: number;
   status: "uploading" | "indexing" | "ready" | "error";
   chunks: DocumentChunk[];
   pageCount?: number;
 }
 
 export interface DocumentChunk {
   id: string;
   documentId: string;
   documentName: string;
   content: string;
   page: number;
 }
 
 export interface ChatMessage {
   id: string;
   role: "user" | "assistant";
   content: string;
   sources?: SourceCitation[];
   timestamp: Date;
 }
 
 export interface SourceCitation {
   documentName: string;
   page: number;
   snippet: string;
 }
 
export type ExplanationMode = "simple" | "technical";

export interface RAGState {
  documents: PDFDocument[];
  messages: ChatMessage[];
  isLoading: boolean;
}