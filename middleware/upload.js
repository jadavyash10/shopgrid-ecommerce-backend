import multer from "multer";
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from "../utils/constant.js";
import { createError } from "../utils/javascript.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError("Invalid file type. Only JPEG, PNG and GIF are allowed.", 400), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});
