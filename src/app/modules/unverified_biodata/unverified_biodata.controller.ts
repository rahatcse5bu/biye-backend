import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import UnverifiedBiodata from "./unverified_biodata.model";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";
import { UnverifiedContactPurchaseService } from "../unverified_contact_purchase/unverified_contact_purchase.service";
import { validateExtraFields } from "./unverified_biodata.validation";
import httpStatus from "http-status";
import sendEmail from "../../../shared/SendEmail";
import axios from "axios";

const createUnverifiedBiodata = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user?._id;
  if (!adminId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // Validate extra_fields if provided
  const validation = validateExtraFields(req.body.extra_fields);
  if (!validation.isValid) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errors: validation.errors,
    });
  }

  const data = { ...req.body, created_by: adminId };
  const biodata = await UnverifiedBiodata.create(data);

  res.status(201).json({
    success: true,
    message: "Unverified biodata created successfully",
    data: biodata,
  });
});

const getAllUnverifiedBiodatas = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 12,
    bio_type,
    gender,
    marital_status,
    religion,
    zilla,
    sortOrder = "desc",
  } = req.query;

  const filter: any = { is_active: true };
  if (bio_type) filter.bio_type = bio_type;
  if (gender) filter.gender = gender;
  if (marital_status) filter.marital_status = marital_status;
  if (religion) filter.religion = religion;
  if (zilla) filter.zilla = zilla;

  const skip = (Number(page) - 1) * Number(limit);
  const sort: any = { createdAt: sortOrder === "asc" ? 1 : -1 };

  const [biodatas, total] = await Promise.all([
    UnverifiedBiodata.find(filter)
      .select("-contact_name -contact_phone -contact_email")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    UnverifiedBiodata.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: biodatas,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

const getAllUnverifiedBiodatasByAdmin = catchAsync(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, search } = req.query;
  const filter: any = {};

  if (search) {
    filter.$or = [
      { contact_name: { $regex: search, $options: "i" } },
      { zilla: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [biodatas, total] = await Promise.all([
    UnverifiedBiodata.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    UnverifiedBiodata.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: biodatas,
    totalPages: Math.ceil(total / Number(limit)),
    currentPage: Number(page),
    totalItems: total,
  });
});

const getUnverifiedBiodataById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const biodata = await UnverifiedBiodata.findById(id)
    .select("-contact_name -contact_phone -contact_email")
    .lean();

  if (!biodata) {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  // Increment views
  await UnverifiedBiodata.findByIdAndUpdate(id, { $inc: { views_count: 1 } });

  res.status(200).json({ success: true, data: biodata });
});

const updateUnverifiedBiodata = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate extra_fields if provided
  if (req.body.extra_fields) {
    const validation = validateExtraFields(req.body.extra_fields);
    if (!validation.isValid) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }
  }

  const updated = await UnverifiedBiodata.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  res.status(200).json({
    success: true,
    message: "Updated successfully",
    data: updated,
  });
});

const deleteUnverifiedBiodata = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await UnverifiedBiodata.findByIdAndDelete(id);
  res.status(200).json({ success: true, message: "Deleted successfully" });
});

const purchaseUnverifiedBiodataContact = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }

    const { id } = req.params; // unverified_biodata id

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check user has enough points
      const userInfo: any = await UserInfoModel.findById(userId).session(
        session
      );

      if (!userInfo) {
        await session.abortTransaction();
        session.endSession();
        return res.status(httpStatus.NOT_FOUND).json({
          statusCode: httpStatus.NOT_FOUND,
          message: "User info not found",
          success: false,
        });
      }

      // Check if unverified biodata exists
      const biodata: any = await UnverifiedBiodata.findById(id).session(
        session
      );

      if (!biodata) {
        await session.abortTransaction();
        session.endSession();
        return res.status(httpStatus.NOT_FOUND).json({
          statusCode: httpStatus.NOT_FOUND,
          message: "Biodata not found",
          success: false,
        });
      }

      // Check if already purchased
      const existingPurchase =
        await UnverifiedContactPurchaseService.getUnverifiedContactPurchaseByUserAndBiodata(
          userId,
          id,
          session
        );

      if (existingPurchase) {
        await session.abortTransaction();
        session.endSession();
        return res.status(httpStatus.BAD_REQUEST).json({
          statusCode: httpStatus.BAD_REQUEST,
          message: "You have already purchased contact info for this biodata",
          success: false,
        });
      }

      // Check points
      if (userInfo.points < 50) {
        await session.abortTransaction();
        session.endSession();
        return res.status(httpStatus.BAD_REQUEST).json({
          statusCode: httpStatus.BAD_REQUEST,
          message: "You do not have enough points to buy (need 50 points)",
          success: false,
        });
      }

      // Create purchase record
      const purchaseData = {
        user: userId,
        unverified_biodata: id,
        points_spent: 50,
        contact_info: {
          full_name: biodata.contact_name,
          family_number: biodata.contact_phone,
          bio_receiving_email: biodata.contact_email,
        },
      };

      const [createdPurchase] =
        await UnverifiedContactPurchaseService.createUnverifiedContactPurchase(
          purchaseData,
          { session }
        );

      // Update user points
      const remainingPoints = userInfo.points - 50;
      userInfo.points = remainingPoints;
      await userInfo.save({ session });

      // Increment purchases count on biodata
      await UnverifiedBiodata.findByIdAndUpdate(
        id,
        { $inc: { purchases_count: 1 } },
        { session }
      );

      // Send confirmation email to buyer
      const buyerHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                .container { width: 100%; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; }
                .header { background-color: #4CAF50; color: white; padding: 10px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { padding: 20px; }
                .footer { text-align: center; margin-top: 20px; color: #888; }
                .contact-box { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Contact Information Purchased</h1>
                </div>
                <div class="content">
                    <p>Dear Sir/Madam,</p>
                    <p>Thank you for your purchase! You have successfully bought the contact information for 50 points.</p>
                    <p>Your remaining points: <strong>${remainingPoints}</strong></p>
                    <div class="contact-box">
                        <h3>Contact Details:</h3>
                        <p><strong>Name:</strong> ${biodata.contact_name}</p>
                        <p><strong>Phone:</strong> ${biodata.contact_phone}</p>
                        <p><strong>Email:</strong> ${biodata.contact_email}</p>
                    </div>
                    <p>If you have any questions, please contact our support team.</p>
                    <p>Best Regards,<br>PNC-Nikah Team</p>
                    <p><a href="http://www.pnc-nikah.com">Visit our website</a></p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 PNC-Nikah. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `;

      await sendEmail(userInfo.email, "Contact Information Purchase Confirmation", buyerHtml);

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.status(httpStatus.OK).json({
        success: true,
        message: "Contact information purchased successfully",
        data: {
          contact_info: purchaseData.contact_info,
          points_spent: 50,
          remaining_points: remainingPoints,
        },
      });
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error purchasing contact info:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
);

const parseCustomFieldsWithLLM = catchAsync(async (req: Request, res: Response) => {
  const { biodata_text } = req.body;

  if (!biodata_text || typeof biodata_text !== "string") {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "biodata_text is required and must be a string",
    });
  }

  try {
    const axios = require("axios");
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "LLM service not configured",
      });
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemma-3-4b-it:free",
        messages: [
          {
            role: "system",
            content: `You are a biodata data extraction specialist. Extract ONLY custom/additional fields from biodata text.

IGNORE standard fields: name, phone, email, gender, DOB, height, weight, blood group, religion, marital status, address, nationality, complexion.

Extract custom fields like: profession, education, income, family background, interests, lifestyle, requirements.

For each field, determine type: "text"|"numeric"|"email"|"phone"|"select"|"boolean"

Return a JSON array: [{"label":"Field name","value":"Sample value","fieldType":"text","options":[]}]
Only return JSON array, no other text.`,
          },
          {
            role: "user",
            content: `Extract custom fields from: ${biodata_text}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        top_p: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:5000",
          "X-Title": "PNC Nikah Backend",
        },
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No custom fields found",
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const fields = parsed
      .filter(
        (f: any) =>
          f.label &&
          f.value !== undefined &&
          f.value !== null &&
          f.fieldType
      )
;

    res.status(200).json({
      success: true,
      data: fields,
      message: `Extracted ${fields.length} custom field(s)`,
    });
  } catch (error: any) {
    const detail = error.response?.data || error.message;
    console.error("LLM parsing error:", JSON.stringify(detail));
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to parse fields with LLM",
      error: detail,
    });
  }
});

export const UnverifiedBiodataController = {
  createUnverifiedBiodata,
  getAllUnverifiedBiodatas,
  getAllUnverifiedBiodatasByAdmin,
  getUnverifiedBiodataById,
  updateUnverifiedBiodata,
  deleteUnverifiedBiodata,
  purchaseUnverifiedBiodataContact,
  parseCustomFieldsWithLLM,
};
