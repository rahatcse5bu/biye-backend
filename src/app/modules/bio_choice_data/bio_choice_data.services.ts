// bioChoice.service.ts
import { ClientSession } from "mongoose";
import { IBioChoice } from "./bio_choice_data.interface";
import BioChoice from "./bio_choice_data.model";

export const BioChoiceService = {
  getAllBioChoices: async (): Promise<IBioChoice[]> => {
    const bioChoices = await BioChoice.find();
    return bioChoices.map((bioChoice) => bioChoice.toObject());
  },

  getBioChoiceById: async (id: string): Promise<IBioChoice | null> => {
    const bioChoice = await BioChoice.findById(id);
    return bioChoice ? bioChoice.toObject() : null;
  },
  checkBioChoiceExist: async (
    query: Partial<IBioChoice>
  ): Promise<IBioChoice | null> => {
    const bioChoice = await BioChoice.findOne(query).lean();
    return bioChoice ? bioChoice : null;
  },
  getBioChoiceByToken: async (user: string): Promise<IBioChoice | null> => {
    const bioChoice = await BioChoice.findOne({ user }).lean();
    return bioChoice;
  },
  createBioChoice: async (data: any, options: { session: ClientSession }) => {
    return await BioChoice.create([data], options);
  },
  // createBioChoice: async (bioChoiceData: IBioChoice): Promise<IBioChoice> => {
  //   const createdBioChoice = await BioChoice.create(bioChoiceData);
  //   return createdBioChoice.toObject();
  // },
  checkBioChoiceDataOfFirstStep: async (
    query: any
  ): Promise<IBioChoice | null> => {
    const bioChoice = await BioChoice.findOne(query).lean();
    return bioChoice;
  },

  updateBioChoice: async (
    query: any,
    updatedFields: Partial<IBioChoice>
  ): Promise<IBioChoice | null> => {
    const updatedBioChoice = await BioChoice.findOneAndUpdate(
      query,
      updatedFields,
      {
        new: true,
      }
    );
    return updatedBioChoice ? updatedBioChoice.toObject() : null;
  },

  deleteBioChoice: async (id: string): Promise<void> => {
    await BioChoice.findByIdAndDelete(id);
  },
};
