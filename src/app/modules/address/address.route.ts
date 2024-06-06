import express from "express";
import { auth } from "../../middlewares/auth";
import { AddressController } from "./address.controller";
const AddressRouter = express.Router();

AddressRouter.route("/")
  .get(AddressController.getAllAddresses)
  .put(auth("user", "admin"), AddressController.updateAddress)
  .post(auth("user", "admin"), AddressController.createAddress);

AddressRouter.route("/token").get(
  auth("user", "admin"),
  AddressController.getAddressByToken
);
AddressRouter.route("/:id")
  .get(AddressController.getAddressById)
  .delete(AddressController.deleteAddress);

export default AddressRouter;
