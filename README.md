# 📄 Document-Aware AI Chatbot (RAG-Based)

RAG-based AI system for querying and summarizing uploaded documents

---

## 📌 Overview

This repository showcases my learning and implementation of a **Document-Aware AI Chatbot**
that allows users to upload documents such as **PDF, Word (DOCX), and ODF files** and then
**ask questions or generate summaries** based strictly on the uploaded content.

The project follows the **Retrieval-Augmented Generation (RAG)** approach to ensure that
responses are **accurate, contextual, and grounded in the document**, avoiding hallucinations.

The project was initially **prototyped using Lovable** for rapid UI development and later
exported, structured, and published on GitHub.

---

## 🧠 My Learning from this Project

Through this project, I learned:
- How document-based AI systems work
- How Retrieval-Augmented Generation (RAG) improves accuracy
- How to handle document uploads in web applications
- How to extract and process document text
- How to design clean and modular React applications
- How low-code tools like Lovable accelerate development

---

## 🛠️ Built With

- **React**
- **TypeScript**
- **HTML & CSS**
- **Node.js**
- **RAG (conceptual architecture)**
- **Lovable (UI prototyping)**

---

## 📂 Supported Document Formats

- 📄 PDF
- 📝 DOCX (Word)
- 📑 ODF

Users can upload a document and interact with it using natural language queries.

---

## ⚙️ How the System Works (RAG Flow)

1. User uploads a document  
2. The document text is extracted  
3. Text is split into smaller chunks  
4. Relevant chunks are retrieved based on the user query  
5. AI generates responses using only the retrieved content  

⚠️ The chatbot does **not** use external knowledge or unrelated data.

---

## ✨ Features

### 📤 Document Upload
Upload supported document formats directly from the UI.

### ❓ Question Answering
Ask questions like:
- “What is this document about?”
- “Summarize the key points”
- “Explain section 3”

### 📝 Document Summarization
Generate concise summaries of long documents.

### 🔍 Context-Aware Responses
All answers are grounded in uploaded document content.

---

## 🔮 Future Scope

- Multiple document upload support  
- Answer citations with source highlighting  
- OCR for scanned PDFs  
- Backend integration using FastAPI  
- Vector databases (FAISS / Pinecone)  
- User authentication and chat history  

---

## 🚀 Getting Started

```bash
npm install
npm run dev

