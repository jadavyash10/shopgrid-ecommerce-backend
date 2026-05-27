import { Router } from "express";
import * as reviewController from "../controllers/review.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { validateBody } from "../middleware/validateBody.js";
import { ROLES } from "../utils/constant.js";
import {
  createCustomerReviewSchema,
  createAdminReviewSchema,
  updateReviewStatusSchema,
  updateReviewContentSchema,
  queryReviewsSchema,
} from "../validations/review.validation.js";

export default (app) => {
  const router = Router();

  // ── Public Routes ──────────────────────────────────────────
  // Verify booking review eligibility and get details for booking link review page
  router.get("/booking/:bookingId", reviewController.getReviewBookingInfo);

  // Get approved reviews publicly for a specific product
  router.get("/product/:productSlugOrId", reviewController.getProductReviews);

  // Create review from customer booking link (supports guest checkout users as well as logged in users)
  router.post(
    "/",
    optionalAuthenticate,
    validateBody(createCustomerReviewSchema),
    reviewController.createCustomerReview
  );

  // ── Protected Admin / Seller Routes ─────────────────────────
  // Query reviews (Sellers restricted to their own reviews, Admins/Operators can see all)
  router.get(
    "/",
    authenticate([ROLES.ADMIN, ROLES.OPERATOR, ROLES.SELLER]),
    validateBody(queryReviewsSchema),
    reviewController.getReviews
  );

  // Direct Review creation by Admin (Auto-Approved)
  router.post(
    "/admin",
    authenticate([ROLES.ADMIN]),
    validateBody(createAdminReviewSchema),
    reviewController.createAdminReview
  );

  // Admin approves/rejects reviews
  router.patch(
    "/:id/status",
    authenticate([ROLES.ADMIN]),
    validateBody(updateReviewStatusSchema),
    reviewController.updateReviewStatus
  );

  // Admin modifies review details (rating stars or comment text)
  router.patch(
    "/:id",
    authenticate([ROLES.ADMIN]),
    validateBody(updateReviewContentSchema),
    reviewController.updateReviewContent
  );

  // Mount onto primary API namespace
  app.use("/reviews", router);
};
