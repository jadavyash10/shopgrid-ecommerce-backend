import Joi from "joi";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const queryInvoicesSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  seller: Joi.string()
    .pattern(objectIdPattern)
    .optional()
    .messages({
      "string.pattern.base": "Invalid seller ID format",
    }),
  month: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .optional(),
  year: Joi.number()
    .integer()
    .min(2000)
    .max(2100)
    .optional(),
  status: Joi.string()
    .valid("pending", "completed")
    .optional(),
});

export const updateInvoiceStatusSchema = Joi.object({
  id: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      "string.pattern.base": "Invalid invoice ID format",
      "any.required": "Invoice ID is required",
    }),
  status: Joi.string()
    .valid("pending", "completed")
    .required()
    .messages({
      "any.only": "Status must be either pending or completed",
      "any.required": "Status is required",
    }),
  paymentReference: Joi.string()
    .trim()
    .when("status", {
      is: "completed",
      then: Joi.required().messages({
        "any.required": "Payment reference is required when completing an invoice",
        "string.empty": "Payment reference cannot be empty",
      }),
      otherwise: Joi.optional().allow("", null),
    }),
  paymentNotes: Joi.string()
    .trim()
    .optional()
    .allow("", null),
});

export const manualGenerateSchema = Joi.object({
  month: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .required()
    .messages({
      "any.required": "Month is required",
      "number.min": "Month must be between 1 and 12",
      "number.max": "Month must be between 1 and 12",
    }),
  year: Joi.number()
    .integer()
    .min(2000)
    .max(2100)
    .required()
    .messages({
      "any.required": "Year is required",
      "number.min": "Year must be at least 2000",
      "number.max": "Year cannot exceed 2100",
    }),
});
