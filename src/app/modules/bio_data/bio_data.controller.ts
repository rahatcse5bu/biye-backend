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

  // console.log(user);

  const userId = user._id;
  const generalInfo = await GeneralInfo.findOne({ user: userId }).lean();
  const address = await Address.findOne({ user: userId }).lean();
  const educationQualification = await EducationalQualification.findOne({
    user: userId,
  }).lean();
  const personalInfo = await PersonalInfo.findOne({
    user: userId,
  }).lean();
  const familyStatus = await FamilyStatus.findOne({
    user: userId,
  }).lean();
  const occupation = await Occupation.findOne({
    user: userId,
  }).lean();
  const maritalInfo = await MaritalInfo.findOne({
    user: userId,
  }).lean();
  const expectedLifePartner = await ExpectedPartner.findOne({
    user: userId,
  }).lean();
  const ongikarNama = await OngikarNama.findOne({
    user: userId,
  }).lean();
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
  };

  res.status(200).json(sendSuccess("Retrieve bio data", data, 200));
});

export const BioDataController = {
  getBioData,
};
