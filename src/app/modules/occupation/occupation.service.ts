// occupation.service.ts
import { ClientSession } from "mongoose";
import { IOccupation } from "./occupation.interface";
import Occupation from "./occupation.model";

export const OccupationService = {
  getAllOccupationes: async (): Promise<IOccupation[]> => {
    const occupationes = await Occupation.find();
    return occupationes.map((occupation) => occupation.toObject());
  },

  getOccupationById: async (id: string): Promise<IOccupation | null> => {
    const occupation = await Occupation.findById(id);
    return occupation ? occupation.toObject() : null;
  },
  getOccupationByToken: async (user: string): Promise<IOccupation | null> => {
    const occupation = await Occupation.findOne({ user }).lean();
    return occupation;
  },

  createOccupation: async (
    occupationData: IOccupation,
    options?: { session?: ClientSession }
  ): Promise<IOccupation> => {
    const createdOccupation = await Occupation.create(
      [occupationData],
      options
    );
    return createdOccupation[0].toObject();
  },

  updateOccupation: async (
    id: string,
    updatedFields: Partial<IOccupation>
  ): Promise<IOccupation | null> => {
    const updatedOccupation = await Occupation.findOneAndUpdate(
      { user: id },
      updatedFields,
      {
        new: true,
      }
    );
    return updatedOccupation ? updatedOccupation.toObject() : null;
  },

  deleteOccupation: async (id: string): Promise<void> => {
    await Occupation.findByIdAndDelete(id);
  },
};
