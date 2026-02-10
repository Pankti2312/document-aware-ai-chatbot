 import { useState, KeyboardEvent } from "react";
 import { motion } from "framer-motion";
 import { Send, Loader2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Textarea } from "@/components/ui/textarea";
 
 interface ChatInputProps {
   onSend: (message: string) => void;
   isLoading: boolean;
   disabled?: boolean;
 }
 
 export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
   const [input, setInput] = useState("");
 
   const handleSend = () => {
     if (input.trim() && !isLoading && !disabled) {
       onSend(input);
       setInput("");
     }
   };
 
   const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
     if (e.key === "Enter" && !e.shiftKey) {
       e.preventDefault();
       handleSend();
     }
   };
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       className="glass rounded-xl p-3"
     >
       <div className="flex gap-3 items-end">
         <Textarea
           value={input}
           onChange={(e) => setInput(e.target.value)}
           onKeyDown={handleKeyDown}
           placeholder={
             disabled
               ? "Upload a document to start chatting..."
               : "Ask a question about your documents..."
           }
           disabled={isLoading || disabled}
           className="min-h-[52px] max-h-32 resize-none bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
         />
         <Button
           onClick={handleSend}
           disabled={!input.trim() || isLoading || disabled}
           size="icon"
           className="h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground glow-primary transition-all"
         >
           {isLoading ? (
             <Loader2 className="w-4 h-4 animate-spin" />
           ) : (
             <Send className="w-4 h-4" />
           )}
         </Button>
       </div>
     </motion.div>
   );
 }