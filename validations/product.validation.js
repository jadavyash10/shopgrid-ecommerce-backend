import Joi from "joi";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// Reusable Media Item Validator
const mediaItemSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    "any.required": "Media URL is required",
    "string.uri": "Media URL must be a valid URI",
  }),
  type: Joi.string().valid("image", "video").required().messages({
    "any.required": "Media type is required",
    "any.only": "Media type must be either image or video",
  }),
});

// Reusable Variant Validator
const variantSchema = Joi.object({
  sku: Joi.string().required().messages({
    "any.required": "Variant SKU is required",
  }),
  attributes: Joi.object().pattern(Joi.string(), Joi.any()).required().messages({
    "any.required": "Variant attributes are required",
  }),
  price: Joi.number().greater(0).required().messages({
    "any.required": "Variant price is required",
    "number.greater": "Variant price must be greater than 0",
  }),
  stock: Joi.number().integer().min(0).required().messages({
    "any.required": "Variant stock is required",
    "number.min": "Variant stock cannot be negative",
  }),
  media: Joi.array().items(mediaItemSchema).optional(),
  isDefault: Joi.boolean().default(false),
});

// Create Product Schema (General / Seller)
export const createProductSchema = Joi.object({
  title: Joi.string().min(2).max(200).required().messages({
    "string.min": "Product title must be at least 2 characters",
    "string.max": "Product title cannot exceed 200 characters",
    "any.required": "Product title is required",
  }),
  description: Joi.string().required().messages({
    "any.required": "Product description is required",
  }),
  category: Joi.string().pattern(objectIdPattern).required().messages({
    "string.pattern.base": "Invalid Category ID format",
    "any.required": "Category ID is required",
  }),
  sku: Joi.string().required().messages({
    "any.required": "Product SKU is required",
  }),
  basePrice: Joi.number().greater(0).required().messages({
    "number.greater": "Base price must be greater than 0",
    "any.required": "Base price is required",
  }),
  comparePrice: Joi.number().greater(0).optional(),
  stock: Joi.number().integer().min(0).required().messages({
    "number.min": "Stock cannot be negative",
    "any.required": "Stock is required",
  }),
  tags: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().default(true),
  attributes: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
  variants: Joi.array().items(variantSchema).optional(),
  status: Joi.string().valid("draft", "pending_review").optional(),
});

// Create Product Schema (Admin direct with mandatory seller reference)
export const createProductAdminSchema = createProductSchema.keys({
  seller: Joi.string().pattern(objectIdPattern).required().messages({
    "string.pattern.base": "Invalid Seller ID format",
    "any.required": "Seller ID is required for admin-created products",
  }),
  status: Joi.string().valid("approved", "draft", "pending_review").optional(),
});

// Update Product Schema
export const updateProductSchema = Joi.object({
  title: Joi.string().min(2).max(200).optional(),
  description: Joi.string().optional(),
  category: Joi.string().pattern(objectIdPattern).optional(),
  sku: Joi.string().optional(),
  basePrice: Joi.number().greater(0).optional(),
  comparePrice: Joi.number().greater(0).optional(),
  stock: Joi.number().integer().min(0).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional(),
  attributes: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
  variants: Joi.array().items(variantSchema).optional(),
  status: Joi.string().valid("draft", "pending_review").optional(),
});

// Admin Review Schema
export const reviewProductSchema = Joi.object({
  status: Joi.string().valid("approved", "rejected").required().messages({
    "any.only": "Status must be approved or rejected",
    "any.required": "Status is required",
  }),
  rejectionReason: Joi.string().when("status", {
    is: "rejected",
    then: Joi.required().messages({
      "any.required": "Rejection reason is required when rejecting a product",
    }),
    otherwise: Joi.forbidden().messages({
      "any.unknown": "Rejection reason should not be provided when approving a product",
    }),
  }),
});

// Products Query Params Schema
export const queryProductsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().optional().allow(""),
  status: Joi.string().valid("draft", "pending_review", "approved", "rejected").optional(),
  seller: Joi.string().pattern(objectIdPattern).optional(),
  category: Joi.string().optional().allow(""),
  sortBy: Joi.string().valid("createdAt", "updatedAt", "basePrice", "title", "stock").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  inStock: Joi.boolean().optional(),
});
