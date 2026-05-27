import * as reviewService from "../services/review.service.js";
import { HTTP_STATUS } from "../utils/constant.js";
import { sendResponse } from "../utils/javascript.js";

// Retrieve booking and product info for a review link
export const getReviewBookingInfo = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const result = await reviewService.getReviewBookingInfo(bookingId);
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Booking details retrieved successfully for review submission",
      result
    );
  } catch (error) {
    next(error);
  }
};

// Customer creates a review via booking link
export const createCustomerReview = async (req, res, next) => {
  try {
    const review = await reviewService.createCustomerReview(req.body, req.user);
    return sendResponse(
      res,
      HTTP_STATUS.CREATED,
      "Review submitted successfully. It will be visible after admin review.",
      review
    );
  } catch (error) {
    next(error);
  }
};

// Admin creates a review directly
export const createAdminReview = async (req, res, next) => {
  try {
    const review = await reviewService.createAdminReview(req.body, req.user);
    return sendResponse(
      res,
      HTTP_STATUS.CREATED,
      "Admin direct review created and approved successfully",
      review
    );
  } catch (error) {
    next(error);
  }
};

// List all reviews (restricted by user role inside service layer)
export const getReviews = async (req, res, next) => {
  try {
    const queryParams = { ...req.query, ...req.body };
    const result = await reviewService.getReviews(queryParams, req.user);
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Reviews retrieved successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

// Get all approved reviews for a specific product publicly
export const getProductReviews = async (req, res, next) => {
  try {
    const { productSlugOrId } = req.params;
    const queryParams = { ...req.query, ...req.body };
    const result = await reviewService.getProductReviews(productSlugOrId, queryParams);
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Product reviews retrieved successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

// Admin updates review status (approves or rejects)
export const updateReviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await reviewService.updateReviewStatus(id, req.body);
    const message = req.body.status === "approved" ? "Review approved and rating updated" : "Review rejected successfully";
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      message,
      review
    );
  } catch (error) {
    next(error);
  }
};

// Admin edits a review's rating or comment
export const updateReviewContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await reviewService.updateReviewContent(id, req.body);
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Review content modified successfully",
      review
    );
  } catch (error) {
    next(error);
  }
};
