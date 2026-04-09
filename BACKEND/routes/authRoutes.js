
import {
  signupController,
  loginController,
  getMeController
} from "../controllers/authController.js";

export default async function (fastify, options) {

  fastify.post("/signup", signupController);

  fastify.post("/login", loginController);

  fastify.get(
    "/me",
    { preHandler: [fastify.authenticate] },
    getMeController
  );
}