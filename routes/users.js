import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { validateBody } from "../middleware/validateBody.js";
import { authenticate } from "../middleware/auth.js";
import { ROLES } from "../utils/constant.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  listUserQuerySchema,
  changePasswordSchema,
  updateProfileSchema,
} from "../validations/user.validation.js";

export default (app) => {
  const router = Router();

  // ── Public routes ──────────────────────────────────────────
  router.post(
    "/register",
    validateBody(registerSchema),
    userController.register,
  );
  router.post("/login", validateBody(loginSchema), userController.login);
  router.post(
    "/forgot-password",
    validateBody(forgotPasswordSchema),
    userController.forgotPassword,
  );
  router.post(
    "/reset-password/:token",
    validateBody(resetPasswordSchema),
    userController.resetPassword,
  );
  
  // ── Protected routes ───────────────────────────────────────
  router.put(
    "/change-password",
    authenticate(),
    validateBody(changePasswordSchema),
    userController.changePassword,
  );
  
  router.get(
    "/profile",
    authenticate(),
    userController.getProfile,
  );

  router.patch(
    "/profile",
    authenticate(),
    validateBody(updateProfileSchema),
    userController.updateProfile,
  );

  router.get(
    "/users",
    authenticate(ROLES.ADMIN),
    validateBody(listUserQuerySchema),
    userController.getAllUsers,
  );

  router.get("/users/:id", userController.getUserById);

  app.use("/", router);
};
