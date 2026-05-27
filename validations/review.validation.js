import Joi from "joi";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const mediaObject = Joi.object({
  url: Joi.string().uri().required().messages({
    "string.uri": "Invalid image URL format",
    "any.required": "Image URL is required",
  }),
  type: Joi.string().valid("image", "video").default("image"),
});

export const createCustomerReviewSchema = Joi.object({
  bookingId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      "string.pattern.base": "Invalid booking ID format",
      "any.required": "Booking ID is required",
    }),
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      "number.base": "Rating must be a number",
      "number.min": "Rating must be at least 1 star",
      "number.max": "Rating cannot exceed 5 stars",
      "any.required": "Rating is required",
    }),
  comment: Joi.string()
    .trim()
    .min(3)
    .required()
    .messages({
      "string.empty": "Comment cannot be empty",
      "string.min": "Comment must be at least 3 characters",
      "any.required": "Comment description is required",
    }),
  images: Joi.array().items(mediaObject).optional().default([]),
});

export const createAdminReviewSchema = Joi.object({
  productId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      "string.pattern.base": "Invalid product ID format",
      "any.required": "Product ID is required",
    }),
  name: Joi.string()
    .trim()
    .min(2)
    .required()
    .messages({
      "string.empty": "Reviewer name cannot be empty",
      "string.min": "Reviewer name must be at least 2 characters",
      "any.required": "Reviewer name is required",
    }),
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      "number.base": "Rating must be a number",
      "number.min": "Rating must be at least 1 star",
      "number.max": "Rating cannot exceed 5 stars",
      "any.required": "Rating is required",
    }),
  comment: Joi.string()
    .trim()
    .min(3)
    .required()
    .messages({
      "string.empty": "Comment cannot be empty",
      "string.min": "Comment must be at least 3 characters",
      "any.required": "Comment description is required",
    }),
  images: Joi.array().items(mediaObject).optional().default([]),
});

export const updateReviewStatusSchema = Joi.object({
  status: Joi.string()
    .valid("approved", "rejected")
    .required()
    .messages({
      "any.only": "Status must be approved or rejected",
      "any.required": "Status is required",
    }),
  rejectionReason: Joi.string()
    .trim()
    .when("status", {
      is: "rejected",
      then: Joi.required().messages({
        "any.required": "Rejection reason is required when rejecting a review",
        "string.empty": "Rejection reason cannot be empty",
      }),
      otherwise: Joi.optional().allow("", null),
    }),
});

export const updateReviewContentSchema = Joi.object({
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional()
    .messages({
      "number.min": "Rating must be at least 1 star",
      "number.max": "Rating cannot exceed 5 stars",
    }),
  comment: Joi.string()
    .trim()
    .min(3)
    .optional()
    .messages({
      "string.min": "Comment must be at least 3 characters",
    }),
  images: Joi.array().items(mediaObject).optional(),
});

export const queryReviewsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(20) // Enforces minimum page size of 20 items per e-commerce requirements
    .default(20),
  status: Joi.string()
    .valid("pending", "approved", "rejected")
    .optional(),
  product: Joi.string()
    .pattern(objectIdPattern)
    .optional(),
  seller: Joi.string()
    .pattern(objectIdPattern)
    .optional(),
});
