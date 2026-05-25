import Joi from "joi";

export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Category name must be at least 2 characters",
    "string.max": "Category name cannot exceed 100 characters",
    "any.required": "Category name is required",
  }),
  url: Joi.string()
    .pattern(/^[a-z0-9-_]+$/)
    .required()
    .messages({
      "string.pattern.base": "Category URL must contain only lowercase letters, numbers, hyphens, and underscores",
      "any.required": "Category URL is required",
    }),
  seoTitle: Joi.string().max(150).optional().allow(""),
  metaDescription: Joi.string().max(300).optional().allow(""),
  description: Joi.string().optional().allow(""),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  url: Joi.string()
    .pattern(/^[a-z0-9-_]+$/)
    .optional()
    .messages({
      "string.pattern.base": "Category URL must contain only lowercase letters, numbers, hyphens, and underscores",
    }),
  seoTitle: Joi.string().max(150).optional().allow(""),
  metaDescription: Joi.string().max(300).optional().allow(""),
  description: Joi.string().optional().allow(""),
});

export const listCategoryQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().allow(""),
  sortBy: Joi.string().valid("createdAt", "updatedAt", "name").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});
