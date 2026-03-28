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
exports.UnverifiedContactPurchaseService = void 0;
const unverified_contact_purchase_model_1 = __importDefault(require("./unverified_contact_purchase.model"));
exports.UnverifiedContactPurchaseService = {
    getUnverifiedContactPurchaseByUserAndBiodata: (userId, biodataId, session) => __awaiter(void 0, void 0, void 0, function* () {
        return yield unverified_contact_purchase_model_1.default.findOne({
            user: userId,
            unverified_biodata: biodataId,
        }).session(session);
    }),
    createUnverifiedContactPurchase: (data, options) => __awaiter(void 0, void 0, void 0, function* () {
        return yield unverified_contact_purchase_model_1.default.create([data], options);
    }),
    getUnverifiedContactPurchasesByUser: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        return yield unverified_contact_purchase_model_1.default.find({ user: userId })
            .populate("unverified_biodata")
            .sort({ createdAt: -1 });
    }),
    getUnverifiedContactPurchaseById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield unverified_contact_purchase_model_1.default.findById(id)
            .populate("unverified_biodata")
            .populate("user", "user_id email");
    }),
};
