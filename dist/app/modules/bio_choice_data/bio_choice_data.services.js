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
exports.BioChoiceService = void 0;
const bio_choice_data_model_1 = __importDefault(require("./bio_choice_data.model"));
exports.BioChoiceService = {
    getAllBioChoices: () => __awaiter(void 0, void 0, void 0, function* () {
        const bioChoices = yield bio_choice_data_model_1.default.find();
        return bioChoices.map((bioChoice) => bioChoice.toObject());
    }),
    getBioChoiceById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const bioChoice = yield bio_choice_data_model_1.default.findById(id);
        return bioChoice ? bioChoice.toObject() : null;
    }),
    checkBioChoiceExist: (query) => __awaiter(void 0, void 0, void 0, function* () {
        const bioChoice = yield bio_choice_data_model_1.default.findOne(query).lean();
        return bioChoice ? bioChoice : null;
    }),
    getBioChoiceByToken: (user) => __awaiter(void 0, void 0, void 0, function* () {
        const bioChoice = yield bio_choice_data_model_1.default.findOne({ user }).lean();
        return bioChoice;
    }),
    createBioChoice: (data, options) => __awaiter(void 0, void 0, void 0, function* () {
        return yield bio_choice_data_model_1.default.create([data], options);
    }),
    // createBioChoice: async (bioChoiceData: IBioChoice): Promise<IBioChoice> => {
    //   const createdBioChoice = await BioChoice.create(bioChoiceData);
    //   return createdBioChoice.toObject();
    // },
    updateBioChoice: (query, updatedFields) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedBioChoice = yield bio_choice_data_model_1.default.findOneAndUpdate(query, updatedFields, {
            new: true,
        });
        return updatedBioChoice ? updatedBioChoice.toObject() : null;
    }),
    deleteBioChoice: (id) => __awaiter(void 0, void 0, void 0, function* () {
        yield bio_choice_data_model_1.default.findByIdAndDelete(id);
    }),
};
