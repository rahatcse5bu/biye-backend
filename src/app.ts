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
// import BioChoiceDataRouter from "./app/modules/bio_choice_data/bio_choice_data.route";
import AddressRouter from "./app/modules/address/address.route";
import ContactRouter from "./app/modules/contact/contact.route";
import PaymentsRouter from "./app/modules/payments/payments.route";
import FavouritesRouter from "./app/modules/favourites/favourites.route";
import BioDataRouter from "./app/modules/bio_data/bio_data.route";
// import RefundsRouter from "./app/modules/refunds/refunds.route";
// @ts-ignore
import cors from "cors";
import config from "./config";
import bkashRouter from "./app/modules/bkash/bkash.route";
import UnFavouritesRouter from "./app/modules/unfavorites/unfavorites.route";
// import UnFavoritesRouter from "./app/modules/unfavorites/unfavorites.route";
// import ContactPurchaseDataRouter from "./app/modules/contact_purchase_data/contact_purchase_data.route";

const app = express();

app.use(express.json());
app.use(morgan("dev"));
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

app.use(
  cors({
    origin: "*",
  })
);

app.get("/", async (req: Request, res: Response) => {
  res.send("server is running!");
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
// app.use("/api/v1/bio-choice-data", BioChoiceDataRouter);
app.use("/api/v1/address", AddressRouter);
app.use("/api/v1/contact", ContactRouter);
app.use("/api/v1/favorites", FavouritesRouter);
app.use("/api/v1/un-favorites", UnFavouritesRouter);
app.use("/api/v1/payments", PaymentsRouter);
app.use("/api/v1/bio-data", BioDataRouter);
app.use("/api/v1/bkash", bkashRouter);
// app.use("/api/v1/refund", RefundsRouter);
// app.use("/api/v1/contact-purchase-data", ContactPurchaseDataRouter);
app.use(GlobalErrorHandler);

export default app;
