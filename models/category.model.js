import { model, Schema } from "mongoose";
import { COLLECTIONS } from "../utils/constant.js";

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    url: {
      type: String,
      required: [true, "Category URL is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    bannerImage: {
      type: String,
      required: [true, "Banner image is required"],
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: [150, "SEO Title cannot exceed 150 characters"],
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [300, "Meta Description cannot exceed 300 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

const Category = model(COLLECTIONS.CATEGORY, categorySchema);
export default Category;
