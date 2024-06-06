// ongikarNama.service.ts
import { ClientSession } from "mongoose";
import { IOngikarNama } from "./ongikar_nama.interface";
import OngikarNama from "./ongikar_nama.model";

export const OngikarNamaService = {
  getAllOngikarNamaes: async (): Promise<IOngikarNama[]> => {
    const ongikarNamaes = await OngikarNama.find();
    return ongikarNamaes.map((ongikarNama) => ongikarNama.toObject());
  },

  getOngikarNamaById: async (id: string): Promise<IOngikarNama | null> => {
    const ongikarNama = await OngikarNama.findById(id);
    return ongikarNama ? ongikarNama.toObject() : null;
  },
  getOngikarNamaByToken: async (user: string): Promise<IOngikarNama | null> => {
    const ongikarNama = await OngikarNama.findOne({ user }).lean();
    return ongikarNama;
  },

  createOngikarNama: async (
    ongikarNamaData: IOngikarNama,
    options?: { session?: ClientSession }
  ): Promise<IOngikarNama> => {
    const createdOngikarNama = await OngikarNama.create(
      [ongikarNamaData],
      options
    );
    return createdOngikarNama[0].toObject();
  },

  updateOngikarNama: async (
    id: string,
    updatedFields: Partial<IOngikarNama>
  ): Promise<IOngikarNama | null> => {
    const updatedOngikarNama = await OngikarNama.findOneAndUpdate(
      { user: id },
      updatedFields,
      {
        new: true,
      }
    );
    return updatedOngikarNama ? updatedOngikarNama.toObject() : null;
  },

  deleteOngikarNama: async (id: string): Promise<void> => {
    await OngikarNama.findByIdAndDelete(id);
  },
};
