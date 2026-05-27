import { Router } from "express";
import * as bookingController from "../controllers/booking.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { validateBody } from "../middleware/validateBody.js";
import { ROLES } from "../utils/constant.js";
import {
  createCheckoutSessionSchema,
  queryBookingsSchema,
  reviewBookingSchema,
} from "../validations/booking.validation.js";

export default (app) => {
  const router = Router();

  // ── Public Webhook & Redirect Routes ─────────────────────────
  // Stripe sends automated notifications here (no session authentication)
  router.post("/webhook", bookingController.handleStripeWebhook);
  
  // Successful Stripe checkout redirect landings
  router.get("/success", bookingController.paymentSuccess);
  
  // Cancelled Stripe checkout redirect landings
  router.get("/cancel", bookingController.paymentCancel);

  // Retrieve bookings by customer/guest email address
  router.get("/email/:email", bookingController.getBookingsByEmail);

  // ── Protected & Guest Routes ─────────────────────────────────
  // Create Stripe checkout session (Supports Guest booking without login or Authenticated booking)
  router.post(
    "/checkout-session",
    optionalAuthenticate,
    validateBody(createCheckoutSessionSchema),
    bookingController.createCheckoutSession
  );

  // List bookings (Customer sees own, Seller sees own products, Admin/Operator sees all)
  router.get(
    "/",
    authenticate(),
    validateBody(queryBookingsSchema),
    bookingController.getBookings
  );

  // Approve or reject booking (Admin, Operator, or product owner Seller)
  router.patch(
    "/:id/review",
    authenticate([ROLES.ADMIN, ROLES.OPERATOR, ROLES.SELLER]),
    validateBody(reviewBookingSchema),
    bookingController.reviewBooking
  );

  // Cancel booking (Admin and Operator only: Triggers Stripe refunds and stock restoration if paid)
  router.patch(
    "/:id/cancel",
    authenticate([ROLES.ADMIN, ROLES.OPERATOR]),
    bookingController.cancelBooking
  );

  // Mount router onto the main API namespace
  app.use("/bookings", router);
};
