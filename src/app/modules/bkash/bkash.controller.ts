import { Request, Response } from "express";
import createPayment from "../../../helpers/createPayment";
import queryPayment from "../../../helpers/queryPayment";
import searchTransaction from "../../../helpers/searchTransaction";
import executePayment from "../../../helpers/executePayment";
import axios from "axios";
import { baseUrl } from "../../../shared/url";
import { UserInfoModel } from "../user_info/user_info.model";
import { late } from "zod";
import Payment from "../payments/payment.model";
import { formatTaka, mailUser } from "../../../shared/bibahoMail";
import { NotificationService } from "../notifications/notification.service";
import { PointsPackageService } from "../points_package/points_package.service";
import { processRefund, RefundError } from "./bkash.refund";

// Function to call the bKash execute payment API
async function BkashExecutePaymentAPICall(paymentID: string) {
  try {
    const response = await axios.post(`${baseUrl}/bkash/execute`, {
      paymentID,
    });
    return response.data;
  } catch (error) {
    console.error("An error occurred during payment execution:", error);
    throw error;
  }
}

// Function to call the bKash query payment API
async function BkashQueryPaymentAPICall(paymentID: string) {
  try {
    const response = await axios.post(`${baseUrl}/bkash/query`, { paymentID });
    return response.data;
  } catch (error) {
    console.error("An error occurred during payment querying:", error);
    throw error;
  }
}

const create = async (req: Request, res: Response) => {
  try {
    const createResult = await createPayment(req.body); // pass amount & callbackURL from frontend
    console.log("create payment~", createResult);
    res.json(createResult);
  } catch (e) {
    console.log(e);
  }
};

const execute = async (req: Request, res: Response) => {
  try {
    let executeResponse = await executePayment(req.body.paymentID);
    res.json(executeResponse);
  } catch (e) {
    console.log(e);
  }
};

const query = async (req: Request, res: Response) => {
  try {
    let queryResponse = await queryPayment(req.body.paymentID);
    res.json(queryResponse);
  } catch (e) {
    console.log(e);
  }
};

const search = async (req: Request, res: Response) => {
  try {
    res.send(await searchTransaction(req.body.trxID));
  } catch (e) {
    console.log(e);
  }
};
const afterPay = async (req: Request, res: Response) => {
  let { paymentID, email, purpose } = req.body;

  try {
    // Execute payment
    let response = await BkashExecutePaymentAPICall(paymentID);

    // Query payment if there is a message in the response
    if (response?.message) {
      response = await BkashQueryPaymentAPICall(paymentID);
    }

    if (response?.statusCode && response.statusCode === "0000") {
      const singleUser = await UserInfoModel.findOne({ email });
      let saveInDb = false;
      let points = 0;
      if (singleUser) {
        // TODO: admin pricing only for the points page; contact top-ups keep the fixed 1.2x.
        const paidAmount = Number(response?.amount);
        points =
          purpose === "buy_package"
            ? await PointsPackageService.pointsForAmount(paidAmount)
            : paidAmount * 1.2;
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
            status: existing.status,
            payment_create_time: existing.trnx_time,
          });
        }
        await UserInfoModel.updateOne(
          { _id: singleUser._id },
          { $inc: { points } },
        );
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
        mailUser(email, "পয়েন্ট কেনা সফল হয়েছে", {
          title: "পয়েন্ট কেনা সফল হয়েছে",
          tone: "success",
          paragraphs: [
            `ধন্যবাদ! আপনার পেমেন্ট সম্পন্ন হয়েছে এবং আপনার অ্যাকাউন্টে <strong>${points} পয়েন্ট</strong> যোগ হয়েছে।`,
            "পেমেন্টের ৩ দিনের মধ্যে আপনার পেমেন্ট হিস্টোরি থেকে রিফান্ড অনুরোধ করা যাবে।",
          ],
          details: [
            { label: "পরিমাণ", value: formatTaka(response?.amount) },
            { label: "যোগ হওয়া পয়েন্ট", value: points },
            { label: "ট্রানজেকশন আইডি", value: response?.trxID },
            { label: "সময়", value: response?.paymentCreateTime || response?.paymentExecuteTime },
          ],
          action: { label: "পেমেন্ট হিস্টোরি দেখুন", path: "/user/account/payment-and-refund" },
        });
      }

      res.json({
        success: true,
        statusMessage: response?.statusMessage,
        trxID: response?.trxID,
        saveInDb,
        paymentId: paymentID,
        amount: response?.amount,
        points,
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
      .json({ success: false, message: "An error occurred", error });
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
