"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BioDataController = void 0;
const SendSuccess_1 = require("../../../shared/SendSuccess");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const user_info_model_1 = require("../user_info/user_info.model");
const general_info_model_1 = __importDefault(require("../general_info/general_info.model"));
const address_model_1 = __importDefault(require("../address/address.model"));
const educational_qualification_model_1 = __importDefault(require("../educational_qualification/educational_qualification.model"));
const personal_info_model_1 = __importDefault(require("../personal_info/personal_info.model"));
const family_status_model_1 = __importDefault(require("../family_status/family_status.model"));
const occupation_model_1 = __importDefault(require("../occupation/occupation.model"));
const marital_info_model_1 = __importDefault(require("../marital_info/marital_info.model"));
const expected_lifepartner_model_1 = __importDefault(require("../expected_lifepartner/expected_lifepartner.model"));
const ongikar_nama_model_1 = __importDefault(require("../ongikar_nama/ongikar_nama.model"));
const contact_model_1 = __importDefault(require("../contact/contact.model"));
const getBioData = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const bioId = req.params.id;
    const user = yield user_info_model_1.UserInfoModel.findOne({
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
    const generalInfo = yield general_info_model_1.default.findOne({ user: userId }).lean();
    const address = yield address_model_1.default.findOne({ user: userId }).lean();
    const educationQualification = yield educational_qualification_model_1.default.findOne({
        user: userId,
    }).lean();
    const personalInfo = yield personal_info_model_1.default.findOne({
        user: userId,
    }).lean();
    const familyStatus = yield family_status_model_1.default.findOne({
        user: userId,
    }).lean();
    const occupation = yield occupation_model_1.default.findOne({
        user: userId,
    }).lean();
    const maritalInfo = yield marital_info_model_1.default.findOne({
        user: userId,
    }).lean();
    const expectedLifePartner = yield expected_lifepartner_model_1.default.findOne({
        user: userId,
    }).lean();
    const ongikarNama = yield ongikar_nama_model_1.default.findOne({
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
    res.status(200).json((0, SendSuccess_1.sendSuccess)("Retrieve bio data", data, 200));
}));
const getBioDataByAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const bioId = req.params.id;
    const user = yield user_info_model_1.UserInfoModel.findOne({
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
    const generalInfo = yield general_info_model_1.default.findOne({ user: userId }).lean();
    const address = yield address_model_1.default.findOne({ user: userId }).lean();
    const educationQualification = yield educational_qualification_model_1.default.findOne({
        user: userId,
    }).lean();
    const personalInfo = yield personal_info_model_1.default.findOne({
        user: userId,
    }).lean();
    const familyStatus = yield family_status_model_1.default.findOne({
        user: userId,
    }).lean();
    const occupation = yield occupation_model_1.default.findOne({
        user: userId,
    }).lean();
    const maritalInfo = yield marital_info_model_1.default.findOne({
        user: userId,
    }).lean();
    const expectedLifePartner = yield expected_lifepartner_model_1.default.findOne({
        user: userId,
    }).lean();
    const ongikarNama = yield ongikar_nama_model_1.default.findOne({
        user: userId,
    }).lean();
    const contact = yield contact_model_1.default.findOne({
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
        contact,
    };
    res.status(200).json((0, SendSuccess_1.sendSuccess)("Retrieve bio data", data, 200));
}));
const getBioDataStat = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("response data");
    const genderCounts = yield user_info_model_1.UserInfoModel.aggregate([
        {
            $match: { user_status: "active" },
        },
        {
            $lookup: {
                from: "generalinfos",
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
    const total = result["পুরুষ"] + result["মহিলা"];
    res
        .status(200)
        .json((0, SendSuccess_1.sendSuccess)("Retrieve bio data", Object.assign(Object.assign({}, result), { total }), 200));
}));
exports.BioDataController = {
    getBioData,
    getBioDataByAdmin,
    getBioDataStat,
};
