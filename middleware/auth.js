import { sendResponse } from "../utils/javascript.js";
import { STATUS_CODES } from "../utils/constant.js";
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
        return sendResponse(res, STATUS_CODES.UNAUTHORIZED, "Unauthorized!");
      }

      const decoded = verifyAccessToken(token);
      req.user = decoded;

      const user = await User.findById(decoded.id);

      if (!user) {
        return sendResponse(res, STATUS_CODES.UNAUTHORIZED, "Unauthorized!");
      }

      if (role === "*") return next();
      else if (
        !!role?.length ? !role.includes(user.role) : role !== user.role
      ) {
        return sendResponse(res, STATUS_CODES.UNAUTHORIZED, "Unauthorized!");
      }

      next();
    } catch (error) {
      console.log("Error in src > middleware > auth.js > authenticate", error);
      sendResponse(res, STATUS_CODES.UNAUTHORIZED, "Unauthorized!");
    }
  };
