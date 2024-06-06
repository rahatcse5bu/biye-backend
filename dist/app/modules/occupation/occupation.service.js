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
exports.OccupationService = void 0;
const occupation_model_1 = __importDefault(require("./occupation.model"));
exports.OccupationService = {
    getAllOccupationes: () => __awaiter(void 0, void 0, void 0, function* () {
        const occupationes = yield occupation_model_1.default.find();
        return occupationes.map((occupation) => occupation.toObject());
    }),
    getOccupationById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const occupation = yield occupation_model_1.default.findById(id);
        return occupation ? occupation.toObject() : null;
    }),
    getOccupationByToken: (user) => __awaiter(void 0, void 0, void 0, function* () {
        const occupation = yield occupation_model_1.default.findOne({ user }).lean();
        return occupation;
    }),
    createOccupation: (occupationData, options) => __awaiter(void 0, void 0, void 0, function* () {
        const createdOccupation = yield occupation_model_1.default.create([occupationData], options);
        return createdOccupation[0].toObject();
    }),
    updateOccupation: (id, updatedFields) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedOccupation = yield occupation_model_1.default.findOneAndUpdate({ user: id }, updatedFields, {
            new: true,
        });
        return updatedOccupation ? updatedOccupation.toObject() : null;
    }),
    deleteOccupation: (id) => __awaiter(void 0, void 0, void 0, function* () {
        yield occupation_model_1.default.findByIdAndDelete(id);
    }),
};
