import express, { Router } from "express";
import * as authController from "../controllers/user.controller.js";
import { validateBody } from "../middleware/validateBody.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validations/user.validation.js";

export default (app) => {
  const router = Router();

  // ── Public routes ──────────────────────────────────────────
  router.post(
    "/register",
    validateBody(registerSchema),
    authController.register,
  );
  router.post("/login", validateBody(loginSchema), authController.login);
  router.post(
    "/forgot-password",
    validateBody(forgotPasswordSchema),
    authController.forgotPassword,
  );
  router.post(
    "/reset-password/:token",
    validateBody(resetPasswordSchema),
    authController.resetPassword,
  );

  app.use("/", router);
};
