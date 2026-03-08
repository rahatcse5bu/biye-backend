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
exports.AchievementService = void 0;
const achievement_model_1 = __importDefault(require("./achievement.model"));
exports.AchievementService = {
    getAchievementByUser: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        return yield achievement_model_1.default.findOne({ user: userId }).lean();
    }),
    createAchievement: (data) => __awaiter(void 0, void 0, void 0, function* () {
        const created = yield achievement_model_1.default.create(data);
        return created.toObject();
    }),
    updateAchievement: (userId, updatedFields) => __awaiter(void 0, void 0, void 0, function* () {
        const updated = yield achievement_model_1.default.findOneAndUpdate({ user: userId }, updatedFields, { new: true });
        return updated ? updated.toObject() : null;
    }),
};
