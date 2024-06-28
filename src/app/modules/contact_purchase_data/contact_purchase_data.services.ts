// contactPurchase.service.ts
import { ClientSession } from "mongoose";
import ContactPurchase from "./contact_purchase_data.model";
import { IContactPurchase } from "./contact_purchase_data.interface";
import mongoose from "mongoose";

export const ContactPurchaseService = {
  getAllContactPurchases: async (): Promise<IContactPurchase[]> => {
    const contactPurchases = await ContactPurchase.find();
    return contactPurchases.map((contactPurchase: { toObject: () => any }) =>
      contactPurchase.toObject()
    );
  },

  getContactPurchaseByUserAndBioUser: async (
    user: string,
    bio_user: string,
    options: any = {}
  ): Promise<IContactPurchase | null> => {
    const contactPurchase = await ContactPurchase.findOne({
      user,
      bio_user,
    })
      .session(options.session)
      .lean();
    return contactPurchase;
  },

  getContactPurchaseById: async (
    id: string
  ): Promise<IContactPurchase | null> => {
    const contactPurchase = await ContactPurchase.findById(id);
    return contactPurchase ? contactPurchase.toObject() : null;
  },
  getContactPurchaseByToken: async (
    user: string
  ): Promise<IContactPurchase | null> => {
    const contactPurchase: any = await ContactPurchase.findOne({ user }).lean();
    return contactPurchase;
  },
  createContactPurchase: async (
    contactPurchaseData: IContactPurchase,
    options: { session?: mongoose.ClientSession } = {}
  ): Promise<IContactPurchase> => {
    const createdContactPurchase = await ContactPurchase.create(
      [contactPurchaseData],
      { session: options.session }
    );
    return createdContactPurchase[0];
  },
  // createContactPurchase: async (
  //   contactPurchaseData: IContactPurchase
  // ): Promise<IContactPurchase> => {
  //   const createdContactPurchase = await ContactPurchase.create(
  //     contactPurchaseData
  //   );
  //   return createdContactPurchase;
  // },

  updateContactPurchase: async (
    id: string,
    updatedFields: Partial<IContactPurchase>
  ): Promise<IContactPurchase | null> => {
    const updatedContactPurchase = await ContactPurchase.findOneAndUpdate(
      { user: id },
      updatedFields,
      {
        new: true,
      }
    );
    return updatedContactPurchase ? updatedContactPurchase.toObject() : null;
  },

  deleteContactPurchase: async (id: string): Promise<void> => {
    await ContactPurchase.findByIdAndDelete(id);
  },
};
