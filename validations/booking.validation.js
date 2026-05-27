import Joi from "joi";

// Helper for Mongo ObjectId verification
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const createCheckoutSessionSchema = Joi.object({
  productId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      "string.pattern.base": "Invalid product ID format",
      "any.required": "Product ID is required",
    }),
  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      "number.base": "Quantity must be a number",
      "number.integer": "Quantity must be an integer",
      "number.min": "Quantity must be at least 1",
      "any.required": "Quantity is required",
    }),
  variantSku: Joi.string()
    .trim()
    .optional()
    .allow(""),
  guestEmail: Joi.string()
    .email()
    .optional()
    .allow("", null)
    .messages({
      "string.email": "Please provide a valid email format for guest checkout",
    }),
  guestName: Joi.string()
    .trim()
    .optional()
    .allow("", null),
});

export const queryBookingsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(20) // Enforces minimum page size of 20 items per e-commerce requirements
    .default(20),
  status: Joi.string()
    .valid("pending", "approved", "rejected", "cancelled")
    .optional(),
  paymentStatus: Joi.string()
    .valid("pending", "paid", "failed", "refunded")
    .optional(),
});

export const reviewBookingSchema = Joi.object({
  status: Joi.string()
    .valid("approved", "rejected")
    .required()
    .messages({
      "any.only": "Status must be either approved or rejected",
      "any.required": "Review status is required",
    }),
  rejectionReason: Joi.string()
    .trim()
    .when("status", {
      is: "rejected",
      then: Joi.required().messages({
        "any.required": "Rejection reason is required when rejecting a booking",
        "string.empty": "Rejection reason cannot be empty",
      }),
      otherwise: Joi.optional().allow("", null),
    }),
});
