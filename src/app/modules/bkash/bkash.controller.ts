import { Request, Response } from "express";
import createPayment from "../../../helpers/createPayment";
import queryPayment from "../../../helpers/queryPayment";
import searchTransaction from "../../../helpers/searchTransaction";
import refundTransaction from "../../../helpers/refundTransaction";
import executePayment from "../../../helpers/executePayment";
import axios from "axios";
import { baseUrl } from "../../../shared/url";
import { UserInfoModel } from "../user_info/user_info.model";
import { late } from "zod";
import Payment from "../payments/payment.model";
import sendEmail from "../../../shared/SendEmail";

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
      if (singleUser) {
        // add payment to DB;
        const points = response?.amount * 1.2;
        await Payment.create({
          email,
          points,
          amount: response?.amount,
          transaction_id: response?.trxID,
          payment_id: paymentID,
          status: response?.transactionStatus,
          trnx_time:
            response?.paymentCreateTime || response?.paymentExecuteTime,
          purpose,
        });
        // updated points of the user
        singleUser.points = singleUser.points + points;
        await singleUser.save();
        saveInDb = true;
        const year = new Date().getFullYear();
        const html = `<!DOCTYPE html>
                        <html>
                        <head>
                          <style>
                            .container {
                              font-family: Arial, sans-serif;
                              max-width: 600px;
                              margin: 0 auto;
                              padding: 20px;
                              border: 1px solid #ddd;
                              border-radius: 10px;
                              background-color: #f9f9f9;
                            }
                            .header {
                              text-align: center;
                              padding-bottom: 20px;
                            }
                            .header h1 {
                              margin: 0;
                              color: #4CAF50;
                            }
                            .content {
                              line-height: 1.6;
                            }
                            .footer {
                              margin-top: 20px;
                              text-align: center;
                              font-size: 12px;
                              color: #777;
                            }
                          </style>
                        </head>
                        <body>
                          <div class="container">
                            <div class="header">
                              <h1>Purchase Confirmation</h1>
                            </div>
                            <div class="content">
                              <p>Dear [User's Name],</p>
                              <p>Thank you for your purchase!</p>
                              <p>We are pleased to inform you that your purchase of [Number of Points] points was successful. The points have been added to your account and are now available for use.</p>
                              <p>Here are the details of your transaction:</p>
                              <ul>
                                <li><strong>Transaction ID:</strong> ${
                                  response?.trxID
                                }</li>
                                <li><strong>Points Purchased:</strong>${points}</li>
                                <li><strong>Amount Paid:</strong> ${
                                  response?.amount
                                }</li>
                                <li><strong>Date of Purchase:</strong> ${
                                  response?.paymentCreateTime ||
                                  response?.paymentExecuteTime
                                }</li>
                              </ul>
                              <p>If you have any questions or need further assistance, please don't hesitate to contact our support team at [Support Email Address] or [Support Phone Number].</p>
                              <p>Thank you for choosing our service!</p>
                              <p>Best regards,</p>
                              <p>PNC-Nikah</p>
                            </div>
                            <div class="footer">
                              <p>&copy;${year}PNC-Nikah.com. All rights reserved.</p>
                              <p>Barishal, Bangladesh</p>
                            </div>
                          </div>
                        </body>
                        </html>
                        `;
        sendEmail(email, "Your Purchase of Points was Successful!", html);
      }

      res.json({
        success: true,
        statusMessage: response?.statusMessage,
        trxID: response?.trxID,
        saveInDb,
        paymentId: paymentID,
        amount: response?.amount,
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
    const refundStatusBody = {
      paymentID: req.body.paymentID,
      trxID: req.body.trxID,
    };

    const refundStatusResponse: any = await refundTransaction(refundStatusBody);

    if (refundStatusResponse?.refundTrxID) {
      console.log("status");
      res.send(refundStatusResponse);
    } else {
      console.log("refund");
      res.send(await refundTransaction(req.body));
    }
  } catch (e) {
    console.log(e);
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
