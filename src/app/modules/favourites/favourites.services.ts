// favorite.service.ts
import { ClientSession } from "mongoose";
import { IFavorite } from "./favourites.interface";
import Favorite from "./favourites.model";

export const FavoriteService = {
  getAllFavorites: async (): Promise<IFavorite[]> => {
    const favorites = await Favorite.find();
    return favorites.map((favorite) => favorite.toObject());
  },

  getFavoriteById: async (id: string): Promise<IFavorite | null> => {
    const favorite = await Favorite.findById(id);
    return favorite ? favorite.toObject() : null;
  },
  getFavoriteByToken: async (user: string): Promise<IFavorite | null> => {
    const favorite = await Favorite.findOne({ user }).lean();
    return favorite;
  },

  createFavorite: async (
    favoriteData: IFavorite,
    options?: { session?: ClientSession }
  ): Promise<IFavorite> => {
    const createdFavorite = await Favorite.create([favoriteData], options);
    return createdFavorite[0].toObject();
  },

  updateFavorite: async (
    id: string,
    updatedFields: Partial<IFavorite>
  ): Promise<IFavorite | null> => {
    const updatedFavorite = await Favorite.findOneAndUpdate(
      { user: id },
      updatedFields,
      {
        new: true,
      }
    );
    return updatedFavorite ? updatedFavorite.toObject() : null;
  },

  deleteFavorite: async (id: string): Promise<void> => {
    await Favorite.findByIdAndDelete(id);
  },
};
