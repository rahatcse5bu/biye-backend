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
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const user_info_route_1 = __importDefault(require("./app/modules/user_info/user_info.route"));
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const personal_info_route_1 = __importDefault(require("./app/modules/personal_info/personal_info.route"));
const ongikar_nama_route_1 = __importDefault(require("./app/modules/ongikar_nama/ongikar_nama.route"));
const occupation_route_1 = __importDefault(require("./app/modules/occupation/occupation.route"));
const marital_info_route_1 = __importDefault(require("./app/modules/marital_info/marital_info.route"));
const general_info_route_1 = __importDefault(require("./app/modules/general_info/general_info.route"));
const family_status_route_1 = __importDefault(require("./app/modules/family_status/family_status.route"));
const expected_lifepartner_route_1 = __importDefault(require("./app/modules/expected_lifepartner/expected_lifepartner.route"));
const educational_qualification_route_1 = __importDefault(require("./app/modules/educational_qualification/educational_qualification.route"));
// import BioChoiceDataRouter from "./app/modules/bio_choice_data/bio_choice_data.route";
const address_route_1 = __importDefault(require("./app/modules/address/address.route"));
const contact_route_1 = __importDefault(require("./app/modules/contact/contact.route"));
const payments_route_1 = __importDefault(require("./app/modules/payments/payments.route"));
const favourites_route_1 = __importDefault(require("./app/modules/favourites/favourites.route"));
const bio_data_route_1 = __importDefault(require("./app/modules/bio_data/bio_data.route"));
// import RefundsRouter from "./app/modules/refunds/refunds.route";
// @ts-ignore
const cors_1 = __importDefault(require("cors"));
const bkash_route_1 = __importDefault(require("./app/modules/bkash/bkash.route"));
const unfavorites_route_1 = __importDefault(require("./app/modules/unfavorites/unfavorites.route"));
// import UnFavoritesRouter from "./app/modules/unfavorites/unfavorites.route";
// import ContactPurchaseDataRouter from "./app/modules/contact_purchase_data/contact_purchase_data.route";
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "https://mclabbu.xyz/",
//       "http://mclabbu.xyz/",
//     ],
//   })
// );
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});
app.use((0, cors_1.default)({
    origin: "*",
}));
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("server is running!");
}));
app.use("/api/v1/user-info", user_info_route_1.default);
app.use("/api/v1/personal-info", personal_info_route_1.default);
app.use("/api/v1/ongikar-nama", ongikar_nama_route_1.default);
app.use("/api/v1/occupation", occupation_route_1.default);
app.use("/api/v1/marital-info", marital_info_route_1.default);
app.use("/api/v1/general-info", general_info_route_1.default);
app.use("/api/v1/family-status", family_status_route_1.default);
app.use("/api/v1/expected-life-partner", expected_lifepartner_route_1.default);
app.use("/api/v1/educational-qualification", educational_qualification_route_1.default);
// app.use("/api/v1/bio-choice-data", BioChoiceDataRouter);
app.use("/api/v1/address", address_route_1.default);
app.use("/api/v1/contact", contact_route_1.default);
app.use("/api/v1/favorites", favourites_route_1.default);
app.use("/api/v1/un-favorites", unfavorites_route_1.default);
app.use("/api/v1/payments", payments_route_1.default);
app.use("/api/v1/bio-data", bio_data_route_1.default);
app.use("/api/v1/bkash", bkash_route_1.default);
// app.use("/api/v1/refund", RefundsRouter);
// app.use("/api/v1/contact-purchase-data", ContactPurchaseDataRouter);
app.use(globalErrorHandler_1.default);
exports.default = app;
