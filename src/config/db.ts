import mongoose from "mongoose";
import http from "http";
import "colors";
import config from "./index";
import { seedPhotocardTemplates } from "../app/modules/photocard_template/photocard_template.seed";

export async function connectDb(app: any) {
  let server: any;
  try {
    await mongoose.connect(config.mongo_url as string);
    console.log(
      "connection established successfully into database".green.underline
    );

    // Seed built-in photocard templates
    await seedPhotocardTemplates();

    server = http.createServer(app);
    server.listen(config.port, () => {
      console.log(`app listening on port=> ${config.port}`.yellow.underline);
    });
  } catch (err) {
    console.error(err);
  }

  process.on("unhandledRejection", (error) => {
    // eslint-disable-next-line no-console
    console.log(
      "Unhandled Rejection is detected ,we are closing our server".red.underline
    );
    if (server) {
      server.close(() => {
        console.error(error);
        process.exit(1);
      });
    } else {
      console.log(error);
      process.exit(1);
    }
  });
}
