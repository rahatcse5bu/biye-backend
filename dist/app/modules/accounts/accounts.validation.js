"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSchema = exports.entrySchema = exports.amountToPaisa = void 0;
const zod_1 = require("zod");
const amountToPaisa = (amount) => {
    const [taka, paisa = ""] = amount.split(".");
    return Number(taka) * 100 + Number(paisa.padEnd(2, "0"));
};
exports.amountToPaisa = amountToPaisa;
const amount = zod_1.z.union([zod_1.z.string(), zod_1.z.number().finite()])
    .transform(String)
    .pipe(zod_1.z.string().regex(/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/, "Enter a valid BDT amount with up to two decimal places"))
    .transform(exports.amountToPaisa)
    .refine((value) => value > 0, "Amount must be greater than zero");
exports.entrySchema = zod_1.z.object({
    type: zod_1.z.enum(["expense", "income", "investment"]),
    amount,
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
        const date = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }, "Enter a valid date"),
    category: zod_1.z.string().trim().min(1, "Category is required").max(100),
    person: zod_1.z.string().trim().max(150).default(""),
    notes: zod_1.z.string().trim().max(1000).default(""),
}).strict().transform((_a) => {
    var { amount } = _a, entry = __rest(_a, ["amount"]);
    return (Object.assign(Object.assign({}, entry), { amountPaisa: amount }));
});
exports.listSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).max(100000).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    type: zod_1.z.enum(["expense", "income", "investment"]).optional(),
    search: zod_1.z.string().trim().max(150).default(""),
});
