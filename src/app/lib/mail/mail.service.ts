import ejs from "ejs";
import status from "http-status";
import nodemailer from "nodemailer";
import path from "path";
import { envVars } from "../../config/env";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";
import { SendEmailOptions } from "./mail.types";

const transporter = nodemailer.createTransport({
  host: envVars.SMTP.HOST,
  secure: true,
  auth: {
    user: envVars.SMTP.USER,
    pass: envVars.SMTP.PASSWORD,
  },
  port: Number(envVars.SMTP.PORT),
});

const sendEmail = async ({ subject, templateData, templateName, to, attachments }: SendEmailOptions) => {
  try {
    const templatePath = path.resolve(process.cwd(), `src/app/templates/${templateName}.ejs`);

    const html = await ejs.renderFile(templatePath, templateData);

    const info = await transporter.sendMail({
      from: envVars.SMTP.FROM,
      to,
      subject,
      html,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });

    logger.info(`Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    logger.error("Email sending failed", error);
    throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to send email");
  }
};

export const mailService = {
  sendEmail,
};
