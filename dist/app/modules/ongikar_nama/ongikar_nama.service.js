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
exports.OngikarNamaService = void 0;
const ongikar_nama_model_1 = __importDefault(require("./ongikar_nama.model"));
exports.OngikarNamaService = {
    getAllOngikarNamaes: () => __awaiter(void 0, void 0, void 0, function* () {
        const ongikarNamaes = yield ongikar_nama_model_1.default.find();
        return ongikarNamaes.map((ongikarNama) => ongikarNama.toObject());
    }),
    getOngikarNamaById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const ongikarNama = yield ongikar_nama_model_1.default.findById(id);
        return ongikarNama ? ongikarNama.toObject() : null;
    }),
    getOngikarNamaByToken: (user) => __awaiter(void 0, void 0, void 0, function* () {
        const ongikarNama = yield ongikar_nama_model_1.default.findOne({ user }).lean();
        return ongikarNama;
    }),
    createOngikarNama: (ongikarNamaData, options) => __awaiter(void 0, void 0, void 0, function* () {
        const createdOngikarNama = yield ongikar_nama_model_1.default.create([ongikarNamaData], options);
        return createdOngikarNama[0].toObject();
    }),
    updateOngikarNama: (id, updatedFields) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedOngikarNama = yield ongikar_nama_model_1.default.findOneAndUpdate({ user: id }, updatedFields, {
            new: true,
        });
        return updatedOngikarNama ? updatedOngikarNama.toObject() : null;
    }),
    deleteOngikarNama: (id) => __awaiter(void 0, void 0, void 0, function* () {
        yield ongikar_nama_model_1.default.findByIdAndDelete(id);
    }),
};
