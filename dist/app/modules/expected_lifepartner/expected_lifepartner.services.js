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
            runValidators: true,
        });
        return updatedExpectedPartner ? updatedExpectedPartner.toObject() : null;
    }),
    // TODO: one record per user; a repeat create (double click, failed load) updates instead of duplicating.
    upsertExpectedPartner: (userId, fields, options) => __awaiter(void 0, void 0, void 0, function* () {
        const existing = yield expected_lifepartner_model_1.default.findOne({ user: userId }).session((options === null || options === void 0 ? void 0 : options.session) || null);
        const update = Object.assign(Object.assign({}, fields), { user: userId });
        const settings = { new: true, runValidators: true, session: options === null || options === void 0 ? void 0 : options.session };
        try {
            const record = yield expected_lifepartner_model_1.default.findOneAndUpdate({ user: userId }, update, Object.assign(Object.assign({}, settings), { upsert: true, setDefaultsOnInsert: true }));
            return { record: record.toObject(), created: !existing };
        }
        catch (error) {
            // TODO: a simultaneous save won the insert; apply this one as an update to that record.
            if ((error === null || error === void 0 ? void 0 : error.code) !== 11000)
                throw error;
            const record = yield expected_lifepartner_model_1.default.findOneAndUpdate({ user: userId }, update, settings);
            return { record: record.toObject(), created: false };
        }
    }),
    deleteExpectedPartner: (id) => __awaiter(void 0, void 0, void 0, function* () {
        yield expected_lifepartner_model_1.default.findByIdAndDelete(id);
    }),
};
