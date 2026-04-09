import { pipeline } from 'node:stream/promises';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractTextFromFile } from '../services/textExtractor.js';
import { nlpChunker } from '../services/chunker.js';
import { generateEmbeddings } from '../services/embedding.js';
import Document from '../models/documentModel.js';
import Chat from '../models/chatModel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Controller: Handle file upload for document processing.
// This processes a user's uploaded file, extracts text, chunks it, generates embeddings, and links it to a chat.
export const uploadFileController = async (req, reply) => {
  try {
    const data = await req.file();
    const userId = req.user.id;
    const { chatId } = req.query; // If chatId is provided, we're uploading to an existing chat

    // First, check if the target chat already has a document attached.
    // Each chat can only have one document to keep things simple.
    if (chatId) {
      const existingChat = await Chat.findOne({ _id: chatId, user: userId });
      if (existingChat && existingChat.document) {
        return reply.code(400).send({
          success: false,
          message: "Warning: This chat already has a document. Only one document is allowed per chat."
        });
      }
    }

    // Ensure a file was actually uploaded.
    if (!data) {
      return reply.code(400).send({
        success: false,
        message: "No file uploaded"
      });
    }

    // Validate the file type - only allow PDF, DOCX, and TXT for now.
    const allowedExtensions = ['.pdf', '.docx', '.txt'];
    const fileExtension = path.extname(data.filename).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      return reply.code(400).send({
        success: false,
        message: "Unsupported file format. Only .pdf, .docx, and .txt are allowed."
      });
    }

    // Save the uploaded file to the server's uploads directory.
    const fileName = `${Date.now()}-${data.filename}`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    await pipeline(data.file, fs.createWriteStream(filePath));

    // Extract the text content from the file (e.g., OCR for PDFs, parsing for DOCX).
    const extractedText = await extractTextFromFile(filePath);

    // Break the text into smaller, meaningful chunks for better AI processing.
    // This uses NLP to split on sentence boundaries with some overlap for context.
    const rawChunks = nlpChunker(extractedText, {
      maxChunkSize: 1000, // Max 1000 characters per chunk
      overlap: 200        // Include context from previous chunk
    });

    // Generate vector embeddings for each chunk using Gemini.
    // These embeddings allow semantic search over the document content.
    const chunkContents = rawChunks.map(c => c.content);
    const embeddings = await generateEmbeddings(chunkContents);

    // Combine the chunks with their corresponding embeddings.
    const chunksWithEmbeddings = rawChunks.map((c, i) => ({
      ...c,
      embeddings: embeddings[i] // plural
    }));

    // Save the processed document to the database, including all chunks and embeddings.
    const newDocument = await Document.create({
      user: userId,
      fileName,
      originalName: data.filename,
      filePath: `/uploads/${fileName}`,
      extractedText,
      chunks: chunksWithEmbeddings,
      chunkCount: chunksWithEmbeddings.length,
      mimeType: data.mimetype
    });

    // Link the new document to an existing chat or create a new chat for it.
    let chat;
    if (chatId) {
      chat = await Chat.findOneAndUpdate(
        { _id: chatId, user: userId },
        { document: newDocument._id },
        { new: true }
      );
    } else {
      chat = await Chat.create({
        user: userId,
        document: newDocument._id,
        title: `Chat with ${data.filename}`
      });
    }

    // Return success with details about the uploaded document and chat.
    // We explicitly avoid sending chunks or embeddings here 
    return reply.send({
      success: true,
      message: "File uploaded, text extracted, and chunked successfully",
      chatId: chat._id,
      document: {
        id: newDocument._id,
        fileName: newDocument.fileName,
        originalName: newDocument.originalName,
        chunkCount: chunksWithEmbeddings.length
      }
    });

  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error during file upload or text extraction"
    });
  }
};

// Controller: List all documents uploaded by the authenticated user.
// This returns a summary of the user's documents without the heavy text/chunks data.
export const getUserDocumentsController = async (req, reply) => {
  try {
    const userId = req.user.id;
    const documents = await Document.find({ user: userId }).select("-extractedText -chunks.embeddings");

    return reply.send({
      success: true,
      documents
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error while fetching documents"
    });
  }
};

// Controller: Attach an existing document to a chat.
// This allows users to select a previously uploaded document for a specific chat.
export const selectDocumentForChatController = async (req, reply) => {
  try {
    const userId = req.user.id;
    const { chatId, documentId } = req.body;

    // Ensure the chat exists and belongs to the user.
    const chat = await Chat.findOne({ _id: chatId, user: userId });
    if (!chat) return reply.code(404).send({ success: false, message: "Chat not found" });

    // Check if the chat already has a document.
    if (chat.document) {
      return reply.code(400).send({
        success: false,
        message: "Warning: This chat already has a document."
      });
    }

    // Ensure the document exists and belongs to the user.
    const document = await Document.findOne({ _id: documentId, user: userId });
    if (!document) return reply.code(404).send({ success: false, message: "Document not found" });

    // Link the document to the chat and save.
    chat.document = documentId;
    await chat.save();

    return reply.send({
      success: true,
      message: "Document selected for chat successfully",
      chatId: chat._id 
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// Controller: Delete a specific document uploaded by the user.
// This removes the database entry, the physical file, and clears it from any chats.
export const deleteDocumentController = async (req, reply) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const document = await Document.findOne({ _id: id, user: userId });
    if (!document) {
      return reply.code(404).send({ success: false, message: "Document not found" });
    }

    // Remove file from disk
    const fileName = path.basename(document.filePath);
    const absolutePath = path.join(UPLOADS_DIR, fileName);
    
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    // Clear document references from any chats using it
    await Chat.updateMany({ document: id }, { $unset: { document: "" } });

    // Delete the document record
    await Document.findByIdAndDelete(id);

    return reply.send({
      success: true,
      message: "Document deleted successfully"
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error during document deletion"
    });
  }
};