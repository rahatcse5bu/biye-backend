import express from "express";
import { auth } from "../../middlewares/auth";
import { ShortlistController } from "./shortlist.controller";

const ShortlistRouter = express.Router();

// Toggle shortlist + Get my shortlist
ShortlistRouter.route("/")
  .post(auth("user", "admin"), ShortlistController.toggleShortlist)
  .get(auth("user", "admin"), ShortlistController.getMyShortlist);

// Check if a bio is shortlisted
ShortlistRouter.route("/check/:id").get(
  auth("user", "admin"),
  ShortlistController.checkShortlist
);

// Get who shortlisted my biodata
ShortlistRouter.route("/who-shortlisted-me").get(
  auth("user", "admin"),
  ShortlistController.getWhoShortlistedMe
);

export default ShortlistRouter;
