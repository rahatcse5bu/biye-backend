import { z } from "zod";

export const amountToPaisa = (amount: string) => {
  const [taka, paisa = ""] = amount.split(".");
  return Number(taka) * 100 + Number(paisa.padEnd(2, "0"));
};

const amount = z.union([z.string(), z.number().finite()])
  .transform(String)
  .pipe(z.string().regex(/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/, "Enter a valid BDT amount with up to two decimal places"))
  .transform(amountToPaisa)
  .refine((value) => value > 0, "Amount must be greater than zero");

export const entrySchema = z.object({
  type: z.enum(["expense", "income", "investment"]),
  amount,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a valid date"),
  category: z.string().trim().min(1, "Category is required").max(100),
  person: z.string().trim().max(150).default(""),
  notes: z.string().trim().max(1000).default(""),
}).strict().transform(({ amount, ...entry }) => ({ ...entry, amountPaisa: amount }));

export const listSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(["expense", "income", "investment"]).optional(),
  search: z.string().trim().max(150).default(""),
});
