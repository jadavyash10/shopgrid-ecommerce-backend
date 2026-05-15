import * as userService from "../services/user.service.js";
import { sendResponse } from "../utils/javascript.js";
import { HTTP_STATUS, STATUS, ROLES } from "../utils/constant.js";

export const register = async (req, res, next) => {
  try {
    const user = await userService.register(req.body);

    const message =
      user.status === STATUS.PENDING
        ? "Account created successfully. Please wait for admin approval."
        : "Account created successfully.";

    return sendResponse(res, HTTP_STATUS.CREATED, message, {
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const data = await userService.login(req.body, res); // res passed to attach cookie

    return sendResponse(res, HTTP_STATUS.OK, "Logged in successfully", data);
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    await userService.forgotPassword(req.body);

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "A password reset link has been sent to your email",
    );
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    await userService.resetPassword({
      token: req.params.token,
      password: req.body.password,
    });

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Password reset successfully. Please login with your new password.",
    );
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    await userService.changePassword(req.user._id, req.body);

    return sendResponse(res, HTTP_STATUS.OK, "Password changed successfully");
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user._id, req.body);

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Profile updated successfully",
      user.toSafeObject(),
    );
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { users, pagination } = await userService.getAllUsers({
      ...req.body,
      role: ROLES.USER,
    });

    return sendResponse(res, HTTP_STATUS.OK, "Users retrieved successfully", {
      users,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);

    return sendResponse(res, HTTP_STATUS.OK, "User retrieved successfully", user);
  } catch (err) {
    next(err);
  }
};
