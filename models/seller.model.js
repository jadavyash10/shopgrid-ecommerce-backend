import { model, Schema } from "mongoose";
import { COLLECTIONS, ROLES, STATUS } from "../utils/constant.js";

const sellerSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
    },
    businessDescription: {
      type: String,
      required: [true, "Business description is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    addressLine: {
      type: String,
      required: [true, "Address line is required"],
      trim: true,
    },
    productCategories: {
      type: [String],
      required: [true, "At least one product category is required"],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "At least one product category is required",
      },
    },
    sampleProductImages: {
      type: [String],
      required: [true, "At least one sample product image is required"],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "At least one sample product image is required",
      },
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.SELLER,
    },
    status: {
      type: String,
      enum: [STATUS.PENDING, STATUS.APPROVED, STATUS.REJECTED],
      default: STATUS.PENDING,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    approvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes for search
sellerSchema.index({ fullName: "text", email: "text", businessName: "text" });
sellerSchema.index({ status: 1 });
sellerSchema.index({ createdAt: -1 });

const Seller = model(COLLECTIONS.SELLER, sellerSchema);
export default Seller;
