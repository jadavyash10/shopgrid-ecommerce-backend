import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  PASSWORD_RESET_TOKEN_EXPIRES_IN,
} from "./constant.js";

// ── Generate JWT access token ──────────────────────────────
export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// ── Verify JWT token ───────────────────────────────────────
export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// ── Generate raw reset token + its hashed version ─────────
export const generateResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const expireTime = Date.now() + PASSWORD_RESET_TOKEN_EXPIRES_IN;

  return { resetToken, hashedToken, expireTime };
};

// ── Hash any token for DB comparison ──────────────────────
export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// ── Attach token as httpOnly cookie + return in body ──────
export const attachTokenToResponse = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 1 day — matches JWT_EXPIRES_IN
  });
};
