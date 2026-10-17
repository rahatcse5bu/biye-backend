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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = require("mongoose");
const auth_1 = require("../../middlewares/auth");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const accounts_model_1 = require("./accounts.model");
const accounts_validation_1 = require("./accounts.validation");
const router = (0, express_1.Router)();
router.use((0, auth_1.auth)("admin"));
router.get("/", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = accounts_validation_1.listSchema.safeParse(req.query);
    if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0].message });
        return;
    }
    const { page, limit, type, search } = parsed.data;
    const filter = {};
    if (type)
        filter.type = type;
    if (search) {
        const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = ["category", "person", "notes"].map((field) => ({ [field]: pattern }));
    }
    const [entries, totalItems, totals] = yield Promise.all([
        accounts_model_1.AccountsEntry.find(filter).sort({ date: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        accounts_model_1.AccountsEntry.countDocuments(filter),
        accounts_model_1.AccountsEntry.aggregate([
            { $group: { _id: "$type", amountPaisa: { $sum: "$amountPaisa" } } },
        ]),
    ]);
    const summary = { income: 0, investment: 0, expense: 0, balance: 0 };
    totals.forEach((total) => {
        if (total._id === "income" || total._id === "investment" || total._id === "expense") {
            summary[total._id] = total.amountPaisa / 100;
        }
    });
    const totalPaisa = (kind) => { var _a; return ((_a = totals.find((total) => total._id === kind)) === null || _a === void 0 ? void 0 : _a.amountPaisa) || 0; };
    summary.balance = (totalPaisa("income") + totalPaisa("investment") - totalPaisa("expense")) / 100;
    res.json({ success: true, data: {
            entries: entries.map((_a) => {
                var { amountPaisa } = _a, entry = __rest(_a, ["amountPaisa"]);
                return (Object.assign(Object.assign({}, entry), { amount: amountPaisa / 100 }));
            }),
            summary,
            pagination: { currentPage: page, totalPages: Math.max(1, Math.ceil(totalItems / limit)), totalItems },
        } });
})));
router.post("/", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = accounts_validation_1.entrySchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0].message });
        return;
    }
    const entry = yield accounts_model_1.AccountsEntry.create(Object.assign(Object.assign({}, parsed.data), { createdBy: req.user._id, updatedBy: req.user._id }));
    res.status(201).json({ success: true, data: Object.assign(Object.assign({}, entry.toObject()), { amount: entry.amountPaisa / 100 }) });
})));
router.patch("/:id", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(0, mongoose_1.isValidObjectId)(req.params.id)) {
        res.status(400).json({ success: false, message: "Invalid entry ID" });
        return;
    }
    const parsed = accounts_validation_1.entrySchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0].message });
        return;
    }
    const entry = yield accounts_model_1.AccountsEntry.findByIdAndUpdate(req.params.id, { $set: Object.assign(Object.assign({}, parsed.data), { updatedBy: req.user._id }) }, { new: true, runValidators: true });
    if (!entry) {
        res.status(404).json({ success: false, message: "Entry not found" });
        return;
    }
    res.json({ success: true, data: Object.assign(Object.assign({}, entry.toObject()), { amount: entry.amountPaisa / 100 }) });
})));
exports.default = router;
