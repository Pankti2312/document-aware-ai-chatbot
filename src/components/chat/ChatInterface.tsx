 import { useRef, useEffect } from "react";
 import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, Trash2, GraduationCap, BookOpen, Download, FileText, FileDown, Scissors } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatMessage as ChatMessageType, ExplanationMode } from "@/types/rag";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { useExportChat } from "@/hooks/useExportChat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
 
interface ChatInterfaceProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onClearConversation: () => void;
  hasDocuments: boolean;
  explanationMode: ExplanationMode;
  onToggleExplanationMode: () => void;
}
 
export function ChatInterface({
  messages,
  isLoading,
  onSendMessage,
  onClearConversation,
  hasDocuments,
  explanationMode,
  onToggleExplanationMode,
}: ChatInterfaceProps) {
   const messagesEndRef = useRef<HTMLDivElement>(null);
   const { exportAsMarkdown, exportAsPDF } = useExportChat(messages);
 
   useEffect(() => {
     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [messages]);
 
   return (
     <div className="flex flex-col h-full">
       {/* Header */}
       <div className="flex items-center justify-between p-4 border-b border-border">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-primary">
             <Bot className="w-5 h-5 text-primary" />
           </div>
           <div>
             <h1 className="font-semibold text-foreground">RAG Assistant</h1>
             <p className="text-xs text-muted-foreground">
               {hasDocuments
                 ? "Powered by your documents"
                 : "Upload documents to begin"}
             </p>
           </div>
         </div>
        <div className="flex items-center gap-3">
            <Link to="/segmentation">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                <Scissors className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Segment</span>
              </Button>
            </Link>
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <BookOpen className={`w-4 h-4 transition-colors ${explanationMode === "simple" ? "text-primary" : "text-muted-foreground"}`} />
              <Switch
                checked={explanationMode === "technical"}
                onCheckedChange={onToggleExplanationMode}
                className="data-[state=checked]:bg-accent"
              />
              <GraduationCap className={`w-4 h-4 transition-colors ${explanationMode === "technical" ? "text-accent" : "text-muted-foreground"}`} />
              <Label className="text-xs text-muted-foreground hidden sm:inline">
                {explanationMode === "simple" ? "Simple" : "Technical"}
              </Label>
            </div>
            {messages.length > 0 && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportAsMarkdown}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export as Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportAsPDF}>
                      <FileDown className="w-4 h-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearConversation}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </>
            )}
          </div>
       </div>
 
       {/* Messages */}
       <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
         {messages.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-center p-8">
             <motion.div
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ duration: 0.5 }}
               className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-glow-secondary/20 flex items-center justify-center mb-6 glow-accent"
             >
               <Sparkles className="w-10 h-10 text-primary" />
             </motion.div>
             <motion.h2
               initial={{ y: 10, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.1 }}
               className="text-xl font-semibold text-foreground mb-2"
             >
               Document-Grounded AI
             </motion.h2>
             <motion.p
               initial={{ y: 10, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.2 }}
               className="text-muted-foreground max-w-md"
             >
               {hasDocuments
                 ? "Your documents are ready. Ask me anything about them!"
                 : "Upload PDF documents to the sidebar, then ask questions. I'll only answer based on your document content."}
             </motion.p>
           </div>
         ) : (
           <AnimatePresence mode="popLayout">
             {messages.map((message) => (
               <ChatMessage key={message.id} message={message} />
             ))}
           </AnimatePresence>
         )}
         <div ref={messagesEndRef} />
       </div>
 
       {/* Input */}
       <div className="p-4 border-t border-border">
         <ChatInput
           onSend={onSendMessage}
           isLoading={isLoading}
           disabled={!hasDocuments}
         />
       </div>
     </div>
   );
 }