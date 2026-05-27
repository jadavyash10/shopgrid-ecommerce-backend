import { model, Schema } from "mongoose";
import { COLLECTIONS } from "../utils/constant.js";

const invoiceSchema = new Schema(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.USER,
      required: [true, "Seller reference is required"],
    },
    month: {
      type: Number,
      required: [true, "Invoice month is required"],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, "Invoice year is required"],
    },
    bookings: [
      {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.BOOKING,
      },
    ],
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: 0,
    },
    commissionRate: {
      type: Number,
      default: 10, // 10% commission
    },
    commissionAmount: {
      type: Number,
      required: [true, "Commission amount is required"],
      min: 0,
    },
    payoutAmount: {
      type: Number,
      required: [true, "Payout amount is required"],
      min: 0,
    },
    currency: {
      type: String,
      default: "inr",
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentReference: {
      type: String,
      trim: true,
      default: null,
    },
    paymentNotes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

// High-performance search and sorting indexes
invoiceSchema.index({ seller: 1 });
invoiceSchema.index({ month: 1, year: 1 });
invoiceSchema.index({ status: 1 });

// Ensure strict uniqueness: Only one invoice per seller per month/year
invoiceSchema.index({ seller: 1, month: 1, year: 1 }, { unique: true });

const Invoice = model(COLLECTIONS.INVOICE, invoiceSchema);
export default Invoice;
