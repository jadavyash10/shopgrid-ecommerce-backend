import * as productService from "../services/product.service.js";
import { HTTP_STATUS } from "../utils/constant.js";
import { sendResponse } from "../utils/javascript.js";

// ── 1. Create Product (Seller) ────────────────────────────────
export const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.user);
    return sendResponse(
      res,
      HTTP_STATUS.CREATED,
      "Product created successfully and submitted for review",
      product
    );
  } catch (error) {
    next(error);
  }
};

// ── 2. Create Product (Admin direct) ──────────────────────────
export const createProductAdmin = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.user);
    return sendResponse(
      res,
      HTTP_STATUS.CREATED,
      "Product created and approved successfully",
      product
    );
  } catch (error) {
    next(error);
  }
};

// ── 3. Update Product (Seller / Admin) ────────────────────────
export const updateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id || req.body.id;
    const updatedProduct = await productService.updateProduct(productId, req.body, req.user);
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Product updated successfully",
      updatedProduct
    );
  } catch (error) {
    next(error);
  }
};

// ── 4. Admin: Get All Products (All Sellers, All Statuses) ─────
export const getProductsForAdmin = async (req, res, next) => {
  try {
    const queryParams = { ...req.query, ...req.body };
    const result = await productService.getProducts(queryParams);
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Products retrieved successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

// ── 5. Seller: Get Own Products ──────────────────────────────
export const getProductsForSeller = async (req, res, next) => {
  try {
    const queryParams = { ...req.query, ...req.body };
    const result = await productService.getProducts(queryParams, req.user._id);
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Your products retrieved successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

// ── 6. Public: Get Marketplace Products ──────────────────────
export const getMarketplaceProducts = async (req, res, next) => {
  try {
    const queryParams = { ...req.query, ...req.body };
    const result = await productService.getMarketplaceProducts(queryParams);
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Marketplace products retrieved successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

// ── 7. Public / Protected: Get Product details by slug ────────
export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await productService.getProductBySlug(req.params.slug, req.user);
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Product details retrieved successfully",
      product
    );
  } catch (error) {
    next(error);
  }
};

// ── 8. Admin: Review Product (Approve / Reject) ───────────────
export const reviewProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await productService.reviewProduct(productId, req.body);
    const message = req.body.status === "approved" ? "Product approved successfully" : "Product rejected successfully";
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      message,
      product
    );
  } catch (error) {
    next(error);
  }
};
