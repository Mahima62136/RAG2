# RAG 2.0 - Document-Intelligence Chatbot

RAG 2.0 is a full-stack Retrieval-Augmented Generation (RAG) application that allows users to upload documents (PDF, DOCX, TXT) and have context-aware conversations with them using Google's Gemini AI.

## 🚀 Features

- **Document Intelligence**: Upload and process documents to extract text, chunk them semantically, and generate vector embeddings.
- **Contextual Chat**: Ask questions about your documents. The system retrieves the most relevant sections (similarity search) and provides them as context to Gemini 1.5 Flash.
- **Optimistic UI**: Messages appear instantly in the chat interface for a smooth user experience.
- **Document Management**: View all uploaded documents in a dedicated sidebar dropdown and delete them when no longer needed.
- **Chat History**: Persist multiple conversations with different documents.
- **Secure Authentication**: JWT-based authentication for user accounts.
- **Visual Feedback**: Real-time typing indicators and loaders during API processing.

## 🛠️ Tech Stack

### Backend
- **Framework**: [Fastify](https://www.fastify.io/) (High-performance Node.js framework)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **AI/LLM**: [Google Gemini API](https://ai.google.dev/) (Generative AI & Embeddings)
- **File Processing**: `unpdf`, `mammoth` (for PDF/DOCX extraction)
- **Vector Search**: Custom Cosine Similarity implementation
- **Logging**: `pino-pretty` for human-readable terminal output

### Frontend
- **Framework**: [React](https://reactjs.org/) (Vite-powered)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Vanilla CSS (Modern, responsive layout)
- **API Client**: Axios

## 📋 Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas)
- Google Gemini API Key (Get it from [Google AI Studio](https://aistudio.google.com/))

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "RAG 2.0"
```

### 2. Backend Configuration
Navigate to the `BACKEND` folder:
```bash
cd BACKEND
npm install
```
Create a `.env` file in the `BACKEND` directory:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Frontend Configuration
Navigate to the `FRONTEND` folder:
```bash
cd ../FRONTEND
npm install
```
Ensure your backend is running on `http://localhost:3000` or update the API client base URL in `src/api/client.js`.

### 4. Running the Application
**Start Backend:**
```bash
cd BACKEND
node server.js
```
**Start Frontend:**
```bash
cd FRONTEND
npm run dev
```

## 📂 Project Structure

```text
C:\RAG 2.0\
├── BACKEND\
│   ├── controllers\    # Request logic
│   ├── models\         # Mongoose schemas
│   ├── routes\         # API endpoints
│   ├── services\       # AI, Embeddings, and Text Extraction logic
│   └── uploads\        # Stored documents
└── FRONTEND\
    ├── src\
    │   ├── components\ # Reusable UI pieces (ChatWindow, Sidebar, etc.)
    │   ├── pages\      # Main views (Chat, Login, Signup)
    │   └── api\        # Axios configuration
```


