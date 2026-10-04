// payment.service.ts
import { ClientSession, isValidObjectId } from "mongoose";
import { IPayment } from "./payments.interface";
import Payment from "./payment.model";

export const PaymentService = {
  getAllPayments: async (): Promise<IPayment[]> => {
    const payments = await Payment.find().sort({ createdAt: -1, _id: -1 });
    return payments.map((payment) => payment.toObject());
  },

  getPaymentById: async (id: string): Promise<IPayment | null> => {
    const payment = await Payment.findById(id);
    return payment ? payment.toObject() : null;
  },
  getPaymentByToken: async (user: string): Promise<IPayment | null> => {
    const payment = await Payment.findOne({ user }).lean();
    return payment;
  },
  getPaymentByEmail: async (email: string) => {
    const payment = await Payment.find({ email })
      .sort({ createdAt: -1, _id: -1 })
      .lean();
    return payment;
  },

  createPayment: async (paymentData: IPayment): Promise<IPayment> => {
    const createdPayment = await Payment.create(paymentData);
    return createdPayment;
  },

  updatePaymentById: async (
    id: string,
    updatedFields: Partial<IPayment>,
  ): Promise<IPayment | null> => {
    if (!isValidObjectId(id)) return null;
    return Payment.findByIdAndUpdate(id, updatedFields, { new: true }).lean();
  },

  updatePayment: async (
    id: string,
    updatedFields: Partial<IPayment>
  ): Promise<IPayment | null> => {
    const updatedPayment = await Payment.findOneAndUpdate(
      { user: id },
      updatedFields,
      {
        new: true,
      }
    );
    return updatedPayment ? updatedPayment.toObject() : null;
  },

  deletePayment: async (id: string): Promise<void> => {
    await Payment.findByIdAndDelete(id);
  },
};
