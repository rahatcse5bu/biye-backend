// address.service.ts
import { ClientSession } from "mongoose";
import { IAddress } from "./address.interface";
import Address from "./address.model";

export const AddressService = {
  getAllAddresses: async (): Promise<IAddress[]> => {
    const addresses = await Address.find();
    return addresses.map((address) => address.toObject());
  },

  getAddressById: async (id: string): Promise<IAddress | null> => {
    const address = await Address.findById(id);
    return address ? address.toObject() : null;
  },
  getAddressByToken: async (user: string): Promise<IAddress | null> => {
    const address = await Address.findOne({ user }).lean();
    return address;
  },

  createAddress: async (
    addressData: IAddress,
    options?: { session?: ClientSession }
  ): Promise<IAddress> => {
    const createdAddress = await Address.create([addressData], options);
    return createdAddress[0].toObject();
  },

  updateAddress: async (
    id: string,
    updatedFields: Partial<IAddress>
  ): Promise<IAddress | null> => {
    const updatedAddress = await Address.findOneAndUpdate(
      { user: id },
      updatedFields,
      {
        new: true,
      }
    );
    return updatedAddress ? updatedAddress.toObject() : null;
  },

  deleteAddress: async (id: string): Promise<void> => {
    await Address.findByIdAndDelete(id);
  },
};
