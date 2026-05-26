import { uploadSingleMediaToCloudinary } from "../utils/cloudinary.js";
import { HTTP_STATUS } from "../utils/constant.js";
import { sendResponse, createError } from "../utils/javascript.js";

export const uploadMedia = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      throw createError("No file uploaded. Please upload a file.", HTTP_STATUS.BAD_REQUEST);
    }

    // Determine custom folder on Cloudinary or default to general folder
    const customFolder = req.body.folder ? `shopgrid/${req.body.folder.trim()}` : "shopgrid/general";

    // Upload to Cloudinary
    const result = await uploadSingleMediaToCloudinary(file, customFolder);

    if (!result || !result.url) {
      throw createError("Failed to upload file to Cloudinary.", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return sendResponse(res, HTTP_STATUS.OK, "File uploaded successfully", {
      url: result.url,
      type: result.type,
    });
  } catch (error) {
    next(error);
  }
};
