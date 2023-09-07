"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BioDataController = void 0;
const SendSuccess_1 = require("../../../shared/SendSuccess");
const db_1 = __importDefault(require("../../../config/db"));
const getBioData = (req, res) => {
    const bioId = req.params.id;
    let bioData = {};
    db_1.default.beginTransaction((err) => {
        if (err) {
            console.log(err);
            return res
                .status(500)
                .json({ success: false, message: "Internal server error" });
        }
        const sendErrorResponse = (errorMessage) => {
            console.log(errorMessage);
            // Rollback the transaction in case of an error
            db_1.default.rollback(() => {
                console.log("Transaction rolled back.");
                return res
                    .status(500)
                    .json({ success: false, message: "Internal server error" });
            });
        };
        const userInfoSql = "SELECT email,username,phone FROM user_info where id = ? ";
        db_1.default.query(userInfoSql, [bioId], (err, userInfo) => {
            if (err) {
                console.log(err);
                // Rollback the transaction in case of an error
                db_1.default.rollback(() => {
                    console.log("Transaction rolled back.");
                    return res
                        .status(500)
                        .json({ success: false, message: "Internal server error" });
                });
            }
            else {
                bioData = {
                    userInfo: userInfo[0],
                };
                const personalInfoSql = "SELECT * FROM personal_info WHERE user_id = ?";
                db_1.default.query(personalInfoSql, [bioId], (err, personalInfo) => {
                    if (err) {
                        console.log(err);
                        // Rollback the transaction in case of an error
                        db_1.default.rollback(() => {
                            console.log("Transaction rolled back.");
                            return res
                                .status(500)
                                .json({ success: false, message: "Internal server error" });
                        });
                    }
                    else {
                        bioData = Object.assign(Object.assign({}, bioData), { personalInfo: personalInfo[0] });
                        const generalInfoSql = "SELECT * FROM general_info WHERE user_id = ?";
                        db_1.default.query(generalInfoSql, [bioId], (err, generalInfo) => {
                            if (err) {
                                console.log(err);
                                // Rollback the transaction in case of an error
                                db_1.default.rollback(() => {
                                    console.log("Transaction rolled back.");
                                    return res.status(500).json({
                                        success: false,
                                        message: "Internal server error",
                                    });
                                });
                            }
                            else {
                                bioData = Object.assign(Object.assign({}, bioData), { generalInfo: generalInfo[0] });
                                const educationQualificationSql = "SELECT * FROM educational_qualification WHERE user_id = ?";
                                db_1.default.query(educationQualificationSql, [bioId], (err, educationQualification) => {
                                    if (err) {
                                        console.log(err);
                                        // Rollback the transaction in case of an error
                                        db_1.default.rollback(() => {
                                            console.log("Transaction rolled back.");
                                            return res.status(500).json({
                                                success: false,
                                                message: "Internal server error",
                                            });
                                        });
                                    }
                                    else {
                                        bioData = Object.assign(Object.assign({}, bioData), { educationQualification: educationQualification[0] });
                                        const addressSql = "SELECT * FROM address WHERE user_id = ?";
                                        db_1.default.query(addressSql, [bioId], (err, address) => {
                                            if (err) {
                                                console.log(err);
                                                // Rollback the transaction in case of an error
                                                db_1.default.rollback(() => {
                                                    console.log("Transaction rolled back.");
                                                    return res.status(500).json({
                                                        success: false,
                                                        message: "Internal server error",
                                                    });
                                                });
                                            }
                                            else {
                                                bioData = Object.assign(Object.assign({}, bioData), { address: address[0] });
                                                const occupationSql = "SELECT * FROM occupation WHERE user_id = ?";
                                                db_1.default.query(occupationSql, [bioId], (err, occupation) => {
                                                    if (err) {
                                                        console.log(err);
                                                        // Rollback the transaction in case of an error
                                                        db_1.default.rollback(() => {
                                                            console.log("Transaction rolled back.");
                                                            return res.status(500).json({
                                                                success: false,
                                                                message: "Internal server error",
                                                            });
                                                        });
                                                    }
                                                    else {
                                                        bioData = Object.assign(Object.assign({}, bioData), { occupation: occupation[0] });
                                                        const contactSql = "SELECT * FROM contact where user_id = ?";
                                                        db_1.default.query(contactSql, [bioId], (err, contact) => {
                                                            if (err) {
                                                                console.log(err);
                                                                // Rollback the transaction in case of an error
                                                                db_1.default.rollback(() => {
                                                                    console.log("Transaction rolled back.");
                                                                    return res.status(500).json({
                                                                        success: false,
                                                                        message: "Internal server error",
                                                                    });
                                                                });
                                                            }
                                                            else {
                                                                bioData = Object.assign(Object.assign({}, bioData), { contact: contact[0] });
                                                                const expectedLifePartnerSql = "SELECT * FROM expected_lifepartner WHERE user_id =? ";
                                                                db_1.default.query(expectedLifePartnerSql, [bioId], (err, expectedLifePartner) => {
                                                                    if (err) {
                                                                        console.log(err);
                                                                        // Rollback the transaction in case of an error
                                                                        db_1.default.rollback(() => {
                                                                            console.log("Transaction rolled back.");
                                                                            return res
                                                                                .status(500)
                                                                                .json({
                                                                                success: false,
                                                                                message: "Internal server error",
                                                                            });
                                                                        });
                                                                    }
                                                                    else {
                                                                        bioData = Object.assign(Object.assign({}, bioData), { expectedLifePartner: expectedLifePartner[0] });
                                                                        const familyStatusSql = "select * from family_status where user_id = ?";
                                                                        db_1.default.query(familyStatusSql, [bioId], (err, familyStatus) => {
                                                                            if (err) {
                                                                                console.log(err);
                                                                                // Rollback the transaction in case of an error
                                                                                db_1.default.rollback(() => {
                                                                                    console.log("Transaction rolled back.");
                                                                                    return res
                                                                                        .status(500)
                                                                                        .json({
                                                                                        success: false,
                                                                                        message: "Internal server error",
                                                                                    });
                                                                                });
                                                                            }
                                                                            else {
                                                                                bioData = Object.assign(Object.assign({}, bioData), { familyStatus: familyStatus[0] });
                                                                                const maritalInfoSql = "SELECT * FROM marital_info WHERE user_id =?";
                                                                                db_1.default.query(maritalInfoSql, [bioId], (err, maritalInfo) => {
                                                                                    if (err) {
                                                                                        console.log(err);
                                                                                        // Rollback the transaction in case of an error
                                                                                        db_1.default.rollback(() => {
                                                                                            console.log("Transaction rolled back.");
                                                                                            return res
                                                                                                .status(500)
                                                                                                .json({
                                                                                                success: false,
                                                                                                message: "Internal server error",
                                                                                            });
                                                                                        });
                                                                                    }
                                                                                    else {
                                                                                        bioData = Object.assign(Object.assign({}, bioData), { maritalInfo: maritalInfo[0] });
                                                                                        const ongikarNamaSql = "SELECT * FROM ongikar_nama WHERE user_id = ?";
                                                                                        db_1.default.query(ongikarNamaSql, [bioId], (err, ongikarNama) => {
                                                                                            if (err) {
                                                                                                console.log(err);
                                                                                                // Rollback the transaction in case of an error
                                                                                                db_1.default.rollback(() => {
                                                                                                    console.log("Transaction rolled back.");
                                                                                                    return res
                                                                                                        .status(500)
                                                                                                        .json({
                                                                                                        success: false,
                                                                                                        message: "Internal server error",
                                                                                                    });
                                                                                                });
                                                                                            }
                                                                                            else {
                                                                                                bioData = Object.assign(Object.assign({}, bioData), { ongikarNama: ongikarNama[0] });
                                                                                                db_1.default.commit((err) => {
                                                                                                    if (err) {
                                                                                                        console.log(err);
                                                                                                        db_1.default.rollback(() => {
                                                                                                            console.log("Transaction rolled back.");
                                                                                                            return res
                                                                                                                .status(500)
                                                                                                                .json({
                                                                                                                success: false,
                                                                                                                message: "Internal server error",
                                                                                                            });
                                                                                                        });
                                                                                                    }
                                                                                                    else {
                                                                                                        return res
                                                                                                            .status(200)
                                                                                                            .json((0, SendSuccess_1.sendSuccess)("Retrieved bio data successfully", bioData, 200));
                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                });
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });
};
exports.BioDataController = {
    getBioData,
};
