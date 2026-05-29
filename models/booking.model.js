import { model, Schema } from "mongoose";
import { COLLECTIONS } from "../utils/constant.js";

const bookingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.USER,
      required: false, // Optional to support guest bookings (booking without login)
      default: null,
    },
    guestEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    guestName: {
      type: String,
      trim: true,
      default: null,
    },
    address: {
      type: String,
      required: [true, "Shipping address is required"],
      trim: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
    },
    variantSku: {
      type: String,
      trim: true,
      default: null,
    },
    variantAttributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: null, // Saves color, size, or other variant attributes chosen during booking
    },
    quantity: {
      type: Number,
      required: [true, "Booking quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "usd",
      lowercase: true,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    stripePaymentIntentId: {
      type: String,
      sparse: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.USER,
      default: null,
    },
  },
  { timestamps: true }
);

// High-performance search and sorting indexes
bookingSchema.index({ user: 1 });
bookingSchema.index({ product: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ createdAt: -1 });

const Booking = model(COLLECTIONS.BOOKING, bookingSchema);
export default Booking;
