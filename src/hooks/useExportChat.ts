import { useCallback } from "react";
import { ChatMessage } from "@/types/rag";

function buildMarkdown(messages: ChatMessage[]): string {
  const lines = messages.map((m) => {
    const role = m.role === "user" ? "**You**" : "**Assistant**";
    const sources =
      m.sources && m.sources.length > 0
        ? `\n\n> Sources: ${m.sources.map((s) => `${s.documentName} (p.${s.page})`).join(", ")}`
        : "";
    return `### ${role}\n\n${m.content}${sources}`;
  });

  return `# Chat Export\n\n_Exported on ${new Date().toLocaleString()}_\n\n---\n\n${lines.join("\n\n---\n\n")}\n`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useExportChat(messages: ChatMessage[]) {
  const exportAsMarkdown = useCallback(() => {
    if (messages.length === 0) return;
    const md = buildMarkdown(messages);
    downloadBlob(new Blob([md], { type: "text/markdown" }), `chat-export-${Date.now()}.md`);
  }, [messages]);

  const exportAsPDF = useCallback(() => {
    if (messages.length === 0) return;

    const html = messages
      .map((m) => {
        const role = m.role === "user" ? "You" : "Assistant";
        const sources =
          m.sources && m.sources.length > 0
            ? `<p style="font-size:11px;color:#888;margin-top:8px;">Sources: ${m.sources.map((s) => `${s.documentName} (p.${s.page})`).join(", ")}</p>`
            : "";
        return `<div style="margin-bottom:16px;padding:12px;border-radius:8px;background:${m.role === "user" ? "#f0f0f0" : "#e8f4f8"};">
          <p style="font-weight:bold;margin:0 0 6px 0;font-size:13px;color:#555;">${role}</p>
          <div style="font-size:14px;line-height:1.6;white-space:pre-wrap;">${m.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          ${sources}
        </div>`;
      })
      .join("");

    const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Chat Export</title>
      <style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:700px;margin:0 auto;padding:24px;color:#222;}
      h1{font-size:20px;} .meta{font-size:12px;color:#888;margin-bottom:16px;}</style></head>
      <body><h1>Chat Export</h1><p class="meta">Exported on ${new Date().toLocaleString()}</p>${html}</body></html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(doc);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }, [messages]);

  return { exportAsMarkdown, exportAsPDF };
}
