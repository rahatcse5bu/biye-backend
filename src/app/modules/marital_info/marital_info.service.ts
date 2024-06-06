// maritalInfo.service.ts
import { ClientSession } from "mongoose";
import { IMaritalInfo } from "./marital_info.interface";
import MaritalInfo from "./marital_info.model";

export const MaritalInfoService = {
  getAllMaritalInfos: async (): Promise<IMaritalInfo[]> => {
    const maritalInfos = await MaritalInfo.find();
    return maritalInfos.map((maritalInfo) => maritalInfo.toObject());
  },

  getMaritalInfoById: async (id: string): Promise<IMaritalInfo | null> => {
    const maritalInfo = await MaritalInfo.findById(id);
    return maritalInfo ? maritalInfo.toObject() : null;
  },
  getMaritalInfoByToken: async (user: string): Promise<IMaritalInfo | null> => {
    const maritalInfo = await MaritalInfo.findOne({ user }).lean();
    return maritalInfo;
  },

  createMaritalInfo: async (
    maritalInfoData: IMaritalInfo,
    options?: { session?: ClientSession }
  ): Promise<IMaritalInfo> => {
    const createdMaritalInfo = await MaritalInfo.create(
      [maritalInfoData],
      options
    );
    return createdMaritalInfo[0].toObject();
  },

  updateMaritalInfo: async (
    id: string,
    updatedFields: Partial<IMaritalInfo>
  ): Promise<IMaritalInfo | null> => {
    const updatedMaritalInfo = await MaritalInfo.findOneAndUpdate(
      { user: id },
      updatedFields,
      {
        new: true,
      }
    );
    return updatedMaritalInfo ? updatedMaritalInfo.toObject() : null;
  },

  deleteMaritalInfo: async (id: string): Promise<void> => {
    await MaritalInfo.findByIdAndDelete(id);
  },
};
