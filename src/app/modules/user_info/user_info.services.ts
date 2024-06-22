import { Secret } from "jsonwebtoken";
import config from "../../../config";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import { IUserInfo } from "./user_info.interface";
import { UserInfoModel } from "./user_info.model";

export const UserInfoService = {
  getAllUserInfo: async (): Promise<IUserInfo[]> => {
    return UserInfoModel.find().exec();
  },

  getUserInfoById: async (id: string): Promise<IUserInfo | null> => {
    return UserInfoModel.findById(id).exec();
  },
  getAllUsersInfoId: async (): Promise<IUserInfo[]> => {
    return UserInfoModel.find({
      user_status: "active",
    })
      .select("_id user_id")
      .lean();
  },
  getUserInfoByIdWithSession: async (
    id: string,
    options: { session?: any } = {}
  ) => {
    const { session } = options;
    return UserInfoModel.findById(id).session(session).exec();
  },
  getUserStatus: async (id: string): Promise<Partial<IUserInfo> | null> => {
    return UserInfoModel.findById(id).select("user_status").exec();
  },
  getUserInfoByEmail: async (
    email: string
  ): Promise<Partial<IUserInfo> | null> => {
    return await UserInfoModel.findOne({ email }).lean().exec();
  },

  createUserInfo: async (userInfo: IUserInfo): Promise<IUserInfo> => {
    const existingUser: any = await UserInfoModel.findOne({
      email: userInfo.email,
    });
    if (existingUser) {
      throw new Error("Email already exists");
    }
    const lastItems: any = await UserInfoModel.findOne().sort({ user_id: -1 });
    let user_id = 2000;
    // console.log(lastItems);
    // console.log("user_id", user_id);
    if (lastItems) {
      user_id = lastItems.user_id + 1;
    }

    const user: any = await UserInfoModel.create({
      ...userInfo,
      user_id,
    });
    return user.toObject();
  },
  createUserForGoogleSignIn: async (
    userInfo: IUserInfo
  ): Promise<IUserInfo> => {
    const { email } = userInfo;
    // Upsert user document based on email
    // const updatedUser: any = await UserInfoModel.findOneAndUpdate(
    //   { email },
    //   userInfo,
    //   { new: true, upsert: true, setDefaultsOnInsert: true }
    // ).lean();
    let user: any = await UserInfoModel.findOne({ email }).lean();

    if (!user) {
      user = await UserInfoService.createUserInfo(userInfo);
    }

    return {
      ...user,
      token: jwtHelpers.createToken(
        {
          _id: user._id,
          user_role: user.user_role,
        },
        config.jwt_secret as Secret,
        "30d"
      ),
    };
  },

  updateUserInfo: async (
    id: string,
    userInfo: IUserInfo
  ): Promise<IUserInfo | null> => {
    return UserInfoModel.findByIdAndUpdate(id, userInfo, { new: true }).exec();
  },

  deleteUserInfo: async (id: string): Promise<void> => {
    await UserInfoModel.findByIdAndDelete(id).exec();
  },
};
