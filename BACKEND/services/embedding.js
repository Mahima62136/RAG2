import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate embeddings for multiple chunks of text using the official @google/generative-ai SDK.
 * @param {Array<String>} chunksArr - Array of text contents.
 * @returns {Promise<Array<Array<Number>>>} - Array of embeddings.
 */
export const generateEmbeddings = async (chunksArr) => {
  if (!chunksArr || chunksArr.length === 0) return [];

  try {
    const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });

    // Gemini API supports batching multiple contents in one request.
    // We process in batches of 100 to stay safely within possible payload limits.
    const batchSize = 100;
    const allEmbeddings = [];

    for (let i = 0; i < chunksArr.length; i += batchSize) {
      const currentBatch = chunksArr.slice(i, i + batchSize);
      
      const res = await model.batchEmbedContents({
        requests: currentBatch.map(text => ({
          content: { role: 'user', parts: [{ text }] }
        }))
      });

      if (res.embeddings) {
        allEmbeddings.push(...res.embeddings.map(e => e.values));
      }
    }

    return allEmbeddings;
  } catch (error) {
    import('fs').then(fs => fs.default.writeFileSync('error.log', JSON.stringify(error, Object.getOwnPropertyNames(error), 2)));
    console.error("DEBUG: Embedding Error:", error.message);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
};
