// educationalQualification.service.ts

import mongoose, { ClientSession } from "mongoose";
import EducationalQualification from "./educational_qualification.model";
import { IEducationalQualification } from "./educational_qualification.interface";

export const EducationalQualificationService = {
  getAllEducationalQualifications: async (): Promise<
    IEducationalQualification[]
  > => {
    const qualifications = await EducationalQualification.find();
    return qualifications.map((qualification) => qualification.toObject());
  },

  getEducationalQualificationById: async (
    id: string
  ): Promise<IEducationalQualification | null> => {
    const qualification = await EducationalQualification.findById(id);
    return qualification ? qualification.toObject() : null;
  },

  getEducationalQualificationByUserId: async (
    userId: mongoose.Types.ObjectId
  ): Promise<IEducationalQualification | null> => {
    const qualification = await EducationalQualification.findOne({
      user_id: userId,
    }).lean();
    return qualification;
  },
  getEducationalQualificationByToken: async (
    userId: string
  ): Promise<IEducationalQualification | null> => {
    const qualification = await EducationalQualification.findOne({
      user: userId,
    }).lean();
    return qualification;
  },

  createEducationalQualification: async (
    data: IEducationalQualification,
    options?: { session?: ClientSession }
  ): Promise<IEducationalQualification> => {
    const createdQualification = await EducationalQualification.create(
      [data],
      options
    );
    return createdQualification[0].toObject();
  },

  updateEducationalQualification: async (
    userId: string,
    updatedFields: Partial<IEducationalQualification>
  ): Promise<IEducationalQualification | null> => {
    const updatedQualification =
      await EducationalQualification.findOneAndUpdate(
        { user: userId },
        updatedFields,
        {
          new: true,
        }
      );
    return updatedQualification ? updatedQualification.toObject() : null;
  },

  deleteEducationalQualification: async (id: string): Promise<any> => {
    await EducationalQualification.findByIdAndDelete(id);
  },
};
