 import { motion } from "framer-motion";
 import { FileText, Loader2, Check, AlertCircle, X, File } from "lucide-react";
 import { PDFDocument } from "@/types/rag";
 import { cn } from "@/lib/utils";
 import { Button } from "@/components/ui/button";
 
 interface DocumentItemProps {
   document: PDFDocument;
   onRemove: (id: string) => void;
 }
 
 export function DocumentItem({ document, onRemove }: DocumentItemProps) {
   const statusConfig = {
     uploading: {
       icon: Loader2,
       label: "Uploading...",
       className: "text-warning animate-spin",
     },
     indexing: {
       icon: Loader2,
       label: "Indexing...",
       className: "text-primary animate-spin",
     },
     ready: {
       icon: Check,
       label: "Ready",
       className: "text-success",
     },
     error: {
       icon: AlertCircle,
       label: "Error",
       className: "text-destructive",
     },
   };
 
   const status = statusConfig[document.status];
   const StatusIcon = status.icon;
 
   const formatSize = (bytes: number) => {
     if (bytes < 1024) return `${bytes} B`;
     if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
     return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
   };
 
   return (
     <motion.div
       initial={{ opacity: 0, x: -10 }}
       animate={{ opacity: 1, x: 0 }}
       exit={{ opacity: 0, x: -10 }}
       className="group flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
     >
       <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
         <FileText className="w-5 h-5 text-primary" />
       </div>
 
       <div className="flex-1 min-w-0">
         <p className="text-sm font-medium text-foreground truncate">
           {document.name}
         </p>
         <div className="flex items-center gap-2 text-xs text-muted-foreground">
           <span>{formatSize(document.size)}</span>
           {document.pageCount && (
             <>
               <span>•</span>
               <span>{document.pageCount} pages</span>
             </>
           )}
           {document.status === "ready" && (
             <>
               <span>•</span>
               <span>{document.chunks.length} chunks</span>
             </>
           )}
         </div>
       </div>
 
       <div className="flex items-center gap-2">
         <div className={cn("flex items-center gap-1", status.className)}>
           <StatusIcon className="w-4 h-4" />
         </div>
 
         <Button
           variant="ghost"
           size="icon"
           onClick={() => onRemove(document.id)}
           className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
         >
           <X className="w-4 h-4" />
         </Button>
       </div>
     </motion.div>
   );
 }