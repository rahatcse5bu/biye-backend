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
// TODO: pulls in the req.user augmentation for any entry Vercel type-checks from (api/index.ts, src/server.ts, src/app.ts).
/// <reference path="./interfaces/index.d.ts" />
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
const bio_choice_data_route_1 = __importDefault(require("./app/modules/bio_choice_data/bio_choice_data.route"));
const bio_questions_route_1 = __importDefault(require("./app/modules/bio_questions/bio_questions.route"));
const address_route_1 = __importDefault(require("./app/modules/address/address.route"));
const contact_route_1 = __importDefault(require("./app/modules/contact/contact.route"));
const payments_route_1 = __importDefault(require("./app/modules/payments/payments.route"));
const favourites_route_1 = __importDefault(require("./app/modules/favourites/favourites.route"));
const bio_data_route_1 = __importDefault(require("./app/modules/bio_data/bio_data.route"));
const reactions_route_1 = require("./app/modules/reactions/reactions.route");
// import RefundsRouter from "./app/modules/refunds/refunds.route";
// @ts-ignore
const cors_1 = __importDefault(require("cors"));
const config_1 = __importDefault(require("./config"));
const mongo_1 = require("./config/mongo");
const bkash_route_1 = __importDefault(require("./app/modules/bkash/bkash.route"));
const unfavorites_route_1 = __importDefault(require("./app/modules/unfavorites/unfavorites.route"));
const contact_purchase_data_route_1 = __importDefault(require("./app/modules/contact_purchase_data/contact_purchase_data.route"));
const admin_route_1 = __importDefault(require("./app/modules/admin/admin.route"));
const shortlist_route_1 = __importDefault(require("./app/modules/shortlist/shortlist.route"));
const achievement_route_1 = __importDefault(require("./app/modules/achievement/achievement.route"));
const llm_route_1 = __importDefault(require("./app/modules/llm/llm.route"));
const unverified_biodata_route_1 = __importDefault(require("./app/modules/unverified_biodata/unverified_biodata.route"));
const unverified_contact_purchase_route_1 = __importDefault(require("./app/modules/unverified_contact_purchase/unverified_contact_purchase.route"));
const unverified_shortlist_route_1 = __importDefault(require("./app/modules/unverified_shortlist/unverified_shortlist.route"));
const ai_biodata_route_1 = __importDefault(require("./app/modules/ai_biodata/ai_biodata.route"));
const photocard_route_1 = __importDefault(require("./app/modules/photocard/photocard.route"));
const photocard_template_route_1 = require("./app/modules/photocard_template/photocard_template.route");
const upload_route_1 = __importDefault(require("./app/modules/upload/upload.route"));
const notification_route_1 = __importDefault(require("./app/modules/notifications/notification.route"));
const points_package_route_1 = __importDefault(require("./app/modules/points_package/points_package.route"));
const refund_request_route_1 = __importDefault(require("./app/modules/refund_request/refund_request.route"));
const featured_request_route_1 = __importDefault(require("./app/modules/featured_request/featured_request.route"));
const email_settings_route_1 = __importDefault(require("./app/modules/email_settings/email_settings.route"));
const account_route_1 = __importDefault(require("./app/modules/account/account.route"));
const contact_message_route_1 = __importDefault(require("./app/modules/contact_message/contact_message.route"));
const biodata_revision_route_1 = __importDefault(require("./app/modules/biodata_revision/biodata_revision.route"));
const blog_route_1 = __importDefault(require("./app/modules/blog/blog.route"));
const biodata_revision_gate_1 = require("./app/modules/biodata_revision/biodata_revision.gate");
const sanitizeInput_1 = require("./app/middlewares/sanitizeInput");
// import UnFavoritesRouter from "./app/modules/unfavorites/unfavorites.route";
// import ContactPurchaseDataRouter from "./app/modules/contact_purchase_data/contact_purchase_data.route";
const app = (0, express_1.default)();
app.disable("x-powered-by");
// TODO: only trust forwarded IPs behind Vercel's sanitizing proxy.
app.set("trust proxy", process.env.VERCEL === "1" ? 1 : false);
app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
    next();
});
// TODO: photocard SVGs can embed images, so their route gets a larger body limit than the 100kb default.
app.use("/api/v1/photocard-templates", express_1.default.json({ limit: "2mb" }));
// TODO: long Bangla blog posts as HTML exceed the 100kb default.
app.use("/api/v1/blogs", express_1.default.json({ limit: "1mb" }));
app.use(express_1.default.json());
app.use(sanitizeInput_1.sanitizeInput);
if (config_1.default.node_env === "development") {
    app.use((0, morgan_1.default)("dev"));
}
// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "https://mclabbu.xyz/",
//       "http://mclabbu.xyz/",
//     ],
//   })
// );
// TODO: more origins (e.g. a custom admin domain) can be added via CORS_ORIGINS, comma-separated.
const allowedOrigins = [
    "https://www.bibaho.org",
    "https://bibaho.org",
    "https://biye-admin-three.vercel.app",
    "https://bibaho-admin.vercel.app",
    ...(process.env.CORS_ORIGINS || "")
        .split(",")
        .map((origin) => origin.trim().replace(/\/+$/, ""))
        .filter(Boolean),
];
if (config_1.default.node_env === "development") {
    allowedOrigins.push("http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001");
}
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("server is running!");
}));
app.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, mongo_1.connectMongo)();
        next();
    }
    catch (error) {
        console.error("Database connection unavailable:", error);
        res.status(503).json({
            message: "Database temporarily unavailable",
            success: false,
        });
    }
}));
app.use([
    "/api/v1/personal-info",
    "/api/v1/ongikar-nama",
    "/api/v1/occupation",
    "/api/v1/marital-info",
    "/api/v1/general-info",
    "/api/v1/family-status",
    "/api/v1/expected-life-partner",
    "/api/v1/educational-qualification",
    "/api/v1/address",
    "/api/v1/contact",
    "/api/v1/achievement",
    "/api/v1/bio-questions",
], sanitizeInput_1.stripOwnerFields);
// TODO: must run before the section routers so saves to a published biodata are staged for review.
app.use(biodata_revision_gate_1.biodataReviewGate);
app.use("/api/v1/user-info", user_info_route_1.default);
app.use("/api/v1/personal-info", personal_info_route_1.default);
app.use("/api/v1/ongikar-nama", ongikar_nama_route_1.default);
app.use("/api/v1/occupation", occupation_route_1.default);
app.use("/api/v1/marital-info", marital_info_route_1.default);
app.use("/api/v1/general-info", general_info_route_1.default);
app.use("/api/v1/family-status", family_status_route_1.default);
app.use("/api/v1/expected-life-partner", expected_lifepartner_route_1.default);
app.use("/api/v1/educational-qualification", educational_qualification_route_1.default);
app.use("/api/v1/bio-choice-data", bio_choice_data_route_1.default);
app.use("/api/v1/bio-questions", bio_questions_route_1.default);
app.use("/api/v1/address", address_route_1.default);
app.use("/api/v1/contact", contact_route_1.default);
app.use("/api/v1/favorites", favourites_route_1.default);
app.use("/api/v1/un-favorites", unfavorites_route_1.default);
app.use("/api/v1/reactions", reactions_route_1.ReactionRoutes);
app.use("/api/v1/payments", payments_route_1.default);
app.use("/api/v1/bio-data", bio_data_route_1.default);
app.use("/api/v1/bkash", bkash_route_1.default);
// app.use("/api/v1/refund", RefundsRouter);
app.use("/api/v1/contact-purchase-data", contact_purchase_data_route_1.default);
app.use("/api/v1/shortlist", shortlist_route_1.default);
app.use("/api/v1/unverified-shortlist", unverified_shortlist_route_1.default);
app.use("/api/v1/achievement", achievement_route_1.default);
app.use("/api/admin", admin_route_1.default);
app.use("/api/v1/llm", llm_route_1.default);
app.use("/api/v1/ai-biodata", ai_biodata_route_1.default);
app.use("/api/v1/photocard", photocard_route_1.default);
app.use("/api/v1/photocard-templates", photocard_template_route_1.PhotocardTemplateRoutes);
app.use("/api/v1/uploads", upload_route_1.default);
app.use("/api/v1/notifications", notification_route_1.default);
app.use("/api/v1/points-packages", points_package_route_1.default);
app.use("/api/v1/refund-requests", refund_request_route_1.default);
app.use("/api/v1/featured-requests", featured_request_route_1.default);
app.use("/api/v1/email-settings", email_settings_route_1.default);
app.use("/api/v1/account", account_route_1.default);
app.use("/api/v1/contact-messages", contact_message_route_1.default);
app.use("/api/v1/biodata-revisions", biodata_revision_route_1.default);
app.use("/api/v1/blogs", blog_route_1.default);
app.use("/api/v1/unverified-biodatas", unverified_biodata_route_1.default);
app.use("/api/v1/unverified-contact-purchase", unverified_contact_purchase_route_1.default);
app.use(globalErrorHandler_1.default);
exports.default = app;
