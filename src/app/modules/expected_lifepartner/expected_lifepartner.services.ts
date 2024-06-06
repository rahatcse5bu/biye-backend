// expectedPartner.service.ts
import { ClientSession } from "mongoose";
import { IExpectedPartner } from "./expected_lifepartner.interface";
import ExpectedPartner from "./expected_lifepartner.model";

export const ExpectedPartnerService = {
  getAllExpectedPartners: async (): Promise<IExpectedPartner[]> => {
    const expectedPartners = await ExpectedPartner.find();
    return expectedPartners.map((expectedPartner) =>
      expectedPartner.toObject()
    );
  },

  getExpectedPartnerById: async (
    id: string
  ): Promise<IExpectedPartner | null> => {
    const expectedPartner = await ExpectedPartner.findById(id);
    return expectedPartner ? expectedPartner.toObject() : null;
  },
  getExpectedPartnerByToken: async (
    user: string
  ): Promise<IExpectedPartner | null> => {
    const expectedPartner = await ExpectedPartner.findOne({ user }).lean();
    return expectedPartner;
  },

  createExpectedPartner: async (
    expectedPartnerData: IExpectedPartner,
    options?: { session?: ClientSession }
  ): Promise<IExpectedPartner> => {
    const createdExpectedPartner = await ExpectedPartner.create(
      [expectedPartnerData],
      options
    );
    return createdExpectedPartner[0].toObject();
  },

  updateExpectedPartner: async (
    id: string,
    updatedFields: Partial<IExpectedPartner>
  ): Promise<IExpectedPartner | null> => {
    const updatedExpectedPartner = await ExpectedPartner.findOneAndUpdate(
      { user: id },
      updatedFields,
      {
        new: true,
      }
    );
    return updatedExpectedPartner ? updatedExpectedPartner.toObject() : null;
  },

  deleteExpectedPartner: async (id: string): Promise<void> => {
    await ExpectedPartner.findByIdAndDelete(id);
  },
};
