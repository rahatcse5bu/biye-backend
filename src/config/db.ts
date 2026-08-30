import http from "http";
import type { Server } from "http";
import type { Express } from "express";
import "colors";
import config from "./index";
import { seedPhotocardTemplates } from "../app/modules/photocard_template/photocard_template.seed";
import { connectMongo } from "./mongo";

export async function connectDb(app: Express): Promise<Server> {
  await connectMongo();
  console.log("connection established successfully into database".green.underline);

  // Seed built-in photocard templates
  await seedPhotocardTemplates();

  const server = http.createServer(app);
  await new Promise<void>((resolve, reject) => {
    const handleError = (error: Error) => reject(error);
    server.once("error", handleError);
    server.listen(config.port, () => {
      server.off("error", handleError);
      console.log(`app listening on port=> ${config.port}`.yellow.underline);
      resolve();
    });
  });

  return server;
}
