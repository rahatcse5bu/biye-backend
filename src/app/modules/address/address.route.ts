import express from "express";
import { AddressController } from "./address.controller";
const AddressRouter = express.Router();

AddressRouter.route("/")
  .get(AddressController.getAddress)
  .post(AddressController.createAddress);

AddressRouter.route("/:id")
  .get(AddressController.getSingleAddress)
  .put(AddressController.updateAddress)
  .delete(AddressController.deleteAddress);

export default AddressRouter;
