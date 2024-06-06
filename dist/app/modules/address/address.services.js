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
exports.AddressService = void 0;
const address_model_1 = __importDefault(require("./address.model"));
exports.AddressService = {
    getAllAddresses: () => __awaiter(void 0, void 0, void 0, function* () {
        const addresses = yield address_model_1.default.find();
        return addresses.map((address) => address.toObject());
    }),
    getAddressById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const address = yield address_model_1.default.findById(id);
        return address ? address.toObject() : null;
    }),
    getAddressByToken: (user) => __awaiter(void 0, void 0, void 0, function* () {
        const address = yield address_model_1.default.findOne({ user }).lean();
        return address;
    }),
    createAddress: (addressData, options) => __awaiter(void 0, void 0, void 0, function* () {
        const createdAddress = yield address_model_1.default.create([addressData], options);
        return createdAddress[0].toObject();
    }),
    updateAddress: (id, updatedFields) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedAddress = yield address_model_1.default.findOneAndUpdate({ user: id }, updatedFields, {
            new: true,
        });
        return updatedAddress ? updatedAddress.toObject() : null;
    }),
    deleteAddress: (id) => __awaiter(void 0, void 0, void 0, function* () {
        yield address_model_1.default.findByIdAndDelete(id);
    }),
};
