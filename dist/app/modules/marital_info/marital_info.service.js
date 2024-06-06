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
exports.MaritalInfoService = void 0;
const marital_info_model_1 = __importDefault(require("./marital_info.model"));
exports.MaritalInfoService = {
    getAllMaritalInfos: () => __awaiter(void 0, void 0, void 0, function* () {
        const maritalInfos = yield marital_info_model_1.default.find();
        return maritalInfos.map((maritalInfo) => maritalInfo.toObject());
    }),
    getMaritalInfoById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const maritalInfo = yield marital_info_model_1.default.findById(id);
        return maritalInfo ? maritalInfo.toObject() : null;
    }),
    getMaritalInfoByToken: (user) => __awaiter(void 0, void 0, void 0, function* () {
        const maritalInfo = yield marital_info_model_1.default.findOne({ user }).lean();
        return maritalInfo;
    }),
    createMaritalInfo: (maritalInfoData, options) => __awaiter(void 0, void 0, void 0, function* () {
        const createdMaritalInfo = yield marital_info_model_1.default.create([maritalInfoData], options);
        return createdMaritalInfo[0].toObject();
    }),
    updateMaritalInfo: (id, updatedFields) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedMaritalInfo = yield marital_info_model_1.default.findOneAndUpdate({ user: id }, updatedFields, {
            new: true,
        });
        return updatedMaritalInfo ? updatedMaritalInfo.toObject() : null;
    }),
    deleteMaritalInfo: (id) => __awaiter(void 0, void 0, void 0, function* () {
        yield marital_info_model_1.default.findByIdAndDelete(id);
    }),
};
