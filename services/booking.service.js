import Booking from "../models/booking.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import { stripe } from "../utils/stripe.js";
import { createError } from "../utils/javascript.js";
import { HTTP_STATUS, BASE_URL } from "../utils/constant.js";

// ── 1. Create Checkout Session & Pending Booking (Supports Guest Checkout) ───────
export const createCheckoutSession = async (data, currentUser) => {
  const { productId, quantity, variantSku, guestEmail, guestName } = data;

  // Retrieve product and check state
  const product = await Product.findById(productId);
  if (!product) {
    throw createError("Product not found", HTTP_STATUS.NOT_FOUND);
  }

  if (!product.isActive || product.status !== "approved") {
    throw createError("Product is not currently available for booking", HTTP_STATUS.BAD_REQUEST);
  }

  let finalPrice = 0;
  let variantAttributes = null;

  // STRICT INVENTORY CHECK (Make sure user cannot book above stock!)
  if (variantSku) {
    const variant = product.variants.find((v) => v.sku === variantSku);
    if (!variant) {
      throw createError(`Product variant with SKU "${variantSku}" not found`, HTTP_STATUS.NOT_FOUND);
    }
    if (variant.stock < quantity) {
      throw createError(
        `Requested quantity (${quantity}) exceeds available stock (${variant.stock}) for this variant`,
        HTTP_STATUS.BAD_REQUEST
      );
    }
    finalPrice = variant.price;
    variantAttributes = variant.attributes; // Retain variant details (color, size, etc.) in Mongoose
  } else {
    if (product.stock < quantity) {
      throw createError(
        `Requested quantity (${quantity}) exceeds available stock (${product.stock}) for this product`,
        HTTP_STATUS.BAD_REQUEST
      );
    }
    finalPrice = product.basePrice;
  }

  const totalAmount = finalPrice * quantity;

  // Validate Guest checkout details if customer is booking without login
  let guestFields = { user: null, guestEmail: null, guestName: null };
  if (currentUser) {
    guestFields.user = currentUser._id;
  } else {
    if (!guestEmail || !guestName || guestEmail.trim() === "" || guestName.trim() === "") {
      throw createError("Guest name and email are required for booking without login", HTTP_STATUS.BAD_REQUEST);
    }
    guestFields.guestEmail = guestEmail.trim();
    guestFields.guestName = guestName.trim();
  }

  // Create initial pending Booking document
  const booking = await Booking.create({
    ...guestFields,
    product: product._id,
    variantSku: variantSku || null,
    variantAttributes,
    quantity,
    totalAmount,
    currency: "usd",
    paymentStatus: "pending",
    status: "pending",
  });

  try {
    // Generate Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: currentUser?.email || guestFields.guestEmail, // Pre-fills email on Stripe checkout page
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.title,
              description: product.description ? product.description.substring(0, 255) : `Booking booking for ${product.title}`,
            },
            unit_amount: Math.round(finalPrice * 100), // in cents
          },
          quantity,
        },
      ],
      mode: "payment",
      success_url: `${BASE_URL}/api/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/api/bookings/cancel`,
      metadata: {
        bookingId: booking._id.toString(),
        userId: currentUser ? currentUser._id.toString() : "guest",
      },
    });

    // Update booking with the Session ID
    booking.stripeSessionId = session.id;
    await booking.save();

    return {
      booking,
      checkoutUrl: session.url,
    };
  } catch (error) {
    // Rollback the pending booking if Stripe session generation fails
    await Booking.findByIdAndDelete(booking._id);
    throw createError(`Stripe checkout initialization failed: ${error.message}`, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// ── 2. Handle Stripe Webhooks (Payment completed & Stock deduction) ─────
export const handleStripeWebhook = async (rawBody, stripeSignature) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw createError("Stripe webhook signature secret is missing on server", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, stripeSignature, webhookSecret);
  } catch (error) {
    console.error("❌ Stripe Webhook Signature Verification Failed:", error.message);
    throw createError(`Stripe signature verification failed: ${error.message}`, HTTP_STATUS.BAD_REQUEST);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = session.metadata.bookingId;

    const booking = await Booking.findById(bookingId).populate("product");
    if (!booking) {
      console.warn(`⚠️ Warning: Webhook received for non-existent booking ID ${bookingId}`);
      return;
    }

    // Safeguard / Idempotency
    if (booking.paymentStatus === "paid") {
      console.log(`ℹ️ Booking ${bookingId} already marked as paid.`);
      return;
    }

    // Update booking state
    booking.paymentStatus = "paid";
    booking.stripePaymentIntentId = session.payment_intent;

    // Deduct stock safely (Atomic decrement)
    const product = booking.product;
    if (booking.variantSku) {
      await Product.updateOne(
        { _id: product._id, "variants.sku": booking.variantSku },
        { $inc: { "variants.$.stock": -booking.quantity } }
      );
    } else {
      await Product.updateOne(
        { _id: product._id },
        { $inc: { stock: -booking.quantity } }
      );
    }
    await booking.save();
    console.log(`✅ Booking ${bookingId} successfully paid and stock updated.`);
  } else if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const bookingId = session.metadata.bookingId;

    const booking = await Booking.findById(bookingId);
    if (booking && booking.paymentStatus === "pending") {
      await Booking.findByIdAndDelete(bookingId);
      console.log(`🗑️ [handleStripeWebhook] Pending uncompleted booking ${bookingId} was deleted due to Stripe session expiration.`);
    }
  }
};

// ── 3. Get Bookings (Admin/Operator sees all, Seller sees own products, Customer sees own) ──
export const getBookings = async (queryParams, currentUser) => {
  const { page = 1, limit = 20, status, paymentStatus } = queryParams;

  // Enforce page limits
  let limitValue = Number(limit);
  if (isNaN(limitValue) || limitValue < 20) {
    limitValue = 20;
  }
  const skip = (page - 1) * limitValue;
  const filter = {};

  // Segregate permissions based on User Roles (Allows both Admin and Operator to view all)
  console.log(`👤 [getBookings] User: ${currentUser.email} | Role: ${currentUser.role}`);
  
  if (currentUser.role === "admin" || currentUser.role === "operator") {
    // Admin & Operator see everything across the platform
  } else if (currentUser.role === "seller") {
    // Seller only sees bookings for products belonging to them
    const sellerProducts = await Product.find({ seller: currentUser._id }).distinct("_id");
    console.log(`📦 [getBookings] Seller products found:`, sellerProducts);
    filter.product = { $in: sellerProducts };
  } else {
    // Customers only see their own logged-in bookings
    filter.user = currentUser._id;
  }
  
  console.log(`🔍 [getBookings] Final Mongoose filter:`, JSON.stringify(filter));

  // Optional status filters
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate({
        path: "product",
        select: "title slug sku basePrice stock variants seller",
        populate: { path: "seller", select: "name email" },
      })
      .populate("user", "name email role status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitValue),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: {
      total,
      page: Number(page),
      limit: limitValue,
      totalPages: Math.ceil(total / limitValue),
    },
  };
};

// ── 4. Review Booking (Approve or Reject with automatic Stripe Refund & Stock restore) ──
export const reviewBooking = async (bookingId, { status, rejectionReason }, currentUser) => {
  const booking = await Booking.findById(bookingId).populate("product");
  if (!booking) {
    throw createError("Booking not found", HTTP_STATUS.NOT_FOUND);
  }

  // Authorization checking: must be Admin OR Operator OR the product owner (Seller)
  const isProductOwner = booking.product.seller.toString() === currentUser._id.toString();
  const isAdmin = currentUser.role === "admin";
  const isOperator = currentUser.role === "operator";

  if (!isAdmin && !isOperator && !isProductOwner) {
    throw createError("You are not authorized to review this booking", HTTP_STATUS.FORBIDDEN);
  }

  // Pre-condition checking: Must be fully paid
  if (booking.paymentStatus !== "paid") {
    throw createError("Only successfully paid bookings can be reviewed", HTTP_STATUS.BAD_REQUEST);
  }

  // Ensure state transition is valid
  if (booking.status !== "pending") {
    throw createError(`This booking has already been resolved and is currently "${booking.status}"`, HTTP_STATUS.BAD_REQUEST);
  }

  if (status === "approved") {
    booking.status = "approved";
    booking.approvedAt = new Date();
  } else if (status === "rejected") {
    // Process automatic Stripe Refund
    if (booking.stripePaymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: booking.stripePaymentIntentId,
          reason: "requested_by_customer",
        });
        booking.paymentStatus = "refunded";
      } catch (refundError) {
        console.error("❌ Automatic Stripe refund failed:", refundError.message);
        throw createError(
          `Failed to process automatic payment refund through Stripe: ${refundError.message}`,
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
      }
    }

    // Restore Inventory Stock (Atomic increment)
    const product = booking.product;
    if (booking.variantSku) {
      await Product.updateOne(
        { _id: product._id, "variants.sku": booking.variantSku },
        { $inc: { "variants.$.stock": booking.quantity } }
      );
    } else {
      await Product.updateOne(
        { _id: product._id },
        { $inc: { stock: booking.quantity } }
      );
    }

    booking.status = "rejected";
    booking.rejectedAt = new Date();
    booking.rejectionReason = rejectionReason;
  }

  await booking.save();
  return booking;
};

// ── 5. Cancel Booking (Admin and Operator can cancel and issue automated Stripe Refunds) ──
export const cancelBooking = async (bookingId, currentUser) => {
  const booking = await Booking.findById(bookingId).populate("product");
  if (!booking) {
    throw createError("Booking not found", HTTP_STATUS.NOT_FOUND);
  }

  // Permission Restriction: ONLY Admin and Operator can cancel bookings
  const isAdmin = currentUser.role === "admin";
  const isOperator = currentUser.role === "operator";
  if (!isAdmin && !isOperator) {
    throw createError("Only administrators and operators are authorized to cancel bookings", HTTP_STATUS.FORBIDDEN);
  }

  if (booking.status === "cancelled") {
    throw createError("This booking is already cancelled", HTTP_STATUS.BAD_REQUEST);
  }

  // Handle refund and inventory restoration if the booking was already successfully paid
  if (booking.paymentStatus === "paid") {
    if (booking.stripePaymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: booking.stripePaymentIntentId,
          reason: "requested_by_customer",
        });
        booking.paymentStatus = "refunded";
      } catch (refundError) {
        console.error("❌ Stripe refund failed during booking cancellation:", refundError.message);
        throw createError(
          `Failed to process refund during booking cancellation: ${refundError.message}`,
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
      }
    }

    // Restore Inventory Stock (Atomic increment)
    const product = booking.product;
    if (booking.variantSku) {
      await Product.updateOne(
        { _id: product._id, "variants.sku": booking.variantSku },
        { $inc: { "variants.$.stock": booking.quantity } }
      );
    } else {
      await Product.updateOne(
        { _id: product._id },
        { $inc: { stock: booking.quantity } }
      );
    }
  }

  // Set booking cancellation metrics
  booking.status = "cancelled";
  booking.cancelledAt = new Date();
  booking.cancelledBy = currentUser._id;

  await booking.save();
  return booking;
};

// ── 6. Public: Retrieve bookings by Email ───────────────────────────
export const getBookingsByEmail = async (email) => {
  const cleanedEmail = String(email).trim().toLowerCase();

  // Find registered customer associated with this email
  const userDoc = await User.findOne({ email: cleanedEmail });

  // Construct a query that matches either guestEmail OR registered user ID
  const query = {
    $or: [
      { guestEmail: cleanedEmail }
    ]
  };

  if (userDoc) {
    query.$or.push({ user: userDoc._id });
  }

  const bookings = await Booking.find(query)
    .populate({
      path: "product",
      select: "title slug sku basePrice stock variants seller",
      populate: { path: "seller", select: "name email" }
    })
    .populate("user", "name email role status")
    .sort({ createdAt: -1 });

  return bookings;
};
