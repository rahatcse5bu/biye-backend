// contact.service.ts
import { ClientSession } from "mongoose";
import { IContact } from "./contact.interface";
import Contact from "./contact.model";

export const ContactService = {
  getAllContacts: async (): Promise<IContact[]> => {
    const contacts = await Contact.find();
    return contacts.map((contact) => contact.toObject());
  },

  getContactById: async (id: string): Promise<IContact | null> => {
    const contact = await Contact.findById(id);
    return contact ? contact.toObject() : null;
  },
  getContactByToken: async (user: string): Promise<IContact | null> => {
    const contact = await Contact.findOne({ user }).lean();
    return contact;
  },

  createContact: async (
    contactData: IContact,
    options?: { session?: ClientSession }
  ): Promise<IContact> => {
    const createdContact = await Contact.create([contactData], options);
    return createdContact[0].toObject();
  },

  updateContact: async (
    id: string,
    updatedFields: Partial<IContact>
  ): Promise<IContact | null> => {
    const updatedContact = await Contact.findOneAndUpdate(
      { user: id },
      updatedFields,
      {
        new: true,
      }
    );
    return updatedContact ? updatedContact.toObject() : null;
  },

  deleteContact: async (id: string): Promise<void> => {
    await Contact.findByIdAndDelete(id);
  },
};
