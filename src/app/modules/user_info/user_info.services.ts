import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { OAuth2Client } from "google-auth-library";
import { Secret } from "jsonwebtoken";
import { promisify } from "util";
import config from "../../../config";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import ApiError from "../../middlewares/ApiError";
import { IUserInfo } from "./user_info.interface";
import { UserInfoModel } from "./user_info.model";
import GeneralInfo from "../general_info/general_info.model";

const googleClient = new OAuth2Client();
const scryptAsync = promisify(scrypt);
const invalidPasswordHash = `${"0".repeat(32)}:${"0".repeat(128)}`;

const normalizeEmail = (email: unknown): string => {
  if (typeof email !== "string") {
    throw new ApiError(400, "A valid email is required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalizedEmail)) {
    throw new ApiError(400, "A valid email is required");
  }

  return normalizedEmail;
};

const requireString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, `${field} is required`);
  }

  return value.trim();
};

const getNextUserId = async (): Promise<number> => {
  const lastItem: any = await UserInfoModel.findOne().sort({ user_id: -1 });
  return lastItem ? lastItem.user_id + 1 : 2000;
};

const createAppToken = (user: IUserInfo): string =>
  jwtHelpers.createToken(
    {
      _id: user._id,
      user_role: user.user_role,
    },
    config.jwt_secret as Secret,
    "30d"
  );

const sanitizeUser = (user: any): Record<string, any> => {
  const sanitizedUser = user?.toObject ? user.toObject() : { ...user };
  delete sanitizedUser.password_hash;
  return sanitizedUser;
};

const addAppToken = (user: IUserInfo): Record<string, any> => ({
  ...sanitizeUser(user),
  token: createAppToken(user),
});

const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
};

const verifyPassword = async (
  password: string,
  storedPasswordHash: string
): Promise<boolean> => {
  const [salt, storedKeyHex, ...unexpectedParts] = storedPasswordHash.split(":");
  if (
    !salt ||
    !storedKeyHex ||
    unexpectedParts.length ||
    !/^[a-f0-9]+$/i.test(storedKeyHex)
  ) {
    return false;
  }

  const storedKey = Buffer.from(storedKeyHex, "hex");
  const derivedKey = (await scryptAsync(password, salt, storedKey.length)) as Buffer;
  return (
    storedKey.length > 0 &&
    timingSafeEqual(Uint8Array.from(storedKey), Uint8Array.from(derivedKey))
  );
};

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
  getUserStatus: async (id: string): Promise<Record<string, any> | null> => {
    const userInfo = await UserInfoModel.findById(id).select("user_status").lean().exec();
    if (!userInfo) return null;
    const bioInfo = await GeneralInfo.findOne({ user: id })
      .select("biodata_status pending_changes")
      .lean()
      .exec() as any;
    return {
      user_status: userInfo.user_status,
      biodata_status: bioInfo?.biodata_status ?? null,
      has_pending_changes: !!(bioInfo?.pending_changes && typeof bioInfo.pending_changes === 'object'),
    };
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
    const user_id = await getNextUserId();

    const user: any = await UserInfoModel.create({
      ...userInfo,
      user_id,
    });
    return sanitizeUser(user) as IUserInfo;
  },
  googleAuth: async (authInfo: {
    credential?: unknown;
    username?: unknown;
    gender?: unknown;
  }): Promise<Record<string, any>> => {
    if (typeof authInfo?.credential !== "string" || !authInfo.credential.trim()) {
      throw new ApiError(400, "Google credential is required");
    }
    if (!config.google_client_id) {
      throw new ApiError(500, "Google authentication is not configured");
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: authInfo.credential,
        audience: config.google_client_id,
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw new ApiError(401, "Invalid Google credential");
    }

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new ApiError(401, "Invalid Google credential");
    }

    const email = normalizeEmail(payload.email);
    const userByGoogleId = await UserInfoModel.findOne({
      google_id: payload.sub,
    });
    const userByEmail = await UserInfoModel.findOne({ email });

    if (
      userByGoogleId &&
      userByEmail &&
      userByGoogleId._id.toString() !== userByEmail._id.toString()
    ) {
      throw new ApiError(409, "Google account conflicts with an existing user");
    }

    let user = userByGoogleId || userByEmail;
    if (!user) {
      const user_id = await getNextUserId();
      user = await UserInfoModel.create({
        user_id,
        email,
        google_id: payload.sub,
        username:
          typeof authInfo.username === "string" && authInfo.username.trim()
            ? authInfo.username.trim()
            : payload.name,
        gender:
          typeof authInfo.gender === "string" && authInfo.gender.trim()
            ? authInfo.gender.trim()
            : undefined,
        picture: payload.picture,
      });
    } else {
      if (user.google_id && user.google_id !== payload.sub) {
        throw new ApiError(409, "Email is linked to another Google account");
      }

      user.google_id = payload.sub;
      if (!user.username) {
        user.username =
          typeof authInfo.username === "string" && authInfo.username.trim()
            ? authInfo.username.trim()
            : payload.name;
      }
      if (
        !user.gender &&
        typeof authInfo.gender === "string" &&
        authInfo.gender.trim()
      ) {
        user.gender = authInfo.gender.trim();
      }
      if (payload.picture) {
        user.picture = payload.picture;
      }
      await user.save();
    }

    return addAppToken(user);
  },

  register: async (registrationInfo: {
    email?: unknown;
    password?: unknown;
    username?: unknown;
    gender?: unknown;
  }): Promise<Record<string, any>> => {
    const email = normalizeEmail(registrationInfo?.email);
    if (
      typeof registrationInfo?.password !== "string" ||
      registrationInfo.password.length < 6
    ) {
      throw new ApiError(400, "Password must be at least 6 characters long");
    }

    const username = requireString(registrationInfo.username, "Username");
    const gender = requireString(registrationInfo.gender, "Gender");
    const existingUser = await UserInfoModel.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "Email already exists");
    }

    const password_hash = await hashPassword(registrationInfo.password);
    const user_id = await getNextUserId();
    try {
      const user = await UserInfoModel.create({
        user_id,
        email,
        password_hash,
        username,
        gender,
      });
      return addAppToken(user);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ApiError(409, "Email already exists");
      }
      throw error;
    }
  },

  login: async (loginInfo: {
    email?: unknown;
    password?: unknown;
  }): Promise<Record<string, any>> => {
    const invalidCredentials = new ApiError(401, "Invalid credentials");
    if (
      typeof loginInfo?.email !== "string" ||
      typeof loginInfo?.password !== "string"
    ) {
      throw invalidCredentials;
    }

    const email = loginInfo.email.trim().toLowerCase();
    const user = await UserInfoModel.findOne({ email }).select("+password_hash");
    const passwordMatches = await verifyPassword(
      loginInfo.password,
      user?.password_hash || invalidPasswordHash
    );

    if (!user || !user.password_hash || !passwordMatches) {
      throw invalidCredentials;
    }

    return addAppToken(user);
  },

  changePassword: async (
    id: string,
    passwordInfo: {
      currentPassword?: unknown;
      newPassword?: unknown;
    }
  ): Promise<void> => {
    if (
      typeof passwordInfo?.currentPassword !== "string" ||
      typeof passwordInfo?.newPassword !== "string"
    ) {
      throw new ApiError(400, "Current and new passwords are required");
    }
    if (passwordInfo.newPassword.length < 6) {
      throw new ApiError(400, "New password must be at least 6 characters long");
    }

    const user = await UserInfoModel.findById(id).select("+password_hash");
    if (!user) {
      throw new ApiError(404, "User info not found");
    }
    if (!user.password_hash) {
      throw new ApiError(400, "Password login is not enabled for this account");
    }

    const passwordMatches = await verifyPassword(
      passwordInfo.currentPassword,
      user.password_hash
    );
    if (!passwordMatches) {
      throw new ApiError(401, "Current password is incorrect");
    }

    user.password_hash = await hashPassword(passwordInfo.newPassword);
    await user.save();
  },

  getCurrentUser: async (id: string): Promise<IUserInfo> => {
    const user = await UserInfoModel.findById(id).exec();
    if (!user) {
      throw new ApiError(404, "User info not found");
    }

    return user;
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
