// personalInfo.service.ts
import { ClientSession } from "mongoose";
import { IPersonalInfo } from "./personal_info.interface";
import PersonalInfo from "./personal_info.model";

export const PersonalInfoService = {
  getAllPersonalInfoes: async (): Promise<IPersonalInfo[]> => {
    const personalInfoes = await PersonalInfo.find();
    return personalInfoes.map((personalInfo) => personalInfo.toObject());
  },

  getPersonalInfoById: async (id: string): Promise<IPersonalInfo | null> => {
    const personalInfo = await PersonalInfo.findById(id);
    return personalInfo ? personalInfo.toObject() : null;
  },
  getPersonalInfoByToken: async (
    user: string
  ): Promise<IPersonalInfo | null> => {
    const personalInfo = await PersonalInfo.findOne({ user }).lean();
    return personalInfo;
  },

  createPersonalInfo: async (
    personalInfoData: IPersonalInfo,
    options?: { session?: ClientSession }
  ): Promise<IPersonalInfo> => {
    const createdPersonalInfo = await PersonalInfo.create(
      [personalInfoData],
      options
    );
    return createdPersonalInfo[0].toObject();
  },

  updatePersonalInfo: async (
    id: string,
    updatedFields: Partial<IPersonalInfo>
  ): Promise<IPersonalInfo | null> => {
    const updatedPersonalInfo = await PersonalInfo.findOneAndUpdate(
      { user: id },
      updatedFields,
      {
        new: true,
      }
    );
    return updatedPersonalInfo ? updatedPersonalInfo.toObject() : null;
  },

  deletePersonalInfo: async (id: string): Promise<void> => {
    await PersonalInfo.findByIdAndDelete(id);
  },
};
