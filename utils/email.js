import nodemailer from "nodemailer";
import {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  FRONTEND_URL,
} from "./constant.js";

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// ── Base mailer ────────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"ShopGrid" <${EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

// ── Reset password email ───────────────────────────────────
export const sendResetPasswordEmail = async ({ email, name, resetToken }) => {
  const resetUrl = `${FRONTEND_URL}/reset-password/${resetToken}`;

  await sendMail({
    to: email,
    subject: "Reset Your ShopGrid Password",
    html: `
      <h2>Hi ${name},</h2>
      <p>You requested a password reset. Click the link below — it expires in <strong>1 hour</strong>.</p>
      <a href="${resetUrl}" style="
        display:inline-block;padding:12px 24px;
        background:#4F46E5;color:#fff;
        border-radius:6px;text-decoration:none;font-weight:bold;
      ">Reset Password</a>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
};
