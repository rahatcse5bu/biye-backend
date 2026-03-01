import { ClientSession } from "mongoose";
import { IShortlist } from "./shortlist.interface";
import Shortlist from "./shortlist.model";

export const ShortlistService = {
  getAllShortlists: async (): Promise<IShortlist[]> => {
    const shortlists = await Shortlist.find();
    return shortlists.map((shortlist) => shortlist.toObject());
  },

  getShortlistById: async (id: string): Promise<IShortlist | null> => {
    const shortlist = await Shortlist.findById(id);
    return shortlist ? shortlist.toObject() : null;
  },

  getShortlistByToken: async (user: string): Promise<IShortlist | null> => {
    const shortlist = await Shortlist.findOne({ user }).lean();
    return shortlist;
  },

  createShortlist: async (
    shortlistData: IShortlist,
    options?: { session?: ClientSession }
  ): Promise<IShortlist> => {
    const createdShortlist = await Shortlist.create([shortlistData], options);
    return createdShortlist[0].toObject();
  },

  deleteShortlist: async (id: string): Promise<void> => {
    await Shortlist.findByIdAndDelete(id);
  },
};
