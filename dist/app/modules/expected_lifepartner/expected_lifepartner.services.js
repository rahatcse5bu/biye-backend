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
exports.ExpectedPartnerService = void 0;
const expected_lifepartner_model_1 = __importDefault(require("./expected_lifepartner.model"));
exports.ExpectedPartnerService = {
    getAllExpectedPartners: () => __awaiter(void 0, void 0, void 0, function* () {
        const expectedPartners = yield expected_lifepartner_model_1.default.find();
        return expectedPartners.map((expectedPartner) => expectedPartner.toObject());
    }),
    getExpectedPartnerById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const expectedPartner = yield expected_lifepartner_model_1.default.findById(id);
        return expectedPartner ? expectedPartner.toObject() : null;
    }),
    getExpectedPartnerByToken: (user) => __awaiter(void 0, void 0, void 0, function* () {
        const expectedPartner = yield expected_lifepartner_model_1.default.findOne({ user }).lean();
        return expectedPartner;
    }),
    createExpectedPartner: (expectedPartnerData, options) => __awaiter(void 0, void 0, void 0, function* () {
        const createdExpectedPartner = yield expected_lifepartner_model_1.default.create([expectedPartnerData], options);
        return createdExpectedPartner[0].toObject();
    }),
    updateExpectedPartner: (id, updatedFields) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedExpectedPartner = yield expected_lifepartner_model_1.default.findOneAndUpdate({ user: id }, updatedFields, {
            new: true,
        });
        return updatedExpectedPartner ? updatedExpectedPartner.toObject() : null;
    }),
    deleteExpectedPartner: (id) => __awaiter(void 0, void 0, void 0, function* () {
        yield expected_lifepartner_model_1.default.findByIdAndDelete(id);
    }),
};
