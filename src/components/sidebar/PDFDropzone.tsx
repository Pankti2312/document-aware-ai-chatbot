import { useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"];

function isAcceptedFile(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  return ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
}

interface PDFDropzoneProps {
  onFileSelect: (files: File[]) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

export function PDFDropzone({
  onFileSelect,
  isDragging,
  setIsDragging,
}: PDFDropzoneProps) {
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    [setIsDragging]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    },
    [setIsDragging]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter(isAcceptedFile);

      if (files.length > 0) {
        onFileSelect(files);
      }
    },
    [onFileSelect, setIsDragging]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter(isAcceptedFile);

      if (files.length > 0) {
        onFileSelect(files);
      }
      e.target.value = "";
    },
    [onFileSelect]
  );

  return (
    <motion.label
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200",
        isDragging
          ? "border-primary bg-primary/10 glow-primary"
          : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
      )}
    >
      <input
        type="file"
        accept=".pdf,.docx,.txt"
        multiple
        onChange={handleFileInput}
        className="sr-only"
      />

      <motion.div
        animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
          isDragging ? "bg-primary/20" : "bg-muted"
        )}
      >
        {isDragging ? (
          <FileText className="w-6 h-6 text-primary" />
        ) : (
          <Upload className="w-6 h-6 text-muted-foreground" />
        )}
      </motion.div>

      <p className="text-sm font-medium text-foreground mb-1">
        {isDragging ? "Drop file here" : "Upload Documents"}
      </p>
      <p className="text-xs text-muted-foreground text-center">
        PDF, DOCX, TXT • Drag & drop or click
      </p>
    </motion.label>
  );
}