import Chat from "../models/chatModel.js";
import { generateChatResponse } from "../services/geminiChat.js";

// Controller: Return all chats for the authenticated user.
// This is used by the sidebar to display the user's conversation list.
export const getChatsController = async (req, reply) => {
  try {
    const userId = req.user.id;
    const chats = await Chat.find({ user: userId })
      .select({ 'messages.sources.embeddings': 0 })
      .sort({ updatedAt: -1 });
    return reply.send({ success: true, chats });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ success: false, message: "Internal Server Error" });
  }
};

// Controller: Return a single chat by ID, including its linked document.
// Used when the frontend loads the selected chat conversation.
export const getChatByIdController = async (req, reply) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const chat = await Chat.findOne({ _id: id, user: userId })
      .populate({
        path: 'document',
        select: '-chunks.embeddings -extractedText' // Don't send heavy chunks/text by default
      })
      .select({ 'messages.sources.embeddings': 0 });

    if (!chat) {
      return reply.code(404).send({ success: false, message: "Chat not found" });
    }

    return reply.send({ success: true, chat });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ success: false, message: "Internal Server Error" });
  }
};

// Controller: Create a fresh chat for the current user.
// If no title is provided, the chat starts as "New Chat".
export const createChatController = async (req, reply) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;
    const chat = await Chat.create({ user: userId, title: title || "New Chat" });

    return reply.code(201).send({ success: true, chat });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ success: false, message: "Internal Server Error" });
  }
};

// Controller: Handle a user message for a chat.
// This adds the user's message, generates the assistant response, saves both, and returns the updated chat.
export const sendMessageController = async (req, reply) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { message } = req.body;

    const chat = await Chat.findOne({ _id: id, user: userId })
      .populate('document');
    if (!chat) {
      return reply.code(404).send({ success: false, message: "Chat not found" });
    }

    // If this is the first message in a brand new chat,
    // update the default title to something meaningful.
    if (chat.messages.length === 0 && chat.title === "New Chat") {
      chat.title = message.length > 30 ? message.substring(0, 30) + '...' : message;
    }

    // Save the user's message into the chat history.
    chat.messages.push({ role: 'user', content: message });

    // Generate the assistant answer using Gemini and any document context.
    const { answer, sources } = await generateChatResponse(message, chat.messages, chat.document);

    // Save the assistant response and any source references.
    chat.messages.push({ role: 'assistant', content: answer, sources });
    await chat.save();

    return reply.send({ success: true, answer, sources, chat });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ success: false, message: "Internal Server Error during chat generation" });
  }
};

// Controller: Delete a user chat.
// This removes the chat record and returns a success message.
export const deleteChatController = async (req, reply) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const chat = await Chat.findOneAndDelete({ _id: id, user: userId });

    if (!chat) {
      return reply.code(404).send({ success: false, message: "Chat not found" });
    }

    return reply.send({ success: true, message: "Chat deleted" });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ success: false, message: "Internal Server Error during chat deletion" });
  }
};
