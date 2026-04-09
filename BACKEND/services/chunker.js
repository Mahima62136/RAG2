import natural from 'natural';

/**
 * Advanced NLP-based chunking method.
 * Uses sentence tokenization and semantic groupings.
 */
export const nlpChunker = (text, options = {}) => {
  if (!text) return [];

  const {
    maxChunkSize = 1000, // Character limit per chunk
    minChunkSize = 200,   // Minimum size to avoid tiny fragments
    overlap = 100        // Overlap characters between chunks for context
  } = options;

  // 1. Tokenize into sentences using Natural
  const tokenizer = new natural.SentenceTokenizer();
  const sentences = tokenizer.tokenize(text);

  const chunks = [];
  let currentChunk = "";

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;

    // Check if adding the next sentence exceeds max size
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length >= minChunkSize) {
      chunks.push({ 
        content: currentChunk.trim(), 
        index: chunks.length 
      });
      
      // Handle overlap: take some text from the end of the previous chunk
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + " " + sentence + " ";
    } else {
      currentChunk += sentence + " ";
    }
  }

  // Push the last chunk
  if (currentChunk.trim()) {
    chunks.push({ 
      content: currentChunk.trim(), 
      index: chunks.length 
    });
  }

  // If even with sentence splitting it's only 1 chunk but still very large, 
  // do a hard character-based split as fallback (rare with sentence tokenizing)
  if (chunks.length === 1 && chunks[0].content.length > maxChunkSize * 1.5) {
    return hardSplit(text, maxChunkSize, overlap);
  }

  return chunks;
};

// Fallback for extremely long blocks without sentence markers
const hardSplit = (text, size, overlap) => {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push({
      content: text.slice(start, end).trim(),
      index: chunks.length
    });
    start += (size - overlap);
    if (start >= text.length - overlap) break;
  }
  return chunks;
};

// Keep the keyword chunker but make it more robust if you want to use it
export const keywordChunker = nlpChunker; 
