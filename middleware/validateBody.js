import { HTTP_STATUS } from "../utils/constant.js";
import { sendResponse } from "../utils/javascript.js";

export const validateBody = (schema) => (req, res, next) => {
  try {
    const data = { ...req.query, ...req.params, ...req.body }; // fixed: req.params (not req.param)

    const { error, value } = schema.validate(data, {
      abortEarly: false, // collect ALL errors at once
      stripUnknown: true, // strip fields not in schema
    });

    if (error) {
      const errors = {};
      error.details.forEach((d) => {
        errors[d.path.join(".")] = d.message.replace(/['"]/g, "");
      });

      return sendResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Validation failed asf",
        null,
        errors,
      );
    }

    req.body = value;
    next();
  } catch (err) {
    console.error("[validateBody]", err);
    return sendResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong, try again later!",
    );
  }
};
