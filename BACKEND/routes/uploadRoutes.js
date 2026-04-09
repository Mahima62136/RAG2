import { 
  uploadFileController, 
  getUserDocumentsController, 
  selectDocumentForChatController,
  deleteDocumentController
} from "../controllers/uploadController.js";

export default async function (fastify, options) {
  // Upload a new document (optionally for a specific chat via ?chatId=...)
  fastify.post("/", { preHandler: [fastify.authenticate] }, uploadFileController);

  // List all documents uploaded by the user
  fastify.get("/list", { preHandler: [fastify.authenticate] }, getUserDocumentsController);

  // Select an existing document for an existing chat
  fastify.post("/select", { preHandler: [fastify.authenticate] }, selectDocumentForChatController);

  // Delete a specific document
  fastify.delete("/:id", { preHandler: [fastify.authenticate] }, deleteDocumentController);
}