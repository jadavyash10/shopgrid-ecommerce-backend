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

export const uploadMediaMiddleware = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max size to allow videos
  },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    if (isImage || isVideo) {
      cb(null, true);
    } else {
      cb(createError("Invalid file type. Only standard images and videos are allowed.", 400), false);
    }
  },
});
