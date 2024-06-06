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
exports.FamilyStatusService = void 0;
const family_status_model_1 = __importDefault(require("./family_status.model"));
exports.FamilyStatusService = {
    getAllFamilyStatuses: () => __awaiter(void 0, void 0, void 0, function* () {
        return family_status_model_1.default.find().lean();
    }),
    getFamilyStatusById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return family_status_model_1.default.findById(id).lean();
    }),
    getFamilyStatusByToken: (user) => __awaiter(void 0, void 0, void 0, function* () {
        return family_status_model_1.default.findOne({ user }).lean();
    }),
    getFamilyStatusByUserId: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        return family_status_model_1.default.findOne({ user: userId }).lean();
    }),
    createFamilyStatus: (data, session) => __awaiter(void 0, void 0, void 0, function* () {
        const newFamilyStatus = new family_status_model_1.default(data);
        yield newFamilyStatus.save({ session });
        return newFamilyStatus;
    }),
    updateFamilyStatus: (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
        return family_status_model_1.default.findOneAndUpdate({ user: userId }, data, {
            new: true,
        }).lean();
    }),
    deleteFamilyStatus: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return family_status_model_1.default.findByIdAndDelete(id).lean();
    }),
};
