import Seller from "../models/seller.model.js";
import User from "../models/user.model.js";
import { uploadImagesToCloudinary } from "../utils/cloudinary.js";
import {
  DEFAULT_PAGE_SIZE,
  HTTP_STATUS,
  ROLES,
  STATUS,
} from "../utils/constant.js";
import {
  sendSellerApprovalEmail,
  sendSellerRejectionEmail,
  sendSellerSignupEmail,
  sendAdminCreatedSellerEmail,
} from "../utils/email.js";
import { createError, generatePassword } from "../utils/javascript.js";

// ── Signup ──────────────────────────────────────────────────
export const signup = async (data, files, isAdminCreate = false) => {
  const existingSeller = await Seller.findOne({ email: data.email });
  if (existingSeller) {
    throw createError(
      "Seller application with this email already exists",
      HTTP_STATUS.CONFLICT,
    );
  }

  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw createError(
      "Email is already registered as a user",
      HTTP_STATUS.CONFLICT,
    );
  }

  if (!files || files.length === 0) {
    throw createError(
      "At least one sample product image is required",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  // Upload images via Cloudinary
  const imageUrls = await uploadImagesToCloudinary(files);

  // Normalize categories if sent as a single string
  let productCategories = data.productCategories;
  if (typeof productCategories === "string") {
    try {
      productCategories = JSON.parse(productCategories);
    } catch (e) {
      productCategories = [productCategories];
    }
  }

  const seller = await Seller.create({
    ...data,
    productCategories,
    sampleProductImages: imageUrls,
    status: isAdminCreate ? STATUS.APPROVED : STATUS.PENDING,
    role: ROLES.SELLER,
    approvedAt: isAdminCreate ? new Date() : undefined,
  });

  if (isAdminCreate) {
    // Admin direct approval flow
    const generatedPassword = generatePassword();
    let newUser;
    try {
      // Create user in User model
      newUser = await User.create({
        _id: seller._id,
        name: seller.fullName,
        email: seller.email,
        password: generatedPassword,
        role: ROLES.SELLER,
        status: STATUS.APPROVED,
      });

      // Send email with credentials
      await sendAdminCreatedSellerEmail({
        email: seller.email,
        name: seller.fullName,
        password: generatedPassword,
      });
    } catch (error) {
      // Rollback on any failure
      if (newUser) await User.findByIdAndDelete(newUser._id);
      await Seller.findByIdAndDelete(seller._id);

      const errorMessage = error.message?.includes("email")
        ? "Failed to send approval email. Creation has been rolled back."
        : "Failed to create seller user account. Creation has been rolled back.";

      throw createError(errorMessage, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  } else {
    // Standard signup flow (Pending status)
    try {
      await sendSellerSignupEmail({
        email: seller.email,
        name: seller.fullName,
      });
    } catch (error) {
      // Rollback seller creation if email fails to keep system state consistent
      await Seller.findByIdAndDelete(seller._id);
      throw createError(
        "Failed to send confirmation email. Your application has not been processed. Please try again.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  }

  return seller;
};

// ── Get All Sellers ──────────────────────────────────────────
export const getAllSellers = async (queryData) => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search, status } = queryData;
  const skip = (page - 1) * limit;

  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$text = { $search: search };
  }

  const sort = { createdAt: -1 };

  const [sellers, total] = await Promise.all([
    Seller.find(query).sort(sort).skip(skip).limit(limit),
    Seller.countDocuments(query),
  ]);

  return {
    sellers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ── Get Seller By Id ─────────────────────────────────────────
export const getSellerById = async (id) => {
  const seller = await Seller.findById(id);
  if (!seller) {
    throw createError("Seller not found", HTTP_STATUS.NOT_FOUND);
  }
  return seller;
};

// ── Update Seller Status ─────────────────────────────────────
export const updateSellerStatus = async (id, status, reason) => {
  const seller = await getSellerById(id);

  if (seller.status === STATUS.APPROVED) {
    throw createError("Seller is already approved", HTTP_STATUS.BAD_REQUEST);
  }
  if (seller.status === STATUS.REJECTED) {
    throw createError("Seller is already rejected", HTTP_STATUS.BAD_REQUEST);
  }

  if (status === STATUS.APPROVED) {
    // Generate random secure and readable password
    const generatedPassword = generatePassword();

    // Create user in User model
    const newUser = await User.create({
      _id: seller._id,
      name: seller.fullName,
      email: seller.email,
      password: generatedPassword,
      role: ROLES.SELLER,
      status: STATUS.APPROVED,
    });

    // Update seller status
    seller.status = STATUS.APPROVED;
    seller.approvedAt = new Date();
    await seller.save();

    // Send email with credentials
    try {
      await sendSellerApprovalEmail({
        email: seller.email,
        name: seller.fullName,
        password: generatedPassword,
      });
    } catch (error) {
      // Rollback on email failure
      await User.findByIdAndDelete(newUser._id);
      seller.status = STATUS.PENDING;
      seller.approvedAt = undefined;
      await seller.save();
      throw createError(
        "Failed to send approval email. Approval has been rolled back.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  } else if (status === STATUS.REJECTED) {
    seller.status = STATUS.REJECTED;
    seller.rejectionReason = reason;
    await seller.save();

    try {
      await sendSellerRejectionEmail({
        email: seller.email,
        name: seller.fullName,
        reason,
      });
    } catch (error) {
      // Rollback on email failure
      seller.status = STATUS.PENDING;
      seller.rejectionReason = undefined;
      await seller.save();
      throw createError(
        "Failed to send rejection email. Rejection has been rolled back.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  }

  return seller;
};

// ── Update Seller ──────────────────────────────────────────
export const updateSeller = async (id, data, files) => {
  const seller = await Seller.findById(id);
  if (!seller) {
    throw createError("Seller not found", HTTP_STATUS.NOT_FOUND);
  }

  const { fullName, productCategories, ...otherData } = data;

  // 2. Handle Image Updates
  if (files && files.length > 0) {
    const imageUrls = await uploadImagesToCloudinary(files);
    seller.sampleProductImages = [...seller.sampleProductImages, ...imageUrls];
  }

  // 3. Update Text Fields
  if (fullName) seller.fullName = fullName;
  if (productCategories) {
    let categories = productCategories;
    if (typeof categories === "string") {
      try {
        categories = JSON.parse(categories);
      } catch (e) {
        categories = [categories];
      }
    }
    seller.productCategories = categories;
  }

  // Update other fields dynamically
  Object.keys(otherData).forEach((key) => {
    seller[key] = otherData[key];
  });

  await seller.save();

  // 4. Synchronize with User model if user exists
  const user = await User.findById(seller._id);
  if (user) {
    if (fullName) user.name = fullName;
    await user.save();
  }

  return seller;
};
