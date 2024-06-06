// services/familyStatus.service.ts
import mongoose from "mongoose";
import { IFamilyStatus } from "./family_status.interface";
import FamilyStatus from "./family_status.model";

export const FamilyStatusService = {
  getAllFamilyStatuses: async (): Promise<IFamilyStatus[]> => {
    return FamilyStatus.find().lean();
  },

  getFamilyStatusById: async (id: string): Promise<IFamilyStatus | null> => {
    return FamilyStatus.findById(id).lean();
  },
  getFamilyStatusByToken: async (
    user: string
  ): Promise<IFamilyStatus | null> => {
    return FamilyStatus.findOne({ user }).lean();
  },

  getFamilyStatusByUserId: async (
    userId: string
  ): Promise<IFamilyStatus | null> => {
    return FamilyStatus.findOne({ user: userId }).lean();
  },

  createFamilyStatus: async (
    data: Partial<IFamilyStatus>,
    session: mongoose.ClientSession
  ): Promise<IFamilyStatus> => {
    const newFamilyStatus = new FamilyStatus(data);
    await newFamilyStatus.save({ session });
    return newFamilyStatus;
  },

  updateFamilyStatus: async (
    userId: string,
    data: Partial<IFamilyStatus>
  ): Promise<IFamilyStatus | null> => {
    return FamilyStatus.findOneAndUpdate({ user: userId }, data, {
      new: true,
    }).lean();
  },

  deleteFamilyStatus: async (id: string): Promise<IFamilyStatus | null> => {
    return FamilyStatus.findByIdAndDelete(id).lean();
  },
};
