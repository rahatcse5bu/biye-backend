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
exports.PersonalInfoService = void 0;
const personal_info_model_1 = __importDefault(require("./personal_info.model"));
exports.PersonalInfoService = {
    getAllPersonalInfoes: () => __awaiter(void 0, void 0, void 0, function* () {
        const personalInfoes = yield personal_info_model_1.default.find();
        return personalInfoes.map((personalInfo) => personalInfo.toObject());
    }),
    getPersonalInfoById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const personalInfo = yield personal_info_model_1.default.findById(id);
        return personalInfo ? personalInfo.toObject() : null;
    }),
    getPersonalInfoByToken: (user) => __awaiter(void 0, void 0, void 0, function* () {
        const personalInfo = yield personal_info_model_1.default.findOne({ user }).lean();
        return personalInfo;
    }),
    createPersonalInfo: (personalInfoData, options) => __awaiter(void 0, void 0, void 0, function* () {
        const createdPersonalInfo = yield personal_info_model_1.default.create([personalInfoData], options);
        return createdPersonalInfo[0].toObject();
    }),
    updatePersonalInfo: (id, updatedFields) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedPersonalInfo = yield personal_info_model_1.default.findOneAndUpdate({ user: id }, updatedFields, {
            new: true,
        });
        return updatedPersonalInfo ? updatedPersonalInfo.toObject() : null;
    }),
    deletePersonalInfo: (id) => __awaiter(void 0, void 0, void 0, function* () {
        yield personal_info_model_1.default.findByIdAndDelete(id);
    }),
};
