"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserInfoService = void 0;
const crypto_1 = require("crypto");
const google_auth_library_1 = require("google-auth-library");
const util_1 = require("util");
const config_1 = __importDefault(require("../../../config"));
const jwtHelpers_1 = require("../../../helpers/jwtHelpers");
const ApiError_1 = __importDefault(require("../../middlewares/ApiError"));
const user_info_model_1 = require("./user_info.model");
const general_info_model_1 = __importDefault(require("../general_info/general_info.model"));
const googleClient = new google_auth_library_1.OAuth2Client();
const scryptAsync = (0, util_1.promisify)(crypto_1.scrypt);
const invalidPasswordHash = `${"0".repeat(32)}:${"0".repeat(128)}`;
const normalizeEmail = (email) => {
    if (typeof email !== "string") {
        throw new ApiError_1.default(400, "A valid email is required");
    }
    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
        throw new ApiError_1.default(400, "A valid email is required");
    }
    return normalizedEmail;
};
const requireString = (value, field) => {
    if (typeof value !== "string" || !value.trim()) {
        throw new ApiError_1.default(400, `${field} is required`);
    }
    return value.trim();
};
const getNextUserId = () => __awaiter(void 0, void 0, void 0, function* () {
    const lastItem = yield user_info_model_1.UserInfoModel.findOne().sort({ user_id: -1 });
    return lastItem ? lastItem.user_id + 1 : 2000;
});
const createAppToken = (user) => jwtHelpers_1.jwtHelpers.createToken({
    _id: user._id,
    user_role: user.user_role,
}, config_1.default.jwt_secret, "30d");
const sanitizeUser = (user) => {
    const sanitizedUser = (user === null || user === void 0 ? void 0 : user.toObject) ? user.toObject() : Object.assign({}, user);
    delete sanitizedUser.password_hash;
    return sanitizedUser;
};
const addAppToken = (user) => (Object.assign(Object.assign({}, sanitizeUser(user)), { token: createAppToken(user) }));
const hashPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    const salt = (0, crypto_1.randomBytes)(16).toString("hex");
    const derivedKey = (yield scryptAsync(password, salt, 64));
    return `${salt}:${derivedKey.toString("hex")}`;
});
const verifyPassword = (password, storedPasswordHash) => __awaiter(void 0, void 0, void 0, function* () {
    const [salt, storedKeyHex, ...unexpectedParts] = storedPasswordHash.split(":");
    if (!salt ||
        !storedKeyHex ||
        unexpectedParts.length ||
        !/^[a-f0-9]+$/i.test(storedKeyHex)) {
        return false;
    }
    const storedKey = Buffer.from(storedKeyHex, "hex");
    const derivedKey = (yield scryptAsync(password, salt, storedKey.length));
    return (storedKey.length > 0 &&
        (0, crypto_1.timingSafeEqual)(Uint8Array.from(storedKey), Uint8Array.from(derivedKey)));
});
exports.UserInfoService = {
    getAllUserInfo: () => __awaiter(void 0, void 0, void 0, function* () {
        return user_info_model_1.UserInfoModel.find().exec();
    }),
    getUserInfoById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return user_info_model_1.UserInfoModel.findById(id).exec();
    }),
    getAllUsersInfoId: () => __awaiter(void 0, void 0, void 0, function* () {
        return user_info_model_1.UserInfoModel.find({
            user_status: "active",
        })
            .select("_id user_id")
            .lean();
    }),
    getUserInfoByIdWithSession: (id, options = {}) => __awaiter(void 0, void 0, void 0, function* () {
        const { session } = options;
        return user_info_model_1.UserInfoModel.findById(id).session(session).exec();
    }),
    getUserStatus: (id) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userInfo = yield user_info_model_1.UserInfoModel.findById(id).select("user_status").lean().exec();
        if (!userInfo)
            return null;
        const bioInfo = yield general_info_model_1.default.findOne({ user: id })
            .select("biodata_status pending_changes")
            .lean()
            .exec();
        return {
            user_status: userInfo.user_status,
            biodata_status: (_a = bioInfo === null || bioInfo === void 0 ? void 0 : bioInfo.biodata_status) !== null && _a !== void 0 ? _a : null,
            has_pending_changes: !!((bioInfo === null || bioInfo === void 0 ? void 0 : bioInfo.pending_changes) && typeof bioInfo.pending_changes === 'object'),
        };
    }),
    getUserInfoByEmail: (email) => __awaiter(void 0, void 0, void 0, function* () {
        return yield user_info_model_1.UserInfoModel.findOne({ email }).lean().exec();
    }),
    createUserInfo: (userInfo) => __awaiter(void 0, void 0, void 0, function* () {
        const existingUser = yield user_info_model_1.UserInfoModel.findOne({
            email: userInfo.email,
        });
        if (existingUser) {
            throw new Error("Email already exists");
        }
        const user_id = yield getNextUserId();
        const user = yield user_info_model_1.UserInfoModel.create(Object.assign(Object.assign({}, userInfo), { user_id }));
        return sanitizeUser(user);
    }),
    googleAuth: (authInfo) => __awaiter(void 0, void 0, void 0, function* () {
        if (typeof (authInfo === null || authInfo === void 0 ? void 0 : authInfo.credential) !== "string" || !authInfo.credential.trim()) {
            throw new ApiError_1.default(400, "Google credential is required");
        }
        if (!config_1.default.google_client_id) {
            throw new ApiError_1.default(500, "Google authentication is not configured");
        }
        let payload;
        try {
            const ticket = yield googleClient.verifyIdToken({
                idToken: authInfo.credential,
                audience: config_1.default.google_client_id,
            });
            payload = ticket.getPayload();
        }
        catch (error) {
            throw new ApiError_1.default(401, "Invalid Google credential");
        }
        if (!(payload === null || payload === void 0 ? void 0 : payload.sub) || !payload.email || payload.email_verified !== true) {
            throw new ApiError_1.default(401, "Invalid Google credential");
        }
        const email = normalizeEmail(payload.email);
        const userByGoogleId = yield user_info_model_1.UserInfoModel.findOne({
            google_id: payload.sub,
        });
        const userByEmail = yield user_info_model_1.UserInfoModel.findOne({ email });
        if (userByGoogleId &&
            userByEmail &&
            userByGoogleId._id.toString() !== userByEmail._id.toString()) {
            throw new ApiError_1.default(409, "Google account conflicts with an existing user");
        }
        let user = userByGoogleId || userByEmail;
        if (!user) {
            const user_id = yield getNextUserId();
            user = yield user_info_model_1.UserInfoModel.create({
                user_id,
                email,
                google_id: payload.sub,
                username: typeof authInfo.username === "string" && authInfo.username.trim()
                    ? authInfo.username.trim()
                    : payload.name,
                gender: typeof authInfo.gender === "string" && authInfo.gender.trim()
                    ? authInfo.gender.trim()
                    : undefined,
                picture: payload.picture,
            });
        }
        else {
            if (user.google_id && user.google_id !== payload.sub) {
                throw new ApiError_1.default(409, "Email is linked to another Google account");
            }
            user.google_id = payload.sub;
            if (!user.username) {
                user.username =
                    typeof authInfo.username === "string" && authInfo.username.trim()
                        ? authInfo.username.trim()
                        : payload.name;
            }
            if (!user.gender &&
                typeof authInfo.gender === "string" &&
                authInfo.gender.trim()) {
                user.gender = authInfo.gender.trim();
            }
            if (payload.picture) {
                user.picture = payload.picture;
            }
            yield user.save();
        }
        return addAppToken(user);
    }),
    register: (registrationInfo) => __awaiter(void 0, void 0, void 0, function* () {
        const email = normalizeEmail(registrationInfo === null || registrationInfo === void 0 ? void 0 : registrationInfo.email);
        if (typeof (registrationInfo === null || registrationInfo === void 0 ? void 0 : registrationInfo.password) !== "string" ||
            registrationInfo.password.length < 6) {
            throw new ApiError_1.default(400, "Password must be at least 6 characters long");
        }
        const username = requireString(registrationInfo.username, "Username");
        const gender = requireString(registrationInfo.gender, "Gender");
        const existingUser = yield user_info_model_1.UserInfoModel.findOne({ email });
        if (existingUser) {
            throw new ApiError_1.default(409, "Email already exists");
        }
        const password_hash = yield hashPassword(registrationInfo.password);
        const user_id = yield getNextUserId();
        try {
            const user = yield user_info_model_1.UserInfoModel.create({
                user_id,
                email,
                password_hash,
                username,
                gender,
            });
            return addAppToken(user);
        }
        catch (error) {
            if ((error === null || error === void 0 ? void 0 : error.code) === 11000) {
                throw new ApiError_1.default(409, "Email already exists");
            }
            throw error;
        }
    }),
    login: (loginInfo) => __awaiter(void 0, void 0, void 0, function* () {
        const invalidCredentials = new ApiError_1.default(401, "Invalid credentials");
        if (typeof (loginInfo === null || loginInfo === void 0 ? void 0 : loginInfo.email) !== "string" ||
            typeof (loginInfo === null || loginInfo === void 0 ? void 0 : loginInfo.password) !== "string") {
            throw invalidCredentials;
        }
        const email = loginInfo.email.trim().toLowerCase();
        const user = yield user_info_model_1.UserInfoModel.findOne({ email }).select("+password_hash");
        const passwordMatches = yield verifyPassword(loginInfo.password, (user === null || user === void 0 ? void 0 : user.password_hash) || invalidPasswordHash);
        if (!user || !user.password_hash || !passwordMatches) {
            throw invalidCredentials;
        }
        return addAppToken(user);
    }),
    changePassword: (id, passwordInfo) => __awaiter(void 0, void 0, void 0, function* () {
        if (typeof (passwordInfo === null || passwordInfo === void 0 ? void 0 : passwordInfo.currentPassword) !== "string" ||
            typeof (passwordInfo === null || passwordInfo === void 0 ? void 0 : passwordInfo.newPassword) !== "string") {
            throw new ApiError_1.default(400, "Current and new passwords are required");
        }
        if (passwordInfo.newPassword.length < 6) {
            throw new ApiError_1.default(400, "New password must be at least 6 characters long");
        }
        const user = yield user_info_model_1.UserInfoModel.findById(id).select("+password_hash");
        if (!user) {
            throw new ApiError_1.default(404, "User info not found");
        }
        if (!user.password_hash) {
            throw new ApiError_1.default(400, "Password login is not enabled for this account");
        }
        const passwordMatches = yield verifyPassword(passwordInfo.currentPassword, user.password_hash);
        if (!passwordMatches) {
            throw new ApiError_1.default(401, "Current password is incorrect");
        }
        user.password_hash = yield hashPassword(passwordInfo.newPassword);
        yield user.save();
    }),
    getCurrentUser: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield user_info_model_1.UserInfoModel.findById(id).exec();
        if (!user) {
            throw new ApiError_1.default(404, "User info not found");
        }
        return user;
    }),
    updateUserInfo: (id, userInfo) => __awaiter(void 0, void 0, void 0, function* () {
        return user_info_model_1.UserInfoModel.findByIdAndUpdate(id, userInfo, { new: true }).exec();
    }),
    deleteUserInfo: (id) => __awaiter(void 0, void 0, void 0, function* () {
        yield user_info_model_1.UserInfoModel.findByIdAndDelete(id).exec();
    }),
};
