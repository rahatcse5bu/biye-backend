// unFavorite.service.ts
import { ClientSession } from "mongoose";
import { IUnFavorite } from "./unfavorites.interface";
import UnFavorite from "./unfavorites.model";

export const UnFavoriteService = {
  getAllUnFavorites: async (): Promise<IUnFavorite[]> => {
    const unFavorites = await UnFavorite.find();
    return unFavorites.map((unFavorite) => unFavorite.toObject());
  },

  getUnFavoriteById: async (id: string): Promise<IUnFavorite | null> => {
    const unFavorite = await UnFavorite.findById(id);
    return unFavorite ? unFavorite.toObject() : null;
  },
  getUnFavoriteByToken: async (user: string): Promise<IUnFavorite | null> => {
    const unFavorite = await UnFavorite.findOne({ user }).lean();
    return unFavorite;
  },

  createUnFavorite: async (
    unFavoriteData: IUnFavorite,
    options?: { session?: ClientSession }
  ): Promise<IUnFavorite> => {
    const createdUnFavorite = await UnFavorite.create(
      [unFavoriteData],
      options
    );
    return createdUnFavorite[0].toObject();
  },

  updateUnFavorite: async (
    id: string,
    updatedFields: Partial<IUnFavorite>
  ): Promise<IUnFavorite | null> => {
    const updatedUnFavorite = await UnFavorite.findOneAndUpdate(
      { user: id },
      updatedFields,
      {
        new: true,
      }
    );
    return updatedUnFavorite ? updatedUnFavorite.toObject() : null;
  },

  deleteUnFavorite: async (id: string): Promise<void> => {
    await UnFavorite.findByIdAndDelete(id);
  },
};
