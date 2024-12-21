import { NextFunction, Request, Response } from "express";
import admin from "firebase-admin";
import path from "path";

// Path to your service account key file
const serviceAccount = path.resolve(
  __dirname,
  "../../../config/serviceAccountKey.json"
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const verifyIdToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).send({
      success: false,
      message: "Unauthorized",
    });
  }

  const token = authorizationHeader.split(" ")[1];

  console.log("token~~",token);

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).send({
      success: false,
      message: "Unauthorized",
      error: error,
    });
    // throw new ApiError(401, "Unauthorized");
  }
};
