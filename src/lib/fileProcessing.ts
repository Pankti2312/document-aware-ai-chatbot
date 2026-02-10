import { DocumentChunk } from "@/types/rag";

const CHUNK_SIZE = 450;
const CHUNK_OVERLAP = 50;

export async function extractTextFromFile(
  file: File
): Promise<{ text: string; pageCount: number }> {
  const ext = file.name.toLowerCase().split(".").pop();

  if (ext === "pdf") {
    return extractFromPDF(file);
  } else if (ext === "docx") {
    return extractFromDOCX(file);
  } else if (ext === "txt") {
    return extractFromTXT(file);
  }

  throw new Error(`Unsupported file type: .${ext}`);
}

async function extractFromPDF(
  file: File
): Promise<{ text: string; pageCount: number }> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += `\n[Page ${i}]\n${pageText}`;
  }

  return { text: fullText, pageCount: pdf.numPages };
}

async function extractFromDOCX(
  file: File
): Promise<{ text: string; pageCount: number }> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  // DOCX doesn't have real pages — estimate ~3000 chars/page
  const estimatedPages = Math.max(1, Math.ceil(result.value.length / 3000));
  return { text: result.value, pageCount: estimatedPages };
}

async function extractFromTXT(
  file: File
): Promise<{ text: string; pageCount: number }> {
  const text = await file.text();
  const estimatedPages = Math.max(1, Math.ceil(text.length / 3000));
  return { text, pageCount: estimatedPages };
}

export function chunkText(
  text: string,
  documentId: string,
  documentName: string
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const lines = text.split("\n");
  let currentChunk = "";
  let currentPage = 1;

  for (const line of lines) {
    const pageMatch = line.match(/\[Page (\d+)\]/);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10);
      continue;
    }

    if (currentChunk.length + line.length > CHUNK_SIZE) {
      if (currentChunk.trim()) {
        chunks.push({
          id: `${documentId}-${chunks.length}`,
          documentId,
          documentName,
          content: currentChunk.trim(),
          page: currentPage,
        });
      }
      currentChunk = currentChunk.slice(-CHUNK_OVERLAP) + line + " ";
    } else {
      currentChunk += line + " ";
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      id: `${documentId}-${chunks.length}`,
      documentId,
      documentName,
      content: currentChunk.trim(),
      page: currentPage,
    });
  }

  return chunks;
}
