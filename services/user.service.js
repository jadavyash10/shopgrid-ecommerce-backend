import User from "../models/user.model.js";
import Seller from "../models/seller.model.js";
import { ROLES, STATUS, HTTP_STATUS, DEFAULT_PAGE_SIZE } from "../utils/constant.js";
import {
  generateResetToken,
  hashToken,
  generateAccessToken,
  attachTokenToResponse,
} from "../utils/jwt.js";
import { sendResetPasswordEmail } from "../utils/email.js";
import { createError } from "../utils/javascript.js";

// ── Register ───────────────────────────────────────────────
export const register = async ({ name, email, password, role = ROLES.USER }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError("Email is already registered", HTTP_STATUS.CONFLICT);
  }

  const assignedRole = role === ROLES.SELLER ? ROLES.SELLER : ROLES.USER;
  const assignedStatus = assignedRole === ROLES.SELLER ? STATUS.PENDING : STATUS.APPROVED;

  // Role is either USER or SELLER — admin can never be created via API
  const user = await User.create({
    name,
    email,
    password,
    role: assignedRole,
    status: assignedStatus,
  });

  return user;
};

// ── Login ──────────────────────────────────────────────────
export const login = async ({ email, password }, res) => {
  const user = await User.findOne({ email }).select("+password");

  // Use a generic message — don't tell attacker which field is wrong
  if (!user || !(await user.comparePassword(password))) {
    throw createError("Invalid email or password", HTTP_STATUS.UNAUTHORIZED);
  }

  // Block inactive or pending accounts from logging in
  if (user.status === STATUS.INACTIVE) {
    throw createError(
      "Your account has been deactivated. Please contact support.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  if (user.status === STATUS.PENDING) {
    throw createError(
      "Your account is pending approval. Please wait for admin activation.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const token = generateAccessToken(user._id);
  attachTokenToResponse(res, token);

  return { token, user: user.toSafeObject() };
};

// ── Forgot Password ────────────────────────────────────────
export const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw createError("User with this email does not exist", HTTP_STATUS.NOT_FOUND);
  }

  if (user.status === STATUS.INACTIVE) {
    throw createError(
      "Your account has been deactivated. Please contact support.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  if (user.status === STATUS.PENDING) {
    throw createError(
      "Your account is pending approval. Please wait for admin activation.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const { resetToken, hashedToken, expireTime } = generateResetToken();

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = expireTime;
  await user.save({ validateBeforeSave: false });

  try {
    await sendResetPasswordEmail({
      email: user.email,
      name: user.name,
      resetToken,
    });
  } catch {
    // Rollback token fields if mail delivery fails
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw createError(
      "Failed to send reset email. Please try again.",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};

// ── Reset Password ─────────────────────────────────────────
export const resetPassword = async ({ token, password }) => {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }, // must not be expired
  }).select("+resetPasswordToken +resetPasswordExpire");

  if (!user) {
    throw createError(
      "Reset link is invalid or has expired",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return user;
};

// ── Change Password ────────────────────────────────────────
export const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await User.findById(userId).select("+password");

  if (!user || !(await user.comparePassword(oldPassword))) {
    throw createError("Incorrect old password", HTTP_STATUS.UNAUTHORIZED);
  }

  user.password = newPassword;
  await user.save();

  return user;
};

// ── Update Profile ──────────────────────────────────────────
export const updateProfile = async (userId, { name }) => {
  const user = await User.findById(userId);

  if (!user) {
    throw createError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  user.name = name;
  await user.save();

  // If user is a seller, update the name in Seller model too
  if (user.role === ROLES.SELLER) {
    await Seller.findByIdAndUpdate(
      user._id,
      { fullName: name },
      { runValidators: true },
    );
  }

  return user;
};

// ── Get All Users ────────────────────────────────────────────
export const getAllUsers = async (queryData) => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search, role, status } = queryData;
  const skip = (page - 1) * limit;

  const query = {};
  if (role) query.role = role;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const sort = { createdAt: -1 };

  const [users, total] = await Promise.all([
    User.find(query).sort(sort).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return {
    users: users.map((user) => user.toSafeObject()),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ── Get User By Id ───────────────────────────────────────────
export const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw createError("User not found", HTTP_STATUS.NOT_FOUND);
  }
  return user.toSafeObject();
};
