import configSetup from "../../../helpers/configSetup";
import grantToken from "../../../helpers/grantToken";
import refundTransaction from "../../../helpers/refundTransaction";
import Payment from "../payments/payment.model";
import { UserInfoModel } from "../user_info/user_info.model";
import RefundRequest from "../refund_request/refund_request.model";
import { NotificationService } from "../notifications/notification.service";
import { formatTaka, mailUser } from "../../../shared/bibahoMail";

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

// TODO: refunds the full amount, or a pending user request's amount; marks the payment Refunded and takes back its points.
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

  // TODO: a pending user request already holds the points and fixes the refund amount.
  const request: any = payment
    ? await RefundRequest.findOne({ payment: payment._id, status: "requested" }).lean()
    : null;
  const expectedAmount = request ? request.refund_amount : payment?.amount;

  const amount = Number(input.amount ?? expectedAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new RefundError(400, "A valid refund amount is required");
  }
  if (payment && Number(expectedAmount) !== amount) {
    throw new RefundError(
      400,
      request
        ? `This payment has a pending refund request. Refund amount must be ৳${expectedAmount}`
        : `Partial refunds are not supported. Refund amount must be ৳${expectedAmount}`,
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
  let pointsBalance: number | null = null;
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
  const settledRequest = claimed && request
    ? await RefundRequest.findOneAndUpdate(
        { _id: request._id, status: "requested" },
        { status: "refunded", refund_trx_id: result.refundTrxID, processed_at: new Date() },
      )
    : null;
  if (settledRequest) {
    pointsRemoved = request.points_held;
    pointsBalance =
      ((await UserInfoModel.findOne({ email: payment.email }).select("points").lean()) as any)
        ?.points ?? null;
    NotificationService.notify({
      recipient: String(request.user),
      audience: "user",
      type: "refund",
      title: "রিফান্ড সম্পন্ন",
      message: `আপনার ৳${amount} রিফান্ড বিকাশে পাঠানো হয়েছে (Refund TrxID: ${result.refundTrxID})।`,
      link: "/user/account/payment-and-refund",
    });
  } else if (claimed) {
    // TODO: removes all purchased points; balance may go negative if some were already spent.
    const user = await UserInfoModel.findOneAndUpdate(
      { email: payment.email },
      { $inc: { points: -(payment.points || 0) } },
      { new: true },
    )
      .select("points")
      .lean();
    if (user) {
      pointsRemoved = payment.points || 0;
      pointsBalance = user.points ?? null;
    }
  }

  // TODO: one email per refund, sent only by the request that actually settled it.
  if (settledRequest || claimed) {
    mailUser(payment.email, "রিফান্ড সম্পন্ন হয়েছে", {
      title: "আপনার রিফান্ড সম্পন্ন হয়েছে",
      tone: "success",
      paragraphs: [
        "আপনার পেমেন্টের রিফান্ড বিকাশের মাধ্যমে পাঠানো হয়েছে। টাকা আপনার বিকাশ অ্যাকাউন্টে পৌঁছাতে কিছু সময় লাগতে পারে।",
        `এই পেমেন্টের <strong>${pointsRemoved} পয়েন্ট</strong> আপনার অ্যাকাউন্ট থেকে সরিয়ে নেওয়া হয়েছে।`,
      ],
      details: [
        { label: "রিফান্ডের পরিমাণ", value: formatTaka(amount) },
        { label: "রিফান্ড ট্রানজেকশন আইডি", value: result.refundTrxID },
        { label: "মূল ট্রানজেকশন আইডি", value: result.originalTrxID || trxID },
        { label: "বর্তমান পয়েন্ট", value: pointsBalance },
      ],
      action: { label: "পেমেন্ট হিস্টোরি দেখুন", path: "/user/account/payment-and-refund" },
    });
  }

  return {
    refundTrxID: result.refundTrxID,
    originalTrxID: result.originalTrxID || trxID,
    amount: result.amount || String(amount),
    transactionStatus: result.transactionStatus,
    paymentUpdated: Boolean(claimed),
    pointsRemoved,
    pointsBalance,
  };
};
