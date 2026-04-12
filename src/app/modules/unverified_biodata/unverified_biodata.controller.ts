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
    console.error("[createUnverifiedBiodata] Validation errors:", validation.errors);
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errors: validation.errors,
    });
  }

  // Clean up empty strings for optional fields
  const cleanedData = {
    ...req.body,
    created_by: adminId,
    // Convert empty strings to null for optional fields
    date_of_birth: req.body.date_of_birth ? new Date(req.body.date_of_birth) : null,
    zilla: req.body.zilla || null,
    upzilla: req.body.upzilla || null,
    division: req.body.division || null,
    contact_phone: req.body.contact_phone || null,
  };

  try {
    const biodata = await UnverifiedBiodata.create(cleanedData);

    // Send welcome email to the user with their biodata link
    if (biodata.contact_email) {
      try {
        const biodataLink = `https://biye.info/biodata/unverified/${biodata._id}`;
        const emailSubject = "Welcome to বিয়ে.ইনফো - Your Biodata Profile Created";
        const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .welcome-text { font-size: 16px; margin-bottom: 20px; }
        .info-box { background: #f0f8f0; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .link-section { margin: 25px 0; text-align: center; }
        .share-link { background: #4CAF50; color: white; padding: 15px; border-radius: 6px; display: inline-block; word-break: break-all; font-weight: bold; }
        .benefits { margin: 20px 0; }
        .benefit-item { padding: 10px 0; padding-left: 25px; position: relative; }
        .benefit-item:before { content: "✓"; position: absolute; left: 0; color: #4CAF50; font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
        .cta-button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 15px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>স্বাগতম দ্বি.ইনফোতে</h1>
            <p>Welcome to বিয়ে.ইনফো - Matrimony Platform</p>
        </div>
        <div class="content">
            <p class="welcome-text">
                আপনার সাথে যোগাযোগ করতে পেরে আমরা আনন্দিত। আপনার তথ্য সফলভাবে আমাদের প্ল্যাটফর্মে যোগ করা হয়েছে।
            </p>
            
            <div class="info-box">
                <strong>Good news!</strong> আপনার বায়োডেটা প্রোফাইল এখন লাইভ আছে এবং সম্ভাব্য ম্যাচদের কাছে দৃশ্যমান।
            </div>

            <h3 style="color: #1a2e1a;">আপনার প্রোফাইল লিঙ্ক:</h3>
            <div class="link-section">
                <div class="share-link">${biodataLink}</div>
            </div>

            <div class="benefits">
                <h3 style="color: #1a2e1a;">এই লিঙ্কটি শেয়ার করুন এবং পান:</h3>
                <div class="benefit-item">আরও ভালো সাড়া এবং মিলের সম্ভাবনা</div>
                <div class="benefit-item">পরিবার এবং বন্ধুদের সাথে সহজে শেয়ার করুন</div>
                <div class="benefit-item">আপনার প্রোফাইল সম্পূর্ণ নিয়ন্ত্রণে থাকে</div>
                <div class="benefit-item">যেকোনো সময় আপডেট করুন</div>
            </div>

            <h3 style="color: #1a2e1a;">আপনার প্রোফাইল দেখতে:</h3>
            <p>নিচের বাটনে ক্লিক করুন অথবা উপরের লিঙ্কটি আপনার ব্রাউজারে কপি করুন।</p>
            <p style="text-align: center;">
                <a href="${biodataLink}" class="cta-button">আপনার প্রোফাইল দেখুন</a>
            </p>

            <h3 style="color: #1a2e1a;">প্রশ্ন থাকলে?</h3>
            <p>আমাদের সাথে যোগাযোগ করুন info@biye.info এ অথবা আমাদের ওয়েবসাইট visit করুন।</p>

            <div class="footer">
                <p>সর্বদা আমাদের সাথে থাকার জন্য ধন্যবাদ। বিয়ে.ইনফো টিম</p>
                <p>© 2026 বিয়ে.ইনফো | সকল অধিকার সংরক্ষিত</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;

        // Send email asynchronously (don't wait for it)
        sendEmail(
          biodata.contact_email,
          emailSubject,
          emailBody
        ).catch((emailError: any) => {
          console.warn("[createUnverifiedBiodata] Email sending failed:", emailError.message);
          // Don't fail the API response if email fails
        });
      } catch (emailError: any) {
        console.warn("[createUnverifiedBiodata] Email preparation failed:", emailError.message);
        // Continue with response even if email fails
      }
    }

    res.status(201).json({
      success: true,
      message: "Unverified biodata created successfully",
      data: biodata,
    });
  } catch (dbError: any) {
    console.error("[createUnverifiedBiodata] Database error:", dbError.message);

    // Handle validation errors from MongoDB schema
    if (dbError.name === "ValidationError") {
      const errors = Object.entries(dbError.errors).map(
        ([key, err]: [string, any]) => `${key}: ${err.message}`
      );
      return res.status(httpStatus.UNPROCESSABLE_ENTITY).json({
        success: false,
        message: "Database validation failed",
        errors,
      });
    }

    throw dbError;
  }
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
    // Truncate very long text to avoid exceeding token limits
    const maxChars = 2000;
    const truncatedText = biodata_text.length > maxChars
      ? biodata_text.substring(0, maxChars) + "..."
      : biodata_text;

    const { callGroqAPI } = require("../../../services/groqService");

    const response = await callGroqAPI(
      [
        {
          role: "system",
          content: `You are a biodata data extraction specialist. Extract ONLY custom/additional fields from biodata text.

IGNORE standard fields: name, phone, email, gender, DOB, height, weight, blood group, religion, marital status, address, nationality, complexion.

Extract custom fields like: profession, education, income, family background, interests, lifestyle, requirements.

For each field, determine type: "text"|"numeric"|"email"|"phone"|"select"|"boolean"

Return a JSON array: [{"label":"Field name","value":"Sample value","fieldType":"text","options":[]}]
Only return JSON array, no other text or markdown.`,
        },
        {
          role: "user",
          content: `Extract custom fields from: ${truncatedText}`,
        },
      ],
      "meta-llama/llama-4-scout-17b-16e-instruct",
      0.3,
      800
    );

    // Safely access response content
    if (!response || !response.choices || !response.choices[0]) {
      console.warn("Invalid Groq response structure");
      return res.status(200).json({
        success: true,
        data: [],
        message: "Could not parse fields from response",
      });
    }

    const content = response.choices[0].message?.content;
    if (!content) {
      console.warn("No content in Groq response");
      return res.status(200).json({
        success: true,
        data: [],
        message: "No content received from LLM",
      });
    }

    // Remove markdown code blocks if present
    const cleanedContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.warn("No JSON array found in response:", cleanedContent.substring(0, 200));
      return res.status(200).json({
        success: true,
        data: [],
        message: "No custom fields found",
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      return res.status(200).json({
        success: true,
        data: [],
        message: "Could not parse JSON from response",
      });
    }

    // Ensure parsed is an array
    if (!Array.isArray(parsed)) {
      console.warn("Parsed response is not an array");
      return res.status(200).json({
        success: true,
        data: [],
        message: "Invalid response format",
      });
    }

    const fields = parsed
      .filter(
        (f: any) =>
          f &&
          f.label &&
          f.value !== undefined &&
          f.value !== null &&
          f.fieldType
      );

    res.status(200).json({
      success: true,
      data: fields,
      message: `Extracted ${fields.length} custom field(s)`,
    });
  } catch (error: any) {
    const detail = error.response?.data?.error?.message || error.message || "Unknown error";
    console.error("LLM parsing error:", detail);
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
