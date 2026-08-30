import mongoose from "mongoose";
import type { Server } from "http";
import app from "./app";
import { connectDb } from "./config/db";

let server: Server | undefined;
let isShuttingDown = false;

const shutdown = async (exitCode: number, error?: unknown) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (error) console.error(error);

  if (server) {
    const activeServer = server;
    await new Promise<void>((resolve) => activeServer.close(() => resolve()));
  }

  await mongoose.disconnect();
  process.exit(exitCode);
};

process.on("SIGINT", () => void shutdown(0));
process.on("SIGTERM", () => void shutdown(0));
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection; shutting down the server");
  void shutdown(1, error);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception; shutting down the server");
  void shutdown(1, error);
});

const startServer = async () => {
  try {
    server = await connectDb(app);
  } catch (error) {
    console.error("Failed to start the server");
    await shutdown(1, error);
  }
};

void startServer();
