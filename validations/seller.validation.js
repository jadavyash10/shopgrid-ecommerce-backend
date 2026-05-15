import Joi from "joi";
import { STATUS } from "../utils/constant.js";

export const signupSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required().messages({
    "string.min": "Full name must be at least 2 characters",
    "string.max": "Full name cannot exceed 100 characters",
    "any.required": "Full name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  phoneNumber: Joi.string().required().messages({
    "any.required": "Phone number is required",
  }),
  businessName: Joi.string().required().messages({
    "any.required": "Business name is required",
  }),
  businessDescription: Joi.string().required().messages({
    "any.required": "Business description is required",
  }),
  country: Joi.string().required().messages({
    "any.required": "Country is required",
  }),
  state: Joi.string().required().messages({
    "any.required": "State is required",
  }),
  city: Joi.string().required().messages({
    "any.required": "City is required",
  }),
  addressLine: Joi.string().required().messages({
    "any.required": "Address line is required",
  }),
  productCategories: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string()).min(1),
      Joi.string(), // in case it's sent as a single string
    )
    .required()
    .messages({
      "any.required": "Product categories are required",
    }),
});

export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(STATUS.APPROVED, STATUS.REJECTED)
    .required()
    .messages({
      "any.only": "Status must be either approved or rejected",
      "any.required": "Status is required",
    }),
  rejectionReason: Joi.string().when("status", {
    is: STATUS.REJECTED,
    then: Joi.required().messages({
      "any.required": "Rejection reason is required when rejecting a seller",
    }),
    otherwise: Joi.forbidden(),
  }),
});

export const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().allow(""),
  status: Joi.string()
    .valid(
      STATUS.PENDING,
      STATUS.APPROVED,
      STATUS.REJECTED,
      STATUS.SUSPENDED,
      STATUS.INACTIVE,
    )
    .optional(),
  sortBy: Joi.string().valid("createdAt", "updatedAt").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

export const updateSellerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional(),
  phoneNumber: Joi.string().optional(),
  businessName: Joi.string().optional(),
  businessDescription: Joi.string().optional(),
  country: Joi.string().optional(),
  state: Joi.string().optional(),
  city: Joi.string().optional(),
  addressLine: Joi.string().optional(),
  productCategories: Joi.alternatives().try(
    Joi.array().items(Joi.string()).min(1),
    Joi.string(),
  ).optional(),
});
