import { DocumentSidebar } from "@/components/sidebar/DocumentSidebar";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useRAG } from "@/hooks/useRAG";

const Index = () => {
  const {
    documents,
    messages,
    isLoading,
    explanationMode,
    addDocument,
    removeDocument,
    sendMessage,
    clearConversation,
    toggleExplanationMode,
    readyDocuments,
  } = useRAG();

  return (
    <div className="flex h-screen bg-background gradient-mesh grain overflow-hidden">
      {/* Sidebar */}
      <DocumentSidebar
        documents={documents}
        onAddDocument={addDocument}
        onRemoveDocument={removeDocument}
      />

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          onSendMessage={sendMessage}
          onClearConversation={clearConversation}
          hasDocuments={readyDocuments > 0}
          explanationMode={explanationMode}
          onToggleExplanationMode={toggleExplanationMode}
        />
      </main>
    </div>
  );
};

export default Index;
