import express, { Request, Response } from "express";
import morgan from "morgan";
import userRouter from "./app/modules/user_info/user_info.route";
const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.get("/", async (req: Request, res: Response) => {
	res.send("hello world!");
});

app.use("/api/v1/user-info", userRouter);

export default app;
