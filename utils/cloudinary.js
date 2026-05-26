import { v2 as cloudinary } from "cloudinary";
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} from "./constant.js";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export const uploadImagesToCloudinary = async (files) => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "shopgrid/images" },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        },
      );

      // End the stream with the file buffer
      uploadStream.end(file.buffer);
    });
  });

  return await Promise.all(uploadPromises);
};

export const uploadSingleMediaToCloudinary = async (file, folder = "shopgrid/general") => {
  if (!file) return null;
  return new Promise((resolve, reject) => {
    const type = file.mimetype.startsWith("video/") ? "video" : "image";
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            type,
          });
        }
      }
    );
    uploadStream.end(file.buffer);
  });
};


export const uploadProductMediaToCloudinary = async (files) => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      const type = file.mimetype.startsWith("video/") ? "video" : "image";
      
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "shopgrid/products", resource_type: "auto" },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              type,
            });
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  });

  return await Promise.all(uploadPromises);
};

export const deleteMediaFromCloudinary = async (url) => {
  if (!url) return;

  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return;

    // Extract everything after /upload/v[number]/
    let publicIdWithExtParts = parts.slice(uploadIndex + 2);
    if (!parts[uploadIndex + 1].startsWith("v")) {
      publicIdWithExtParts = parts.slice(uploadIndex + 1);
    }

    const publicIdWithExt = publicIdWithExtParts.join("/");
    const lastDotIndex = publicIdWithExt.lastIndexOf(".");
    const publicId = lastDotIndex === -1 ? publicIdWithExt : publicIdWithExt.slice(0, lastDotIndex);

    // Auto-detect resource type from the URL string
    const isVideo = url.includes("/video/upload/");

    await cloudinary.uploader.destroy(publicId, { resource_type: isVideo ? "video" : "image" });
    console.log(`🧹 Cloudinary file successfully deleted: "${publicId}" (${isVideo ? "video" : "image"})`);
  } catch (error) {
    console.error("❌ Failed to delete Cloudinary media:", error.message);
  }
};
