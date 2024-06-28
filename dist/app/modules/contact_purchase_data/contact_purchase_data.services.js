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
exports.ContactPurchaseService = void 0;
const contact_purchase_data_model_1 = __importDefault(require("./contact_purchase_data.model"));
exports.ContactPurchaseService = {
    getAllContactPurchases: () => __awaiter(void 0, void 0, void 0, function* () {
        const contactPurchases = yield contact_purchase_data_model_1.default.find();
        return contactPurchases.map((contactPurchase) => contactPurchase.toObject());
    }),
    getContactPurchaseByUserAndBioUser: (user, bio_user, options = {}) => __awaiter(void 0, void 0, void 0, function* () {
        const contactPurchase = yield contact_purchase_data_model_1.default.findOne({
            user,
            bio_user,
        })
            .session(options.session)
            .lean();
        return contactPurchase;
    }),
    getContactPurchaseById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const contactPurchase = yield contact_purchase_data_model_1.default.findById(id);
        return contactPurchase ? contactPurchase.toObject() : null;
    }),
    getContactPurchaseByToken: (user) => __awaiter(void 0, void 0, void 0, function* () {
        const contactPurchase = yield contact_purchase_data_model_1.default.findOne({ user }).lean();
        return contactPurchase;
    }),
    createContactPurchase: (contactPurchaseData, options = {}) => __awaiter(void 0, void 0, void 0, function* () {
        const createdContactPurchase = yield contact_purchase_data_model_1.default.create([contactPurchaseData], { session: options.session });
        return createdContactPurchase[0];
    }),
    // createContactPurchase: async (
    //   contactPurchaseData: IContactPurchase
    // ): Promise<IContactPurchase> => {
    //   const createdContactPurchase = await ContactPurchase.create(
    //     contactPurchaseData
    //   );
    //   return createdContactPurchase;
    // },
    updateContactPurchase: (id, updatedFields) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedContactPurchase = yield contact_purchase_data_model_1.default.findOneAndUpdate({ user: id }, updatedFields, {
            new: true,
        });
        return updatedContactPurchase ? updatedContactPurchase.toObject() : null;
    }),
    deleteContactPurchase: (id) => __awaiter(void 0, void 0, void 0, function* () {
        yield contact_purchase_data_model_1.default.findByIdAndDelete(id);
    }),
};
