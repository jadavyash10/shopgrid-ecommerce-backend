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

export const sendMail = async ({ to, subject, html }) => {
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

// ── Seller Approval email ──────────────────────────────────
export const sendSellerApprovalEmail = async ({ email, name, password }) => {
  await sendMail({
    to: email,
    subject: "Your Seller Account is Approved!",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Hi ${name},</h2>
        <p>Congratulations! Your seller account on <strong>ShopGrid</strong> has been approved.</p>
        <p>You can now log in using the following credentials:</p>
        <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; border: 1px solid #ddd; display: inline-block;">
          <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0 0 0;"><strong>Password:</strong> <span style="font-family: monospace; font-size: 1.1em; color: #4F46E5; background: #fff; padding: 2px 5px; border-radius: 4px; border: 1px solid #ccc;">${password}</span></p>
        </div>
        <p style="margin-top: 20px;">For security reasons, we recommend that you log in and change your password immediately.</p>
        <a href="${FRONTEND_URL}/login" style="
          display:inline-block;padding:12px 24px;
          background:#4F46E5;color:#fff;
          border-radius:6px;text-decoration:none;font-weight:bold;
          margin-top: 10px;
        ">Login to Your Account</a>
      </div>
    `,
  });
};

// ── Seller Rejection email ─────────────────────────────────
export const sendSellerRejectionEmail = async ({ email, name, reason }) => {
  await sendMail({
    to: email,
    subject: "Update on Your Seller Application",
    html: `
      <h2>Hi ${name},</h2>
      <p>Thank you for your interest in becoming a seller on ShopGrid.</p>
      <p>Unfortunately, your application has been rejected at this time for the following reason:</p>
      <blockquote style="border-left: 4px solid #ccc; padding-left: 10px;">${reason}</blockquote>
      <p>If you have any questions, feel free to reply to this email.</p>
    `,
  });
};

// ── Seller Signup email ──────────────────────────────────
export const sendSellerSignupEmail = async ({ email, name }) => {
  await sendMail({
    to: email,
    subject: "Seller Application Received - ShopGrid",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Welcome to ShopGrid!</h1>
        </div>
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 22px;">Hi ${name},</h2>
          <p style="font-size: 16px; color: #4b5563;">Thank you for your interest in joining the ShopGrid family. We've successfully received your seller application!</p>
          
          <div style="background-color: #f9fafb; border-left: 4px solid #4f46e5; padding: 20px; margin: 25px 0;">
            <p style="margin: 0; font-weight: 600; color: #1f2937;">What's next?</p>
            <p style="margin: 10px 0 0 0; font-size: 15px; color: #4b5563;">Our team is currently reviewing your profile and product samples. This process typically takes <strong>2-3 business days</strong>.</p>
          </div>

          <p style="font-size: 16px; color: #4b5563;">Once reviewed, you will receive another email notifying you of your account status. If approved, you'll get your login credentials and can start listing your products immediately.</p>
          
          <div style="margin-top: 35px; padding-top: 25px; border-top: 1px solid #f3f4f6; text-align: center;">
            <p style="font-size: 14px; color: #9ca3af; margin-bottom: 5px;">Need help or have questions?</p>
            <p style="font-size: 14px; color: #6366f1; margin-top: 0; font-weight: 600;">support@shopgrid.com</p>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} ShopGrid Ecommerce. All rights reserved.</p>
        </div>
      </div>
    `,
  });
};

// ── Admin Created Seller email ──────────────────────────────
export const sendAdminCreatedSellerEmail = async ({ email, name, password }) => {
  await sendMail({
    to: email,
    subject: "Welcome to ShopGrid - Your Seller Account is Ready!",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Account Created!</h1>
        </div>
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 22px;">Hi ${name},</h2>
          <p style="font-size: 16px; color: #4b5563;">An administrator has created a seller account for you on <strong>ShopGrid</strong>. You're all set to start selling!</p>
          
          <div style="background-color: #f9fafb; border: 1px dashed #10b981; padding: 25px; margin: 25px 0; border-radius: 8px; text-align: center;">
            <p style="margin: 0 0 15px 0; font-weight: 600; color: #1f2937; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Login Credentials</p>
            <div style="display: inline-block; text-align: left;">
              <p style="margin: 0; font-size: 15px;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 8px 0 0 0; font-size: 15px;"><strong>Password:</strong> <span style="font-family: monospace; font-size: 1.1em; color: #059669; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">${password}</span></p>
            </div>
          </div>

          <p style="font-size: 16px; color: #4b5563;">Please log in and change your password immediately to ensure your account security.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${FRONTEND_URL}/login" style="
              display:inline-block;padding:14px 30px;
              background:#10b981;color:#fff;
              border-radius:8px;text-decoration:none;font-weight:bold;
              font-size: 16px;
            ">Go to Seller Dashboard</a>
          </div>

          <div style="margin-top: 35px; padding-top: 25px; border-top: 1px solid #f3f4f6; text-align: center;">
            <p style="font-size: 14px; color: #9ca3af; margin-bottom: 5px;">Need assistance?</p>
            <p style="font-size: 14px; color: #059669; margin-top: 0; font-weight: 600;">admin-support@shopgrid.com</p>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} ShopGrid Ecommerce. All rights reserved.</p>
        </div>
      </div>
    `,
  });
};
