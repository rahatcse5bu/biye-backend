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
exports.ContactService = void 0;
const contact_model_1 = __importDefault(require("./contact.model"));
exports.ContactService = {
    getAllContacts: () => __awaiter(void 0, void 0, void 0, function* () {
        const contacts = yield contact_model_1.default.find();
        return contacts.map((contact) => contact.toObject());
    }),
    getContactById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const contact = yield contact_model_1.default.findById(id);
        return contact ? contact.toObject() : null;
    }),
    getContactByToken: (user) => __awaiter(void 0, void 0, void 0, function* () {
        const contact = yield contact_model_1.default.findOne({ user }).lean();
        return contact;
    }),
    createContact: (contactData, options) => __awaiter(void 0, void 0, void 0, function* () {
        const createdContact = yield contact_model_1.default.create([contactData], options);
        return createdContact[0].toObject();
    }),
    updateContact: (id, updatedFields) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedContact = yield contact_model_1.default.findOneAndUpdate({ user: id }, updatedFields, {
            new: true,
        });
        return updatedContact ? updatedContact.toObject() : null;
    }),
    deleteContact: (id) => __awaiter(void 0, void 0, void 0, function* () {
        yield contact_model_1.default.findByIdAndDelete(id);
    }),
};
