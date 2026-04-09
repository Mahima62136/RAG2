import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { systemPrompt } from "./systemPrompt.js";
import { generateEmbeddings } from "./embedding.js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}

/**
 * Get relevant context from a document based on the query.
 */
function getRelevantContext(queryEmbedding, document, topK = 3) {
  if (!document || !document.chunks || document.chunks.length === 0) return [];

  const threshold = 0.60; // 60% similarity threshold

  const similarities = document.chunks.map((chunk) => {
    // Safety check: ensure embeddings exist before calculating similarity
    if (!chunk.embeddings || !Array.isArray(chunk.embeddings)) {
      return { content: chunk.content, similarity: 0 };
    }
    const score = cosineSimilarity(queryEmbedding, chunk.embeddings);
    return {
      content: chunk.content,
      similarity: score,
    };
  });

  // Sort by similarity and filter by threshold
  const matchingChunks = similarities
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  console.log(`Found ${matchingChunks.length} chunks meeting the 80% similarity threshold.`);
  
  return matchingChunks;
}

/**
 * Generate a response using Gemini API with system prompt and context.
 */
export const generateChatResponse = async (query, chatHistory, document) => {
  // Use gemini-1.5-flash for reliability and speed
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  let sources = [];
  let contextStr = "";
  if (document) {
    const queryEmbeddingResult = await generateEmbeddings([query]);
    const queryEmbedding = queryEmbeddingResult[0];
    sources = getRelevantContext(queryEmbedding, document, 3);
    contextStr = sources.map((c) => c.content).join("\n\n");
  }

  // Extract the last 10 messages from chat history (excluding the very last one which is the current query)
  const recentHistory = chatHistory?.slice(-11, -1) || [];
  const historyStr = recentHistory.map(msg =>
    `${msg.role === 'user' ? 'USER' : 'ASSISTANT'}: ${msg.content}`
  ).join('\n\n');

  const prompt = `
${systemPrompt}

PREVIOUS CHAT HISTORY (Last 10 messages):
${historyStr || "No previous history."}

DOCUMENT CONTEXT (Relevant to the current query):
${contextStr || "No document context provided."}

CURRENT USER QUERY:
${query}

ASSISTANT:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return { answer: response.text(), sources: sources };
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw new Error("Failed to generate response from Gemini.");
  }
};
