import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document"
  },
  title: {
    type: String,
    default: "New Chat"
  },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'] },
    content: { type: String },
    timestamp: { type: Date, default: Date.now },
    sources: [{
      content: String,
      similarity: Number
    }]
  }]
}, { timestamps: true });

export default mongoose.model("Chat", chatSchema);