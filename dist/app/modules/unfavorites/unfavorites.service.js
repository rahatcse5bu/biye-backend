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
exports.UnFavoriteService = void 0;
const unfavorites_model_1 = __importDefault(require("./unfavorites.model"));
exports.UnFavoriteService = {
    getAllUnFavorites: () => __awaiter(void 0, void 0, void 0, function* () {
        const unFavorites = yield unfavorites_model_1.default.find();
        return unFavorites.map((unFavorite) => unFavorite.toObject());
    }),
    getUnFavoriteById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const unFavorite = yield unfavorites_model_1.default.findById(id);
        return unFavorite ? unFavorite.toObject() : null;
    }),
    getUnFavoriteByToken: (user) => __awaiter(void 0, void 0, void 0, function* () {
        const unFavorite = yield unfavorites_model_1.default.findOne({ user }).lean();
        return unFavorite;
    }),
    createUnFavorite: (unFavoriteData, options) => __awaiter(void 0, void 0, void 0, function* () {
        const createdUnFavorite = yield unfavorites_model_1.default.create([unFavoriteData], options);
        return createdUnFavorite[0].toObject();
    }),
    updateUnFavorite: (id, updatedFields) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedUnFavorite = yield unfavorites_model_1.default.findOneAndUpdate({ user: id }, updatedFields, {
            new: true,
        });
        return updatedUnFavorite ? updatedUnFavorite.toObject() : null;
    }),
    deleteUnFavorite: (id) => __awaiter(void 0, void 0, void 0, function* () {
        yield unfavorites_model_1.default.findByIdAndDelete(id);
    }),
};
