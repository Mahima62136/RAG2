import {
  getChatsController,
  getChatByIdController,
  createChatController,
  sendMessageController,
  deleteChatController
} from "../controllers/chatController.js";

export default async function (fastify, options) {
  fastify.get("/", { preHandler: [fastify.authenticate] }, getChatsController);
  fastify.get("/:id", { preHandler: [fastify.authenticate] }, getChatByIdController);
  fastify.post("/", { preHandler: [fastify.authenticate] }, createChatController);
  fastify.post("/:id/message", { preHandler: [fastify.authenticate] }, sendMessageController);
  fastify.delete("/:id", { preHandler: [fastify.authenticate] }, deleteChatController);
}
