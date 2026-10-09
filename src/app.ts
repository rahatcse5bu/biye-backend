import express, { Request, Response } from "express";
import morgan from "morgan";
import userRouter from "./app/modules/user_info/user_info.route";
import GlobalErrorHandler from "./app/middlewares/globalErrorHandler";
import personalInfoRouter from "./app/modules/personal_info/personal_info.route";
import ongikarNamaRouter from "./app/modules/ongikar_nama/ongikar_nama.route";
import OccupationRouter from "./app/modules/occupation/occupation.route";
import MaritalInfoRouter from "./app/modules/marital_info/marital_info.route";
import GeneralInfoRouter from "./app/modules/general_info/general_info.route";
import FamilyStatusRouter from "./app/modules/family_status/family_status.route";
import ExpectedLifePartnerRouter from "./app/modules/expected_lifepartner/expected_lifepartner.route";
import EducationalQualificationRouter from "./app/modules/educational_qualification/educational_qualification.route";
import BioChoiceDataRouter from "./app/modules/bio_choice_data/bio_choice_data.route";
import BioQuestionRouter from "./app/modules/bio_questions/bio_questions.route";
import AddressRouter from "./app/modules/address/address.route";
import ContactRouter from "./app/modules/contact/contact.route";
import PaymentsRouter from "./app/modules/payments/payments.route";
import FavouritesRouter from "./app/modules/favourites/favourites.route";
import BioDataRouter from "./app/modules/bio_data/bio_data.route";
import { ReactionRoutes } from "./app/modules/reactions/reactions.route";
// import RefundsRouter from "./app/modules/refunds/refunds.route";
// @ts-ignore
import cors from "cors";
import config from "./config";
import { connectMongo } from "./config/mongo";
import bkashRouter from "./app/modules/bkash/bkash.route";
import UnFavouritesRouter from "./app/modules/unfavorites/unfavorites.route";
import ContactPurchaseDataRouter from "./app/modules/contact_purchase_data/contact_purchase_data.route";
import AdminRouter from "./app/modules/admin/admin.route";
import ShortlistRouter from "./app/modules/shortlist/shortlist.route";
import AchievementRouter from "./app/modules/achievement/achievement.route";
import LlmRouter from "./app/modules/llm/llm.route";
import UnverifiedBiodataRouter from "./app/modules/unverified_biodata/unverified_biodata.route";
import UnverifiedContactPurchaseRouter from "./app/modules/unverified_contact_purchase/unverified_contact_purchase.route";
import UnverifiedShortlistRouter from "./app/modules/unverified_shortlist/unverified_shortlist.route";
import AiBiodataRouter from "./app/modules/ai_biodata/ai_biodata.route";
import PhotocardRouter from "./app/modules/photocard/photocard.route";
import { PhotocardTemplateRoutes } from "./app/modules/photocard_template/photocard_template.route";
import UploadRouter from "./app/modules/upload/upload.route";
import NotificationRouter from "./app/modules/notifications/notification.route";
import PointsPackageRouter from "./app/modules/points_package/points_package.route";
import RefundRequestRouter from "./app/modules/refund_request/refund_request.route";
import EmailSettingsRouter from "./app/modules/email_settings/email_settings.route";
import AccountRouter from "./app/modules/account/account.route";
// import UnFavoritesRouter from "./app/modules/unfavorites/unfavorites.route";
// import ContactPurchaseDataRouter from "./app/modules/contact_purchase_data/contact_purchase_data.route";

const app = express();

app.use(express.json());

if (config.node_env === "development") {
  app.use(morgan("dev"));
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
  ...(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),
];
if (config.node_env === "development") {
  allowedOrigins.push(
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
  );
}

app.use(
  cors({
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
  }),
);

app.get("/", async (req: Request, res: Response) => {
  res.send("server is running!");
});


app.use(async (req, res, next) => {
  try {
    await connectMongo();
    next();
  } catch (error) {
    console.error("Database connection unavailable:", error);
    res.status(503).json({
      message: "Database temporarily unavailable",
      success: false,
    });
  }
});


app.use("/api/v1/user-info", userRouter);
app.use("/api/v1/personal-info", personalInfoRouter);
app.use("/api/v1/ongikar-nama", ongikarNamaRouter);
app.use("/api/v1/occupation", OccupationRouter);
app.use("/api/v1/marital-info", MaritalInfoRouter);
app.use("/api/v1/general-info", GeneralInfoRouter);
app.use("/api/v1/family-status", FamilyStatusRouter);
app.use("/api/v1/expected-life-partner", ExpectedLifePartnerRouter);
app.use("/api/v1/educational-qualification", EducationalQualificationRouter);
app.use("/api/v1/bio-choice-data", BioChoiceDataRouter);
app.use("/api/v1/bio-questions", BioQuestionRouter);
app.use("/api/v1/address", AddressRouter);
app.use("/api/v1/contact", ContactRouter);
app.use("/api/v1/favorites", FavouritesRouter);
app.use("/api/v1/un-favorites", UnFavouritesRouter);
app.use("/api/v1/reactions", ReactionRoutes);
app.use("/api/v1/payments", PaymentsRouter);
app.use("/api/v1/bio-data", BioDataRouter);
app.use("/api/v1/bkash", bkashRouter);
// app.use("/api/v1/refund", RefundsRouter);
app.use("/api/v1/contact-purchase-data", ContactPurchaseDataRouter);
app.use("/api/v1/shortlist", ShortlistRouter);
app.use("/api/v1/unverified-shortlist", UnverifiedShortlistRouter);
app.use("/api/v1/achievement", AchievementRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/v1/llm", LlmRouter);
app.use("/api/v1/ai-biodata", AiBiodataRouter);
app.use("/api/v1/photocard", PhotocardRouter);
app.use("/api/v1/photocard-templates", PhotocardTemplateRoutes);
app.use("/api/v1/uploads", UploadRouter);
app.use("/api/v1/notifications", NotificationRouter);
app.use("/api/v1/points-packages", PointsPackageRouter);
app.use("/api/v1/refund-requests", RefundRequestRouter);
app.use("/api/v1/email-settings", EmailSettingsRouter);
app.use("/api/v1/account", AccountRouter);
app.use("/api/v1/unverified-biodatas", UnverifiedBiodataRouter);
app.use("/api/v1/unverified-contact-purchase", UnverifiedContactPurchaseRouter);
app.use(GlobalErrorHandler);

export default app;
