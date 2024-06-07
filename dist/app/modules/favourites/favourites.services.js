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
exports.FavoriteService = void 0;
const favourites_model_1 = __importDefault(require("./favourites.model"));
exports.FavoriteService = {
    getAllFavorites: () => __awaiter(void 0, void 0, void 0, function* () {
        const favorites = yield favourites_model_1.default.find();
        return favorites.map((favorite) => favorite.toObject());
    }),
    getFavoriteById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const favorite = yield favourites_model_1.default.findById(id);
        return favorite ? favorite.toObject() : null;
    }),
    getFavoriteByToken: (user) => __awaiter(void 0, void 0, void 0, function* () {
        const favorite = yield favourites_model_1.default.findOne({ user }).lean();
        return favorite;
    }),
    createFavorite: (favoriteData, options) => __awaiter(void 0, void 0, void 0, function* () {
        const createdFavorite = yield favourites_model_1.default.create([favoriteData], options);
        return createdFavorite[0].toObject();
    }),
    updateFavorite: (id, updatedFields) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedFavorite = yield favourites_model_1.default.findOneAndUpdate({ user: id }, updatedFields, {
            new: true,
        });
        return updatedFavorite ? updatedFavorite.toObject() : null;
    }),
    deleteFavorite: (id) => __awaiter(void 0, void 0, void 0, function* () {
        yield favourites_model_1.default.findByIdAndDelete(id);
    }),
};
