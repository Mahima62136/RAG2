import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate embeddings (768 dimensions) using correct embedding API
 */
export const generateEmbeddings = async (chunksArr) => {
  if (!chunksArr || chunksArr.length === 0) return [];

  try {
    console.log("[RAG Pipeline] Embedding Model: -------------------");

    const allEmbeddings = [];

    for (const text of chunksArr) {
      const model = genAI.getGenerativeModel({
        model: "gemini-embedding-001" // ✅ CORRECT
      });

      const res = await model.embedContent({
        content: { parts: [{ text }] }
      });

      const embedding = res.embedding.values;

      console.log("Embedding dimension:", embedding.length); // MUST BE 768

      allEmbeddings.push(embedding);
    }

    return allEmbeddings;

  } catch (error) {
    console.error("[RAG Pipeline] Embedding Error:", error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
};