import Fastify from "fastify";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";

import jwtPlugin from "./plugins/jwtPlugin.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config({ quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = Fastify({ 
  // logger: {
  //   transport: {
  //     target: 'pino-pretty',
  //     options: {
  //       translateTime: 'HH:MM:ss Z',
  //       ignore: 'pid,hostname',
  //     },
  //   },
  // }
});

// plugins
await app.register(cors, {
  origin: true, // Allows all origins or you can specify 'http://localhost:5173'
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
});
await app.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 10MB limit
  },
  
});

await app.register(fastifyStatic, {
  root: path.join(__dirname, "uploads"),
  prefix: "/uploads/",
});

await app.register(jwtPlugin);

// routes
await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(uploadRoutes, { prefix: "/api/upload" });
await app.register(chatRoutes, { prefix: "/api/chat" });

// DB connection
await mongoose.connect(process.env.MONGO_URI);

// start server
const start = async () => {
  try {
    await app.listen({ port: 3000 });
    console.log("Server running 🚀");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();