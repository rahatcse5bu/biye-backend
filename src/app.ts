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
const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.get("/", async (req: Request, res: Response) => {
  res.send("hello world!");
});

app.use("/api/v1/user-info", userRouter);
app.use("/api/v1/personal-info", personalInfoRouter);
app.use("/api/v1/ongikar-nama", ongikarNamaRouter);
app.use("/api/v1/occupation", OccupationRouter);
app.use("/api/v1/marital-info", MaritalInfoRouter);
app.use("/api/v1/general-info", GeneralInfoRouter);
app.use("/api/v1/family-status", FamilyStatusRouter);
app.use("/api/v1/expected-life-partner", ExpectedLifePartnerRouter);
app.use(GlobalErrorHandler);

export default app;
