import * as bookingService from "../services/booking.service.js";
import { HTTP_STATUS } from "../utils/constant.js";
import { sendResponse } from "../utils/javascript.js";

// ── 1. Create Stripe Checkout Session (Customer) ───────────────
export const createCheckoutSession = async (req, res, next) => {
  try {
    const result = await bookingService.createCheckoutSession(req.body, req.user);
    return sendResponse(
      res,
      HTTP_STATUS.CREATED,
      "Stripe Checkout session initialized successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

// ── 2. Handle Stripe Webhook Events ────────────────────────────
export const handleStripeWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["stripe-signature"];
    const rawBody = req.rawBody;

    await bookingService.handleStripeWebhook(rawBody, signature);
    return res.status(HTTP_STATUS.OK).send({ received: true });
  } catch (error) {
    console.error("❌ Webhook Handling Failed:", error.message);
    // Stripe webhooks should return 400 for verification failures
    return res.status(HTTP_STATUS.BAD_REQUEST).send({ error: error.message });
  }
};

// ── 3. List Bookings (Admin / Seller / Customer) ───────────────
export const getBookings = async (req, res, next) => {
  try {
    const queryParams = req.body; // validateBody merges query + body into req.body
    const result = await bookingService.getBookings(queryParams, req.user);
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Bookings retrieved successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

// ── 4. Review Booking (Admin / Seller: Approve or Reject) ───────
export const reviewBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id || req.body.id;
    const booking = await bookingService.reviewBooking(bookingId, req.body, req.user);
    const message = req.body.status === "approved" ? "Booking approved successfully" : "Booking rejected and payment fully refunded";
    
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      message,
      booking
    );
  } catch (error) {
    next(error);
  }
};

// ── 5. Payment Success Redirect / Landing Page ─────────────────
export const paymentSuccess = (req, res) => {
  const sessionId = req.query.session_id;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  // If frontend URL exists, redirect the customer there
  if (process.env.FRONTEND_URL) {
    return res.redirect(`${frontendUrl}/bookings/success?session_id=${sessionId}`);
  }

  // Fallback beautiful HTML landing page
  return res.status(HTTP_STATUS.OK).send(`
    <html>
      <head>
        <title>Payment Successful - ShopGrid</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #2d3748; }
          .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); text-align: center; max-width: 450px; width: 100%; border-top: 6px solid #48bb78; }
          h1 { color: #2f855a; margin-bottom: 10px; font-size: 24px; }
          p { margin-bottom: 25px; line-height: 1.5; color: #718096; }
          .btn { background: #48bb78; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; transition: background 0.2s; }
          .btn:hover { background: #38a169; }
          .session { font-size: 11px; color: #a0aec0; margin-top: 20px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🎉 Payment Successful!</h1>
          <p>Thank you for your purchase. Your payment was verified, and the booking is now pending seller review. You can close this window now.</p>
          <a href="#" class="btn" onclick="window.close()">Close Window</a>
          <div class="session">Session ID: ${sessionId}</div>
        </div>
      </body>
    </html>
  `);
};

// ── 6. Payment Cancel Redirect / Landing Page ──────────────────
export const paymentCancel = (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  // If frontend URL exists, redirect the customer there
  if (process.env.FRONTEND_URL) {
    return res.redirect(`${frontendUrl}/bookings/cancel`);
  }

  // Fallback beautiful HTML landing page
  return res.status(HTTP_STATUS.OK).send(`
    <html>
      <head>
        <title>Payment Cancelled - ShopGrid</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #2d3748; }
          .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); text-align: center; max-width: 450px; width: 100%; border-top: 6px solid #e53e3e; }
          h1 { color: #c53030; margin-bottom: 10px; font-size: 24px; }
          p { margin-bottom: 25px; line-height: 1.5; color: #718096; }
          .btn { background: #e53e3e; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; transition: background 0.2s; }
          .btn:hover { background: #c53030; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>⚠️ Payment Cancelled</h1>
          <p>Your payment transaction was cancelled. No charges were made, and your pending booking has been removed. Feel free to try again.</p>
          <a href="#" class="btn" onclick="window.close()">Close Window</a>
        </div>
      </body>
    </html>
  `);
};

// ── 7. Cancel Booking (Admin / Operator) ───────────────────────
export const cancelBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id || req.body.id;
    const booking = await bookingService.cancelBooking(bookingId, req.user);
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Booking cancelled successfully and refunded if already paid",
      booking
    );
  } catch (error) {
    next(error);
  }
};

// ── 8. Public: Retrieve bookings by Email ──────────────────────
export const getBookingsByEmail = async (req, res, next) => {
  try {
    const { email } = req.params;
    const bookings = await bookingService.getBookingsByEmail(email);
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Bookings retrieved successfully",
      bookings
    );
  } catch (error) {
    next(error);
  }
};

