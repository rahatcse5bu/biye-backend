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
const config_1 = __importDefault(require("../../../config"));
const jwtHelpers_1 = require("../../../helpers/jwtHelpers");
const user_info_model_1 = require("./user_info.model");
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
        return user_info_model_1.UserInfoModel.findById(id).select("user_status").exec();
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
        const lastItems = yield user_info_model_1.UserInfoModel.findOne().sort({ user_id: -1 });
        let user_id = 2000;
        // console.log(lastItems);
        // console.log("user_id", user_id);
        if (lastItems) {
            user_id = lastItems.user_id + 1;
        }
        const user = yield user_info_model_1.UserInfoModel.create(Object.assign(Object.assign({}, userInfo), { user_id }));
        return user.toObject();
    }),
    createUserForGoogleSignIn: (userInfo) => __awaiter(void 0, void 0, void 0, function* () {
        const { email } = userInfo;
        // Upsert user document based on email
        let user = yield user_info_model_1.UserInfoModel.findOne({ email }).lean();
        if (!user) {
            user = yield exports.UserInfoService.createUserInfo(userInfo);
        }
        return Object.assign(Object.assign({}, user), { token: jwtHelpers_1.jwtHelpers.createToken({
                _id: user._id,
                user_role: user.user_role,
            }, config_1.default.jwt_secret, "30d") });
    }),
    updateUserInfo: (id, userInfo) => __awaiter(void 0, void 0, void 0, function* () {
        return user_info_model_1.UserInfoModel.findByIdAndUpdate(id, userInfo, { new: true }).exec();
    }),
    updateUserInfoForFCM: (id, userInfo) => __awaiter(void 0, void 0, void 0, function* () {
        return user_info_model_1.UserInfoModel.findByIdAndUpdate(id, userInfo, { new: true }).exec();
    }),
    deleteUserInfo: (id) => __awaiter(void 0, void 0, void 0, function* () {
        yield user_info_model_1.UserInfoModel.findByIdAndDelete(id).exec();
    }),
};
