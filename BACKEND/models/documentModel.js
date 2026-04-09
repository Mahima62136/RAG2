import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    required: true
  },
  chunks: [{
    content: String,
    index: Number,
    embeddings: [Number] // Plural name for better clarity
  }],
  chunkCount: {
    type: Number,
    default: 0
  },
  mimeType: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model("Document", documentSchema);