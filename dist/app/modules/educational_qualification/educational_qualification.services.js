"use strict";
// educationalQualification.service.ts
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
exports.EducationalQualificationService = void 0;
const educational_qualification_model_1 = __importDefault(require("./educational_qualification.model"));
exports.EducationalQualificationService = {
    getAllEducationalQualifications: () => __awaiter(void 0, void 0, void 0, function* () {
        const qualifications = yield educational_qualification_model_1.default.find();
        return qualifications.map((qualification) => qualification.toObject());
    }),
    getEducationalQualificationById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const qualification = yield educational_qualification_model_1.default.findById(id);
        return qualification ? qualification.toObject() : null;
    }),
    getEducationalQualificationByUserId: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        const qualification = yield educational_qualification_model_1.default.findOne({
            user_id: userId,
        }).lean();
        return qualification;
    }),
    getEducationalQualificationByToken: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        const qualification = yield educational_qualification_model_1.default.findOne({
            user: userId,
        }).lean();
        return qualification;
    }),
    createEducationalQualification: (data, options) => __awaiter(void 0, void 0, void 0, function* () {
        const createdQualification = yield educational_qualification_model_1.default.create([data], options);
        return createdQualification[0].toObject();
    }),
    updateEducationalQualification: (userId, updatedFields) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedQualification = yield educational_qualification_model_1.default.findOneAndUpdate({ user: userId }, updatedFields, {
            new: true,
        });
        return updatedQualification ? updatedQualification.toObject() : null;
    }),
    deleteEducationalQualification: (id) => __awaiter(void 0, void 0, void 0, function* () {
        yield educational_qualification_model_1.default.findByIdAndDelete(id);
    }),
};
