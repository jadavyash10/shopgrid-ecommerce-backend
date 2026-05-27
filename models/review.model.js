import { model, Schema } from "mongoose";
import { COLLECTIONS } from "../utils/constant.js";

const reviewSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.BOOKING,
      required: false,
      default: null,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.USER,
      required: false,
      default: null,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.USER,
      required: [true, "Seller reference is required"],
    },
    name: {
      type: String,
      required: [true, "Reviewer name is required"],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
          trim: true,
        },
        type: {
          type: String,
          enum: ["image", "video"],
          default: "image",
        },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
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
  },
  { timestamps: true }
);

// High-performance search and sorting indexes
reviewSchema.index({ product: 1 });
reviewSchema.index({ seller: 1 });
reviewSchema.index({ booking: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ createdAt: -1 });

const Review = model(COLLECTIONS.REVIEW, reviewSchema);
export default Review;
