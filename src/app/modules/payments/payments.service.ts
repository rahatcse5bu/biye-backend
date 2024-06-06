// payment.service.ts
import { ClientSession } from "mongoose";
import { IPayment } from "./payments.interface";
import Payment from "./payment.model";

export const PaymentService = {
  getAllPayments: async (): Promise<IPayment[]> => {
    const payments = await Payment.find();
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

  createPayment: async (
    paymentData: IPayment,
    options?: { session?: ClientSession }
  ): Promise<IPayment> => {
    const createdPayment = await Payment.create([paymentData], options);
    return createdPayment[0].toObject();
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
