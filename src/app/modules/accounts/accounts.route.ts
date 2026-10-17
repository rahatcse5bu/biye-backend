import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { auth } from "../../middlewares/auth";
import catchAsync from "../../../shared/catchAsync";
import { AccountsEntry } from "./accounts.model";
import { entrySchema, listSchema } from "./accounts.validation";

const router = Router();
router.use(auth("admin"));

router.get("/", catchAsync(async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    return;
  }
  const { page, limit, type, search } = parsed.data;
  const filter: Record<string, unknown> = {};
  if (type) filter.type = type;
  if (search) {
    const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = ["category", "person", "notes"].map((field) => ({ [field]: pattern }));
  }
  const [entries, totalItems, totals] = await Promise.all([
    AccountsEntry.find(filter).sort({ date: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AccountsEntry.countDocuments(filter),
    AccountsEntry.aggregate<{ _id: string; amountPaisa: number }>([
      { $group: { _id: "$type", amountPaisa: { $sum: "$amountPaisa" } } },
    ]),
  ]);
  const summary = { income: 0, investment: 0, expense: 0, balance: 0 };
  totals.forEach((total) => {
    if (total._id === "income" || total._id === "investment" || total._id === "expense") {
      summary[total._id] = total.amountPaisa / 100;
    }
  });
  const totalPaisa = (kind: string) => totals.find((total) => total._id === kind)?.amountPaisa || 0;
  summary.balance = (totalPaisa("income") + totalPaisa("investment") - totalPaisa("expense")) / 100;
  res.json({ success: true, data: {
    entries: entries.map(({ amountPaisa, ...entry }) => ({ ...entry, amount: amountPaisa / 100 })),
    summary,
    pagination: { currentPage: page, totalPages: Math.max(1, Math.ceil(totalItems / limit)), totalItems },
  } });
}));

router.post("/", catchAsync(async (req, res) => {
  const parsed = entrySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    return;
  }
  const entry = await AccountsEntry.create({ ...parsed.data, createdBy: req.user!._id, updatedBy: req.user!._id });
  res.status(201).json({ success: true, data: { ...entry.toObject(), amount: entry.amountPaisa / 100 } });
}));

router.patch("/:id", catchAsync(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    res.status(400).json({ success: false, message: "Invalid entry ID" });
    return;
  }
  const parsed = entrySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    return;
  }
  const entry = await AccountsEntry.findByIdAndUpdate(req.params.id,
    { $set: { ...parsed.data, updatedBy: req.user!._id } },
    { new: true, runValidators: true });
  if (!entry) {
    res.status(404).json({ success: false, message: "Entry not found" });
    return;
  }
  res.json({ success: true, data: { ...entry.toObject(), amount: entry.amountPaisa / 100 } });
}));

export default router;
