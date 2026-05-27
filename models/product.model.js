import { model, Schema } from "mongoose";
import { COLLECTIONS } from "../utils/constant.js";

// Unified Media Subdocument Schema
const mediaSchema = new Schema(
  {
    url: {
      type: String,
      required: [true, "Media URL is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["image", "video"],
      required: [true, "Media type is required (image or video)"],
    },
  },
  { _id: false }
);

// Simple MVP Variant Schema
const variantSchema = new Schema(
  {
    sku: {
      type: String,
      required: [true, "Variant SKU is required"],
      trim: true,
    },
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => new Map(),
    },
    price: {
      type: Number,
      required: [true, "Variant price is required"],
      min: [0, "Variant price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Variant stock is required"],
      min: [0, "Variant stock cannot be negative"],
    },
    media: [mediaSchema],
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// Universal Product Schema
const productSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      minlength: [2, "Product title must be at least 2 characters"],
      maxlength: [200, "Product title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      required: [true, "Product slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.CATEGORY, // Refers to the existing "categories" collection
      required: [true, "Product category is required"],
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.USER, // Refers to "users" collection (a user with role: seller)
      required: [true, "Product seller is required"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.USER,
      required: [true, "Creator reference is required"],
    },
    createdByRole: {
      type: String,
      enum: ["admin", "seller"],
      required: [true, "Creator role is required"],
    },
    sku: {
      type: String,
      required: [true, "Product SKU is required"],
      unique: true,
      trim: true,
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0.01, "Base price must be greater than 0"],
    },
    comparePrice: {
      type: Number,
      min: [0, "Compare price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["draft", "pending_review", "approved", "rejected"],
      default: "pending_review",
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => new Map(),
    },
    searchableAttributes: [
      {
        key: String,
        value: String,
      },
    ],
    variants: {
      type: [variantSchema],
      default: [],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, "Average rating cannot be negative"],
      max: [5, "Average rating cannot exceed 5"],
    },
    numOfReviews: {
      type: Number,
      default: 0,
      min: [0, "Number of reviews cannot be negative"],
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────
productSchema.index({ category: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ status: 1 });
productSchema.index({ "searchableAttributes.key": 1, "searchableAttributes.value": 1 });
productSchema.index({ "variants.sku": 1 });
productSchema.index({ basePrice: 1 });

// ── Auto-generate searchableAttributes before save ──────────
productSchema.pre("save", function () {
  if (this.isModified("attributes")) {
    const searchable = [];
    if (this.attributes instanceof Map) {
      for (const [key, value] of this.attributes.entries()) {
        searchable.push({ key, value: String(value) });
      }
    } else if (this.attributes && typeof this.attributes === "object") {
      for (const [key, value] of Object.entries(this.attributes)) {
        searchable.push({ key, value: String(value) });
      }
    }
    this.searchableAttributes = searchable;
  }
});

const Product = model("Product", productSchema);
export default Product;
