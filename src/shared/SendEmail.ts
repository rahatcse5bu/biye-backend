import nodemailer from "nodemailer";
import dotenv from "dotenv";
import config from "../config";

dotenv.config();

// Define the transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service
  auth: {
    user: config.email_user,
    pass: config.email_pass,
  },
});

// Define the sendEmail function
const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  const mailOptions = {
    from: config.email_user,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
export const sendEmails = async (
  recipients: string[],
  subject: string,
  html: string
): Promise<void> => {
  const mailOptions = {
    from: config.email_user,
    subject,
    html,
  };

  for (const recipient of recipients) {
    try {
      await transporter.sendMail({ ...mailOptions, to: recipient });
      // console.log(`Email sent to ${recipient}`);
    } catch (error) {
      console.error(`Failed to send email to ${recipient}:`, error);
    }
  }

  // try {
  //   await transporter.sendMail(mailOptions);
  //   console.log("Email sent");
  // } catch (error) {
  //   console.error("Error sending email:", error);
  // }
};

export default sendEmail;
