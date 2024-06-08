// @ts-ignore
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

export default {
  port: process.env.PORT,
  node_env: process.env.NODE_ENV,
  jwt_secret: process.env.JWT_SECRET,
  sand_box: process.env.SANDBOX,
  bkash_app_secret: process.env.BKASH_APP_SECRET,
  bkash_app_key: process.env.BKASH_APP_KEY,
  bkash_username: process.env.BKASH_USER_NAME,
  bkash_password: process.env.BKASH_PASSWORD,
  mongo_url:
    process.env["NODE_ENV"] === "development"
      ? process.env["MONG_DEV_URL"]
      : process.env["MONG_PROD_URL"],
};
