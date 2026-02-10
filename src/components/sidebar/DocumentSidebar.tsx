import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Files, PanelLeftClose, PanelLeft, Search, X } from "lucide-react";
import { PDFDropzone } from "./PDFDropzone";
import { DocumentItem } from "./DocumentItem";
import { PDFDocument } from "@/types/rag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface DocumentSidebarProps {
  documents: PDFDocument[];
  onAddDocument: (file: File) => void;
  onRemoveDocument: (id: string) => void;
}

function SidebarContent({
  documents,
  onAddDocument,
  onRemoveDocument,
}: DocumentSidebarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFilesSelect = (files: File[]) => {
    files.forEach((file) => onAddDocument(file));
  };

  const readyCount = documents.filter((d) => d.status === "ready").length;

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter((d) => d.name.toLowerCase().includes(q));
  }, [documents, searchQuery]);

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Files className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-semibold text-sidebar-foreground">Documents</h2>
        </div>
        <p className="text-xs text-muted-foreground ml-11">
          {readyCount > 0
            ? `${readyCount} document${readyCount !== 1 ? "s" : ""} indexed`
            : "No documents uploaded"}
        </p>
      </div>

      {/* Upload zone */}
      <div className="p-4">
        <PDFDropzone
          onFileSelect={handleFilesSelect}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
        />
      </div>

      {/* Search filter */}
      {documents.length > 1 && (
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter documents..."
              className="h-8 pl-8 pr-8 text-xs bg-muted/50 border-sidebar-border"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {documents.length > 0 ? (
            filteredDocuments.length > 0 ? (
              <div className="space-y-2">
                {filteredDocuments.map((doc) => (
                  <DocumentItem
                    key={doc.id}
                    document={doc}
                    onRemove={onRemoveDocument}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <p className="text-sm text-muted-foreground">No matching documents</p>
              </motion.div>
            )
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                No documents yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Upload documents to start asking questions
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer stats */}
      {documents.length > 0 && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="glass rounded-lg p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total chunks</span>
              <span className="text-foreground font-medium">
                {documents.reduce((acc, d) => acc + d.chunks.length, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-muted-foreground">Status</span>
              <span className="text-success font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Ready
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DocumentSidebar(props: DocumentSidebarProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-3 left-3 z-50 bg-sidebar border border-sidebar-border"
          >
            <PanelLeft className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0 bg-sidebar border-sidebar-border flex flex-col">
          <SidebarContent {...props} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="w-80 h-full border-r border-border flex flex-col bg-sidebar">
      <SidebarContent {...props} />
    </aside>
  );
}