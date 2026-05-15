import { sendResponse } from "../utils/javascript.js";
import { HTTP_STATUS } from "../utils/constant.js";
import { verifyAccessToken } from "../utils/jwt.js";
import User from "../models/user.model.js";

export const authenticate =
  (role = "*") =>
  async (req, res, next) => {
    try {
      let token = req.headers.authorization;

      if (token && token.startsWith("Bearer ")) {
        token = token.split(" ")[1];
      }

      if (!token && req.cookies?.token) {
        token = req.cookies.token;
      }

      if (!token) {
        return sendResponse(res, HTTP_STATUS.UNAUTHORIZED, "Unauthorized!");
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return sendResponse(res, HTTP_STATUS.UNAUTHORIZED, "Unauthorized!");
      }

      req.user = user;
      
      if (role === "*") return next();
      else if (
        !!role?.length ? !role.includes(user.role) : role !== user.role
      ) {
        return sendResponse(res, HTTP_STATUS.UNAUTHORIZED, "Unauthorized!");
      }

      next();
    } catch (error) {
      console.log("Error in src > middleware > auth.js > authenticate", error);
      sendResponse(res, HTTP_STATUS.UNAUTHORIZED, "Unauthorized!");
    }
  };

export const optionalAuthenticate = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (token && token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // If token is invalid or any error occurs, just proceed without setting req.user
    next();
  }
};
