import Category from "../models/category.model.js";
import { uploadImagesToCloudinary, deleteMediaFromCloudinary } from "../utils/cloudinary.js";
import { DEFAULT_PAGE_SIZE, HTTP_STATUS } from "../utils/constant.js";
import { createError } from "../utils/javascript.js";

export const createCategory = async (data, file) => {
  if (!file) {
    throw createError("Banner image is required", HTTP_STATUS.BAD_REQUEST);
  }

  // Generate unique URL suffix like -c-1
  let finalUrl = data.url
    .trim()
    .toLowerCase()
    .replace(/-c-\d+$/, "");

  let count = await Category.countDocuments();
  let id = count + 1;
  let candidateUrl = `${finalUrl}-c-${id}`;

  // Keep incrementing ID until url is unique
  while (await Category.findOne({ url: candidateUrl })) {
    id++;
    candidateUrl = `${finalUrl}-c-${id}`;
  }

  data.url = candidateUrl;

  // Upload image to Cloudinary
  const imageUrls = await uploadImagesToCloudinary([file]);
  if (!imageUrls || imageUrls.length === 0) {
    throw createError(
      "Failed to upload banner image to Cloudinary",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  const category = await Category.create({
    ...data,
    bannerImage: imageUrls[0],
  });

  return category;
};

export const getAllCategories = async (queryData) => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = queryData;
  const skip = (page - 1) * limit;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [categories, total] = await Promise.all([
    Category.find(query).sort(sort).skip(skip).limit(limit),
    Category.countDocuments(query),
  ]);

  return {
    categories,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCategoryById = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw createError("Category not found", HTTP_STATUS.NOT_FOUND);
  }
  return category;
};

export const getCategoryByUrl = async (url) => {
  const category = await Category.findOne({ url });
  if (!category) {
    throw createError("Category not found", HTTP_STATUS.NOT_FOUND);
  }
  return category;
};

export const updateCategory = async (id, data, file) => {
  const category = await Category.findById(id);
  if (!category) {
    throw createError("Category not found", HTTP_STATUS.NOT_FOUND);
  }

  const suffixMatch = category.url.match(/-c-\d+$/);
  const originalSuffix = suffixMatch ? suffixMatch[0] : "";

  if (data.url && data.url !== category.url) {
    // Strip any existing -c-\d+ suffix from the incoming URL input
    let cleanedUrl = data.url
      .trim()
      .toLowerCase()
      .replace(/-c-\d+$/, "");

    // Re-apply the original suffix if it exists, otherwise find a new unique suffix
    let candidateUrl;
    if (originalSuffix) {
      candidateUrl = `${cleanedUrl}${originalSuffix}`;
    } else {
      let count = await Category.countDocuments();
      let id = count + 1;
      candidateUrl = `${cleanedUrl}-c-${id}`;
      while (await Category.findOne({ url: candidateUrl })) {
        id++;
        candidateUrl = `${cleanedUrl}-c-${id}`;
      }
    }

    // Ensure that the new URL is not taken by another category
    if (candidateUrl !== category.url) {
      const existingCategory = await Category.findOne({ url: candidateUrl });
      if (existingCategory) {
        throw createError("Category URL already exists", HTTP_STATUS.CONFLICT);
      }
    }

    data.url = candidateUrl;
  } else if (data.url === category.url) {
    delete data.url;
  }

  // If a new banner image is provided, upload it to Cloudinary
  if (file) {
    const oldBannerImage = category.bannerImage;
    const imageUrls = await uploadImagesToCloudinary([file]);
    if (imageUrls && imageUrls.length > 0) {
      category.bannerImage = imageUrls[0];
      if (oldBannerImage) {
        deleteMediaFromCloudinary(oldBannerImage).catch((err) =>
          console.error("❌ Asynchronous category image deletion failed:", err.message)
        );
      }
    } else {
      throw createError(
        "Failed to upload new banner image to Cloudinary",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Update text fields
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined) {
      category[key] = data[key];
    }
  });

  await category.save();
  return category;
};

export const deleteCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw createError("Category not found", HTTP_STATUS.NOT_FOUND);
  }

  const oldBannerImage = category.bannerImage;
  await Category.findByIdAndDelete(id);
  
  if (oldBannerImage) {
    deleteMediaFromCloudinary(oldBannerImage).catch((err) =>
      console.error("❌ Asynchronous category image deletion failed:", err.message)
    );
  }
  
  return category;
};
