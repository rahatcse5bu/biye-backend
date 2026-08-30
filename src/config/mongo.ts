import mongoose from "mongoose";
import "colors";
import config from "./index";

const SERVER_SELECTION_TIMEOUT_MS = 10_000;
let connectionPromise: Promise<typeof mongoose> | null = null;

mongoose.connection.on("disconnected", () => {
  connectionPromise = null;
  console.error("MongoDB connection lost; waiting to reconnect");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB connection re-established".green.underline);
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

export async function connectMongo(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === mongoose.ConnectionStates.connected) {
    return mongoose;
  }

  if (!config.mongo_url) {
    throw new Error(
      `MongoDB URL is not configured for NODE_ENV=${config.node_env || "undefined"}`
    );
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(config.mongo_url, {
        serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
}
