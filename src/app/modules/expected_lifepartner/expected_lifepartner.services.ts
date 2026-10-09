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
        runValidators: true,
      }
    );
    return updatedExpectedPartner ? updatedExpectedPartner.toObject() : null;
  },

  // TODO: one record per user; a repeat create (double click, failed load) updates instead of duplicating.
  upsertExpectedPartner: async (
    userId: string,
    fields: Partial<IExpectedPartner>,
    options?: { session?: ClientSession }
  ): Promise<{ record: IExpectedPartner; created: boolean }> => {
    const existing = await ExpectedPartner.findOne({ user: userId }).session(options?.session || null);
    const update = { ...fields, user: userId };
    const settings = { new: true, runValidators: true, session: options?.session };
    try {
      const record = await ExpectedPartner.findOneAndUpdate({ user: userId }, update, {
        ...settings,
        upsert: true,
        setDefaultsOnInsert: true,
      });
      return { record: record!.toObject(), created: !existing };
    } catch (error: any) {
      // TODO: a simultaneous save won the insert; apply this one as an update to that record.
      if (error?.code !== 11000) throw error;
      const record = await ExpectedPartner.findOneAndUpdate({ user: userId }, update, settings);
      return { record: record!.toObject(), created: false };
    }
  },

  deleteExpectedPartner: async (id: string): Promise<void> => {
    await ExpectedPartner.findByIdAndDelete(id);
  },
};
