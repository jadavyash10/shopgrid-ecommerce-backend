import express, { Router } from "express";
import * as sellerController from "../controllers/seller.controller.js";
import { upload } from "../middleware/upload.js";
import { validateBody } from "../middleware/validateBody.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { ROLES } from "../utils/constant.js";
import {
  signupSchema,
  updateStatusSchema,
  listQuerySchema,
  updateSellerSchema,
} from "../validations/seller.validation.js";

export default (app) => {
  const router = Router();

  // ── Public route for seller signup ──────────────────────────
  // Expected to receive multipart/form-data with 'sampleProductImages' field containing multiple files
  router.post(
    "/signup",
    upload.array("sampleProductImages", 10), // allow up to 10 images
    optionalAuthenticate,
    validateBody(signupSchema),
    sellerController.signup,
  );

  // ── Protected routes (Seller & Admin) ───────────────────────
  router.get(
    "/:id",
    authenticate(),
    sellerController.getSellerById,
  );

  router.patch(
    "/:id",
    authenticate(), // both admin and seller can access; controller handles permission
    upload.array("sampleProductImages", 10),
    validateBody(updateSellerSchema),
    sellerController.updateSeller,
  );

  // ── Admin only routes ───────────────────────────────────────
  router.use(authenticate(ROLES.ADMIN));

  router.get(
    "/",
    validateBody(listQuerySchema), // query validation
    sellerController.getAllSellers,
  );

  router.patch(
    "/:id/status",
    validateBody(updateStatusSchema),
    sellerController.updateSellerStatus
  );

  app.use("/sellers", router);
};
