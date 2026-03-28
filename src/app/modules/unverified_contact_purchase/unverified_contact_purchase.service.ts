import UnverifiedContactPurchase from "./unverified_contact_purchase.model";

export const UnverifiedContactPurchaseService = {
  getUnverifiedContactPurchaseByUserAndBiodata: async (
    userId: string,
    biodataId: string,
    session?: any
  ) => {
    return await UnverifiedContactPurchase.findOne({
      user: userId,
      unverified_biodata: biodataId,
    }).session(session);
  },

  createUnverifiedContactPurchase: async (data: any, options?: any) => {
    return await UnverifiedContactPurchase.create([data], options);
  },

  getUnverifiedContactPurchasesByUser: async (userId: string) => {
    return await UnverifiedContactPurchase.find({ user: userId })
      .populate("unverified_biodata")
      .sort({ createdAt: -1 });
  },

  getUnverifiedContactPurchaseById: async (id: string) => {
    return await UnverifiedContactPurchase.findById(id)
      .populate("unverified_biodata")
      .populate("user", "user_id email");
  },
};
