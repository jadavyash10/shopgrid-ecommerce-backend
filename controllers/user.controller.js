import * as authService from "../services/user.service.js";
import { sendResponse } from "../utils/javascript.js";
import { HTTP_STATUS, STATUS } from "../utils/constant.js";

export const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);

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
    const data = await authService.login(req.body, res); // res passed to attach cookie

    return sendResponse(res, HTTP_STATUS.OK, "Logged in successfully", data);
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body);

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
    await authService.resetPassword({
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
