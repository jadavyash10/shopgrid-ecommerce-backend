import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { validateBody } from "../middleware/validateBody.js";
import { ROLES } from "../utils/constant.js";
import {
  createProductAdminSchema,
  createProductSchema,
  queryProductsSchema,
  reviewProductSchema,
  updateProductSchema,
} from "../validations/product.validation.js";
import { upload } from "../middleware/upload.js";

const parseProductFormData = (req, res, next) => {
  if (req.body) {
    const jsonFields = ["attributes", "variants", "media", "tags"];
    jsonFields.forEach((field) => {
      if (
        typeof req.body[field] === "string" &&
        req.body[field].trim() !== ""
      ) {
        const val = req.body[field].trim();

        // Specialized robust tags parsing
        if (field === "tags") {
          if (val.startsWith("[") && val.endsWith("]")) {
            try {
              // Convert single quotes to double quotes for valid JSON
              const cleaned = val.replace(/'/g, '"');
              req.body.tags = JSON.parse(cleaned);
            } catch (e) {
              // Fallback: split comma-separated items inside brackets
              req.body.tags = val
                .slice(1, -1)
                .split(",")
                .map((t) => t.trim().replace(/^['"]|['"]$/g, ""))
                .filter(Boolean);
            }
          } else {
            // Treat as raw comma-separated list
            req.body.tags = val
              .split(",")
              .map((t) => t.trim().replace(/^['"]|['"]$/g, ""))
              .filter(Boolean);
          }
          return;
        }

        // Generic JSON parser for attributes, variants, media
        try {
          req.body[field] = JSON.parse(val);
        } catch (e) {
          try {
            // Attempt simple single-to-double quote replacement fallback
            const cleanedVal = val.replace(/'/g, '"');
            req.body[field] = JSON.parse(cleanedVal);
          } catch (e2) {
            // Keep original string so Joi catches the invalid schema format
          }
        }
      }
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("📝 [parseProductFormData] Parsed request body:", req.body);
    }
  }
  next();
};

export default (app) => {
  const router = Router();

  // ── Public Endpoints ──────────────────────────────────────────
  // Get marketplace products (filtering, search, paginated)
  router.get(
    "/",
    validateBody(queryProductsSchema),
    productController.getMarketplaceProducts,
  );

  // Get specific product details by slug (accessible to anyone if approved/active, or to owner/admin if not)
  router.get(
    "/slug/:slug",
    optionalAuthenticate,
    productController.getProductBySlug,
  );

  // ── Seller Endpoints ──────────────────────────────────────────
  // Create product (status starts as "pending_review")
  router.post(
    "/",
    authenticate(ROLES.SELLER),
    upload.none(),
    parseProductFormData,
    validateBody(createProductSchema),
    productController.createProduct,
  );

  // Update own product (reverts status to "pending_review" if currently approved)
  router.put(
    "/:id",
    authenticate([ROLES.SELLER, ROLES.ADMIN]),
    upload.none(),
    parseProductFormData,
    validateBody(updateProductSchema),
    productController.updateProduct,
  );

  // Get own products list (paginated, with search and status filters)
  router.get(
    "/my",
    authenticate(ROLES.SELLER),
    validateBody(queryProductsSchema),
    productController.getProductsForSeller,
  );

  // ── Admin Endpoints ───────────────────────────────────────────
  // Direct creation & assignment (auto-approved immediately)
  router.post(
    "/admin",
    authenticate(ROLES.ADMIN),
    upload.none(),
    parseProductFormData,
    validateBody(createProductAdminSchema),
    productController.createProductAdmin,
  );

  // Review product: Approve or Reject (requires rejectionReason on rejection)
  router.patch(
    "/:id/review",
    authenticate(ROLES.ADMIN),
    validateBody(reviewProductSchema),
    productController.reviewProduct,
  );

  // Get all products from all sellers (paginated, filtered by seller, status, and search)
  router.get(
    "/all",
    authenticate(ROLES.ADMIN),
    validateBody(queryProductsSchema),
    productController.getProductsForAdmin,
  );

  app.use("/products", router);
};
