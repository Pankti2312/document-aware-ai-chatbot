 import { motion } from "framer-motion";
 import ReactMarkdown from "react-markdown";
 import { ChatMessage as ChatMessageType } from "@/types/rag";
 import { User, Bot, FileText } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface ChatMessageProps {
   message: ChatMessageType;
 }
 
 export function ChatMessage({ message }: ChatMessageProps) {
   const isUser = message.role === "user";
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.3 }}
       className={cn(
         "flex gap-4 p-4 rounded-xl",
         isUser
           ? "bg-user/10 border border-user/20"
           : "bg-assistant border border-border"
       )}
     >
       <div
         className={cn(
           "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
           isUser ? "bg-user/20 text-user" : "bg-primary/20 text-primary"
         )}
       >
         {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
       </div>
 
       <div className="flex-1 min-w-0">
         <div className="prose prose-invert prose-sm max-w-none">
           <ReactMarkdown
             components={{
               p: ({ children }) => <p className="mb-2 last:mb-0 text-foreground/90">{children}</p>,
               code: ({ children }) => (
                 <code className="px-1.5 py-0.5 rounded bg-muted text-primary font-mono text-xs">
                   {children}
                 </code>
               ),
               pre: ({ children }) => (
                 <pre className="p-3 rounded-lg bg-muted overflow-x-auto my-2">
                   {children}
                 </pre>
               ),
               ul: ({ children }) => (
                 <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
               ),
               ol: ({ children }) => (
                 <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
               ),
               strong: ({ children }) => (
                 <strong className="font-semibold text-foreground">{children}</strong>
               ),
             }}
           >
             {message.content || "..."}
           </ReactMarkdown>
         </div>
 
         {/* Source citations */}
         {message.sources && message.sources.length > 0 && (
           <motion.div
             initial={{ opacity: 0, height: 0 }}
             animate={{ opacity: 1, height: "auto" }}
             transition={{ delay: 0.2 }}
             className="mt-4 pt-3 border-t border-border/50"
           >
             <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
               <FileText className="w-3 h-3" />
               Sources
             </p>
             <div className="flex flex-wrap gap-2">
               {message.sources.map((source, idx) => (
                 <div
                   key={idx}
                   className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20"
                 >
                   {source.documentName} • Page {source.page}
                 </div>
               ))}
             </div>
           </motion.div>
         )}
       </div>
     </motion.div>
   );
 }