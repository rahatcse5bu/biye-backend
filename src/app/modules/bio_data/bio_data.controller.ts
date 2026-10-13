import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import GeneralInfo from "../general_info/general_info.model";
import Address from "../address/address.model";
import EducationalQualification from "../educational_qualification/educational_qualification.model";
import PersonalInfo from "../personal_info/personal_info.model";
import FamilyStatus from "../family_status/family_status.model";
import Occupation from "../occupation/occupation.model";
import MaritalInfo from "../marital_info/marital_info.model";
import ExpectedPartner from "../expected_lifepartner/expected_lifepartner.model";
import OngikarNama from "../ongikar_nama/ongikar_nama.model";
import Contact from "../contact/contact.model";
import Achievement from "../achievement/achievement.model";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import { BiodataRevisionService } from "../biodata_revision/biodata_revision.service";

// TODO: optional login; returns the verified token payload, or null for visitors and bad tokens.
const optionalViewer = (req: Request): any => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  try {
    return jwtHelpers.verifyToken(header.slice(7), config.jwt_secret as string);
  } catch {
    return null;
  }
};

const getBioData = catchAsync(async (req: Request, res: Response) => {
  const bioId = req.params.id;
  const user: any = await UserInfoModel.findOne({
    user_id: bioId,
  }).lean();

  if (!user) {
    return res.status(404).json({
      message: "User not found",
      success: false,
    });
  }

  if (user && ["banned", "inactive"].includes(user.user_status)) {
    return res.status(404).json({
      message: "User not found",
      success: false,
    });
  }

  // TODO: unapproved biodatas are visible only to their owner (preview) and admins; development also lists "in review".
  const unpublished =
    user.user_status === "pending" ||
    (user.user_status === "in review" && config.node_env !== "development");
  if (unpublished) {
    const viewer = optionalViewer(req);
    const canView =
      viewer?.user_role === "admin" || String(viewer?._id) === String(user._id);
    if (!canView) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
  }

  const userId = user._id;
  // TODO: one parallel round trip instead of ten sequential ones (each is a full DB round trip from Vercel).
  const [
    generalInfoRaw,
    address,
    educationQualification,
    personalInfo,
    familyStatus,
    occupation,
    maritalInfo,
    expectedLifePartner,
    ongikarNama,
    achievement,
  ] = await Promise.all([
    GeneralInfo.findOne({ user: userId }).lean(),
    Address.findOne({ user: userId }).lean(),
    EducationalQualification.findOne({ user: userId }).lean(),
    // TODO: phone/email are paid contact data; the public profile must never return them.
    PersonalInfo.findOne({ user: userId }).select("-my_phone -my_email").lean(),
    FamilyStatus.findOne({ user: userId }).lean(),
    Occupation.findOne({ user: userId }).lean(),
    MaritalInfo.findOne({ user: userId }).lean(),
    ExpectedPartner.findOne({ user: userId }).lean(),
    OngikarNama.findOne({ user: userId }).lean(),
    Achievement.findOne({ user: userId }).lean(),
  ]);

  // Public view: always show the last approved snapshot, never expose pending_changes
  let generalInfo: any = generalInfoRaw;
  if (generalInfoRaw) {
    const { approved_data, pending_changes, admin_note, ...rest } = generalInfoRaw as any;
    // TODO: owner-only flag for the "awaiting review" banner; visitors never learn a change is pending.
    const viewer = optionalViewer(req);
    const ownerHasPendingRevision =
      String(viewer?._id) === String(user._id) &&
      (await BiodataRevisionService.hasOpenRevision(user._id, ["pending"]));
    const hasPendingChanges =
      ownerHasPendingRevision || !!(pending_changes && typeof pending_changes === 'object');

    if (approved_data && typeof approved_data === 'object') {
      // Use approved_data as the canonical public view regardless of biodata_status
      generalInfo = {
        ...rest,
        ...approved_data,
        biodata_status: rest.biodata_status,
        has_pending_changes: hasPendingChanges,
      };
    } else {
      // No approved snapshot yet (new profile) — show raw fields
      generalInfo = {
        ...rest,
        biodata_status: rest.biodata_status,
        has_pending_changes: hasPendingChanges,
      };
    }

    if (!generalInfo.religion) {
      generalInfo.religion = 'islam';
    }
  }

  let data = {
    generalInfo,
    address,
    educationQualification,
    personalInfo,
    familyStatus,
    occupation,
    maritalInfo,
    expectedLifePartner,
    ongikarNama,
    achievement,
  };

  res.status(200).json(sendSuccess("Retrieve bio data", data, 200));
});
const getBioDataByAdmin = catchAsync(async (req: Request, res: Response) => {
  const bioId = req.params.id;
  const user: any = await UserInfoModel.findOne({
    user_id: bioId,
  }).lean();

  if (!user) {
    return res.status(404).json({
      message: "User not found",
      success: false,
    });
  }

  // console.log(user);

  const userId = user._id;
  // TODO: same parallel lookup as the public handler, plus contact for the admin.
  const [
    generalInfoRaw,
    address,
    educationQualification,
    personalInfo,
    familyStatus,
    occupation,
    maritalInfo,
    expectedLifePartner,
    ongikarNama,
    contact,
    achievement,
  ] = await Promise.all([
    GeneralInfo.findOne({ user: userId }).lean(),
    Address.findOne({ user: userId }).lean(),
    EducationalQualification.findOne({ user: userId }).lean(),
    PersonalInfo.findOne({ user: userId }).lean(),
    FamilyStatus.findOne({ user: userId }).lean(),
    Occupation.findOne({ user: userId }).lean(),
    MaritalInfo.findOne({ user: userId }).lean(),
    ExpectedPartner.findOne({ user: userId }).lean(),
    OngikarNama.findOne({ user: userId }).lean(),
    Contact.findOne({ user: userId }).lean(),
    Achievement.findOne({ user: userId }).lean(),
  ]);
  
  // Admin view: merge pending_changes so admin sees the latest user edits for review
  let generalInfo: any = generalInfoRaw;
  if (generalInfoRaw && (generalInfoRaw as any).pending_changes && typeof (generalInfoRaw as any).pending_changes === 'object') {
    const { pending_changes, ...rest } = generalInfoRaw as any;
    generalInfo = { ...rest, ...pending_changes, pending_changes, approved_data: (generalInfoRaw as any).approved_data };
  }
  // Ensure religion defaults to 'islam' if not set
  if (generalInfo && !generalInfo.religion) {
    generalInfo.religion = 'islam';
  }

  let data = {
    generalInfo,
    address,
    educationQualification,
    personalInfo,
    familyStatus,
    occupation,
    maritalInfo,
    expectedLifePartner,
    ongikarNama,
    contact,
    achievement,
  };

  res.status(200).json(sendSuccess("Retrieve bio data", data, 200));
});
const getBioDataStat = catchAsync(async (req: Request, res: Response) => {
  console.log("response data");
  const genderCounts = await UserInfoModel.aggregate([
    {
      $match: { user_status: "active" },
    },
    {
      $lookup: {
        from: "generalinfos", // MongoDB will pluralize the model name unless specified
        localField: "_id",
        foreignField: "user",
        as: "generalInfo",
      },
    },
    {
      $unwind: "$generalInfo",
    },
    {
      $group: {
        _id: "$generalInfo.gender",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = genderCounts.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  const total = (result["পুরুষ"] ?? 0) + (result["মহিলা"] ?? 0);

  res
    .status(200)
    .json(sendSuccess("Retrieve bio data", { ...result, total }, 200));
});

export const BioDataController = {
  getBioData,
  getBioDataByAdmin,
  getBioDataStat,
};
