import mongoose from "mongoose";
import Review from "../models/review.model.js";
import Booking from "../models/booking.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import { createError } from "../utils/javascript.js";
import { HTTP_STATUS, DEFAULT_PAGE_SIZE } from "../utils/constant.js";

// Helper: Recalculate averageRating and numOfReviews on Product
export const updateProductRatingMetrics = async (productId) => {
  try {
    const result = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          status: "approved",
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          numOfReviews: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      const averageRating = Number(result[0].averageRating.toFixed(1));
      const numOfReviews = result[0].numOfReviews;
      await Product.findByIdAndUpdate(productId, { averageRating, numOfReviews });
    } else {
      await Product.findByIdAndUpdate(productId, { averageRating: 0, numOfReviews: 0 });
    }
  } catch (error) {
    console.error("❌ Failed to update product rating metrics:", error.message);
  }
};

// Verify booking and retrieve review-specific information
export const getReviewBookingInfo = async (bookingId) => {
  const booking = await Booking.findById(bookingId).populate("product");
  if (!booking) {
    throw createError("Booking order not found", HTTP_STATUS.NOT_FOUND);
  }

  // Ensure product reference exists
  if (!booking.product) {
    throw createError("Associated product not found", HTTP_STATUS.NOT_FOUND);
  }

  // Check if booking is in eligible status for review (approved or paid)
  const isEligible = booking.status === "approved" || booking.paymentStatus === "paid";
  if (!isEligible) {
    throw createError(
      "Only approved or paid product bookings can be reviewed",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Check if already reviewed (customers can only submit one review per booking/URL)
  const existingReview = await Review.findOne({ booking: bookingId });

  return {
    booking,
    product: booking.product,
    alreadyReviewed: !!existingReview,
  };
};

// Customer writes a review via booking link
export const createCustomerReview = async (reviewData, currentUser = null) => {
  const { bookingId, rating, comment, images } = reviewData;

  // Retrieve and validate booking details
  const { booking, product, alreadyReviewed } = await getReviewBookingInfo(bookingId);

  if (alreadyReviewed) {
    throw createError(
      "You have already submitted a review for this booking order. Reviews are limited to one time per transaction.",
      HTTP_STATUS.CONFLICT
    );
  }

  // Resolve reviewer name
  let reviewerName = "Guest Customer";
  if (currentUser) {
    reviewerName = currentUser.name;
  } else if (booking.guestName) {
    reviewerName = booking.guestName;
  }

  const reviewFields = {
    product: product._id,
    booking: booking._id,
    user: currentUser ? currentUser._id : null,
    seller: product.seller,
    name: reviewerName,
    rating,
    comment,
    images: images || [],
    status: "pending", // Customer reviews must go through admin moderation
  };

  const review = await Review.create(reviewFields);
  return review;
};

// Admin writes a review directly by selecting a product
export const createAdminReview = async (reviewData, currentAdmin) => {
  const { productId, name, rating, comment, images } = reviewData;

  const product = await Product.findById(productId);
  if (!product) {
    throw createError("Product not found", HTTP_STATUS.NOT_FOUND);
  }

  const reviewFields = {
    product: product._id,
    booking: null, // Admin-created direct reviews have no booking
    user: currentAdmin._id,
    seller: product.seller,
    name,
    rating,
    comment,
    images: images || [],
    status: "approved", // Admin-created reviews are auto-approved
    approvedAt: new Date(),
  };

  const review = await Review.create(reviewFields);

  // Auto-approved! Recalculate metrics immediately
  await updateProductRatingMetrics(product._id);

  return review;
};

// Retrieve paginated reviews (Admin sees all, Seller strictly sees reviews of their products)
export const getReviews = async (queryParams, currentUser) => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    status,
    product,
    seller,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = queryParams;

  let limitValue = Number(limit || 20);
  if (isNaN(limitValue) || limitValue < 20) {
    limitValue = 20; // Enforce minimum page size of 20 items
  }

  const skip = (page - 1) * limitValue;
  const filter = {};

  // Role restriction checks
  if (currentUser.role === "seller") {
    filter.seller = currentUser._id; // Sellers strictly restricted to their own products' reviews
  } else {
    // Admins can filter by any seller
    if (seller) filter.seller = seller;
  }

  if (status) filter.status = status;
  if (product) filter.product = product;

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("product", "title sku slug basePrice")
      .populate("user", "name email role")
      .sort(sort)
      .skip(skip)
      .limit(limitValue),
    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    pagination: {
      total,
      page: Number(page),
      limit: limitValue,
      totalPages: Math.ceil(total / limitValue),
    },
  };
};

// Public endpoint: retrieve approved reviews for a product (via product slug or ID)
export const getProductReviews = async (productSlugOrId, queryParams) => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE } = queryParams;

  let limitValue = Number(limit || 20);
  if (isNaN(limitValue) || limitValue < 20) {
    limitValue = 20;
  }

  const skip = (page - 1) * limitValue;

  // Resolve product
  let productFilter = {};
  if (mongoose.Types.ObjectId.isValid(productSlugOrId)) {
    productFilter = { _id: productSlugOrId };
  } else {
    productFilter = { slug: productSlugOrId };
  }

  const product = await Product.findOne(productFilter);
  if (!product) {
    throw createError("Product not found", HTTP_STATUS.NOT_FOUND);
  }

  // Get approved reviews only
  const filter = {
    product: product._id,
    status: "approved",
  };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitValue),
    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    pagination: {
      total,
      page: Number(page),
      limit: limitValue,
      totalPages: Math.ceil(total / limitValue),
    },
  };
};

// Admin reviews status (Approve or Reject)
export const updateReviewStatus = async (reviewId, statusData) => {
  const { status, rejectionReason } = statusData;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw createError("Review not found", HTTP_STATUS.NOT_FOUND);
  }

  review.status = status;
  if (status === "approved") {
    review.approvedAt = new Date();
    review.rejectionReason = null;
  } else if (status === "rejected") {
    review.rejectionReason = rejectionReason;
    review.approvedAt = null;
  }

  await review.save();

  // Recalculate rating metrics on the product
  await updateProductRatingMetrics(review.product);

  return review;
};

// Admin modifies review content (edit comment / rating stars)
export const updateReviewContent = async (reviewId, contentData) => {
  const { rating, comment, images } = contentData;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw createError("Review not found", HTTP_STATUS.NOT_FOUND);
  }

  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  if (images !== undefined) review.images = images;

  await review.save();

  // If review is currently approved, we need to update rating metrics immediately
  if (review.status === "approved") {
    await updateProductRatingMetrics(review.product);
  }

  return review;
};
