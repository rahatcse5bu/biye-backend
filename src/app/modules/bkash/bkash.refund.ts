import configSetup from "../../../helpers/configSetup";
import grantToken from "../../../helpers/grantToken";
import refundTransaction from "../../../helpers/refundTransaction";
import Payment from "../payments/payment.model";
import { UserInfoModel } from "../user_info/user_info.model";

export class RefundError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

type RefundInput = {
  paymentID?: unknown;
  trxID?: unknown;
  amount?: unknown;
  reason?: unknown;
};

const isRefunded = (result: any) =>
  Boolean(result?.refundTrxID) && result?.transactionStatus === "Completed";

// TODO: full refunds only; marks the payment Refunded and takes back its points.
export const processRefund = async (input: RefundInput) => {
  const paymentID = typeof input.paymentID === "string" ? input.paymentID.trim() : "";
  const trxID = typeof input.trxID === "string" ? input.trxID.trim() : "";
  if (!paymentID || !trxID) {
    throw new RefundError(400, "paymentID and trxID are required");
  }

  const payment: any = await Payment.findOne({ transaction_id: trxID });
  if (payment && payment.payment_id && payment.payment_id !== paymentID) {
    throw new RefundError(400, "paymentID does not match this transaction");
  }
  if (payment?.status === "Refunded") {
    throw new RefundError(409, "This payment is already refunded");
  }

  const amount = Number(input.amount ?? payment?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new RefundError(400, "A valid refund amount is required");
  }
  if (payment && Number(payment.amount) !== amount) {
    throw new RefundError(
      400,
      `Partial refunds are not supported. Refund amount must be ৳${payment.amount}`,
    );
  }

  await configSetup();
  await grantToken();

  // TODO: bKash returns the earlier refund here when this trx was already refunded.
  let result: any = await refundTransaction({ paymentID, trxID });
  if (!isRefunded(result)) {
    result = await refundTransaction({
      paymentID,
      trxID,
      amount: String(amount),
      sku: "points",
      reason:
        typeof input.reason === "string" && input.reason.trim()
          ? input.reason.trim()
          : "Admin refund",
    });
  }

  if (!isRefunded(result)) {
    throw new RefundError(
      502,
      result?.statusMessage || result?.errorMessage || "bKash refund failed",
    );
  }

  let pointsRemoved = 0;
  // TODO: atomic claim so a double click can't deduct points twice.
  const claimed = payment
    ? await Payment.findOneAndUpdate(
        { _id: payment._id, status: { $ne: "Refunded" } },
        {
          status: "Refunded",
          refund_trx_id: result.refundTrxID,
          refunded_at: new Date(),
        },
      )
    : null;
  if (claimed) {
    const user = await UserInfoModel.findOne({ email: payment.email });
    if (user) {
      // TODO: never below zero; points already spent can't be taken back.
      pointsRemoved = Math.min(user.points || 0, payment.points || 0);
      user.points = (user.points || 0) - pointsRemoved;
      await user.save();
    }
  }

  return {
    refundTrxID: result.refundTrxID,
    originalTrxID: result.originalTrxID || trxID,
    amount: result.amount || String(amount),
    transactionStatus: result.transactionStatus,
    paymentUpdated: Boolean(claimed),
    pointsRemoved,
  };
};
