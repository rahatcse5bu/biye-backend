import { Request, Response } from "express";
import createPayment from "../../../helpers/createPayment";
import queryPayment from "../../../helpers/queryPayment";
import searchTransaction from "../../../helpers/searchTransaction";
import executePayment from "../../../helpers/executePayment";
import { UserInfoModel } from "../user_info/user_info.model";
import Payment from "../payments/payment.model";
import { mailUser } from "../../../shared/bibahoMail";
import { emailTemplates } from "../../../shared/emailTemplates";
import { NotificationService } from "../notifications/notification.service";
import { PointsPackageService } from "../points_package/points_package.service";
import { processRefund, RefundError } from "./bkash.refund";
import BkashIntent from "./bkash_intent.model";

// TODO: every bKash handler must answer, otherwise the browser waits until it times out.
const bkashFailed = (res: Response, error: unknown) => {
  console.error("bKash request failed:", error);
  res.status(502).json({ success: false, message: "bKash request failed. Please try again." });
};

const create = async (req: Request, res: Response) => {
  try {
    const createResult: any = await createPayment(req.body); // pass amount & callbackURL from frontend
    if (createResult?.paymentID) {
      await BkashIntent.create({
        payment_id: createResult.paymentID,
        user: req.user?._id,
        amount: Number(req.body?.amount) || undefined,
      });
    }
    res.json(createResult);
  } catch (e) {
    bkashFailed(res, e);
  }
};

const execute = async (req: Request, res: Response) => {
  try {
    let executeResponse = await executePayment(req.body.paymentID);
    res.json(executeResponse);
  } catch (e) {
    bkashFailed(res, e);
  }
};

const query = async (req: Request, res: Response) => {
  try {
    let queryResponse = await queryPayment(req.body.paymentID);
    res.json(queryResponse);
  } catch (e) {
    bkashFailed(res, e);
  }
};

const search = async (req: Request, res: Response) => {
  try {
    res.send(await searchTransaction(req.body.trxID));
  } catch (e) {
    bkashFailed(res, e);
  }
};
const afterPay = async (req: Request, res: Response) => {
  const { paymentID, purpose } = req.body;

  try {
    // TODO: points always go to the logged-in buyer, never to an email named in the request.
    const buyer: any = await UserInfoModel.findById(req.user?._id).select("email").lean();
    const email = buyer?.email;
    if (!email) {
      return res.status(401).json({ success: false, message: "You are not authorized" });
    }

    // TODO: only the account that started the payment may confirm it; checked before execute, so a mismatch is never charged.
    const notYours = {
      success: false,
      message: "এই পেমেন্টটি অন্য একটি অ্যাকাউন্ট থেকে শুরু করা হয়েছে। যে অ্যাকাউন্ট থেকে পেমেন্ট শুরু করেছিলেন সেটিতে লগইন করে আবার চেষ্টা করুন।",
    };
    if (typeof paymentID !== "string" || !paymentID) {
      return res.status(400).json({ success: false, message: "paymentID is required" });
    }
    const recorded: any = await Payment.findOne({ payment_id: paymentID }).select("email").lean();
    if (recorded && recorded.email !== email) {
      return res.status(403).json(notYours);
    }
    if (!recorded) {
      const intent: any = await BkashIntent.findOne({ payment_id: paymentID }).select("user").lean();
      if (!intent || String(intent.user) !== String(req.user?._id)) {
        return res.status(403).json(notYours);
      }
    }

    // Execute payment directly (no HTTP call back into this server)
    let response = await executePayment(paymentID);

    // Query payment if there is a message in the response
    if (response?.message) {
      response = await queryPayment(paymentID);
    }

    // TODO: query returns 0000 for unpaid "Initiated" payments too; only a Completed transaction earns points.
    if (response?.statusCode === "0000" && response?.transactionStatus === "Completed") {
      const singleUser = await UserInfoModel.findOne({ email });
      let saveInDb = false;
      let points = 0;
      // TODO: the buyer's balance after this payment, so the site can update it without refetching.
      let pointsBalance: number | null = singleUser ? Number(singleUser.points) || 0 : null;
      if (singleUser) {
        // TODO: points page uses package/custom pricing; purchase top-ups use the same admin rate the frontend priced them with.
        const paidAmount = Number(response?.amount);
        points =
          purpose === "buy_package"
            ? await PointsPackageService.pointsForAmount(paidAmount)
            : await PointsPackageService.topUpPointsForAmount(paidAmount);
        // TODO: insert-once by paymentID so a page refresh or repeat call never credits twice.
        const existing: any = await Payment.findOneAndUpdate(
          { payment_id: paymentID },
          {
            $setOnInsert: {
              email,
              points,
              amount: response?.amount,
              transaction_id: response?.trxID,
              payment_id: paymentID,
              status: response?.transactionStatus,
              trnx_time:
                response?.paymentCreateTime || response?.paymentExecuteTime,
              purpose,
            },
          },
          { upsert: true, new: false },
        ).lean();
        if (existing) {
          return res.json({
            success: true,
            alreadyRecorded: true,
            trxID: existing.transaction_id,
            paymentId: paymentID,
            amount: existing.amount,
            points: existing.points,
            points_balance: pointsBalance,
            status: existing.status,
            payment_create_time: existing.trnx_time,
          });
        }
        const credited: any = await UserInfoModel.findOneAndUpdate(
          { _id: singleUser._id },
          { $inc: { points } },
          { new: true },
        )
          .select("points")
          .lean();
        pointsBalance = Number(credited?.points) || 0;
        saveInDb = true;
        NotificationService.notify({
          recipient: singleUser._id,
          audience: "user",
          type: "payment",
          title: "পেমেন্ট সফল",
          message: `৳${response?.amount} পেমেন্ট সম্পন্ন হয়েছে। আপনার অ্যাকাউন্টে ${points} পয়েন্ট যোগ হয়েছে।`,
          link: "/user/account/dashboard",
        });
        NotificationService.notify({
          audience: "admin",
          type: "payment",
          title: "নতুন পেমেন্ট",
          message: `${email} ৳${response?.amount} পেমেন্ট করেছেন (TrxID: ${response?.trxID})।`,
          link: "/payments",
        });
        const receipt = emailTemplates.paymentSuccess({
          name: singleUser.username,
          amount: response?.amount,
          points,
          balance: pointsBalance,
          trxId: response?.trxID,
          paidAt: response?.paymentExecuteTime || response?.paymentCreateTime,
        });
        mailUser(email, receipt.subject, receipt.content);
      }

      res.json({
        success: true,
        statusMessage: response?.statusMessage,
        trxID: response?.trxID,
        saveInDb,
        paymentId: paymentID,
        amount: response?.amount,
        points,
        points_balance: pointsBalance,
        status: response?.transactionStatus,
        payment_create_time:
          response?.paymentCreateTime || response?.paymentExecuteTime,
      });
    } else {
      res.json({
        success: false,
        message: response?.statusMessage,
      });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res
      .status(500)
      .json({ success: false, message: "Payment could not be confirmed. If money was deducted, contact support with your TrxID." });
  }
};

const refund = async (req: Request, res: Response) => {
  try {
    res.json(await processRefund(req.body || {}));
  } catch (error: any) {
    const statusCode = error instanceof RefundError ? error.statusCode : 500;
    if (statusCode === 500) console.error("bKash refund failed:", error);
    res.status(statusCode).json({
      success: false,
      message: statusCode === 500 ? "Refund failed" : error.message,
    });
  }
};

export const bkashControllers = {
  create,
  refund,
  search,
  execute,
  query,
  afterPay,
};
