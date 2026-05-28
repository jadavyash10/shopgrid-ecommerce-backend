import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import User from "../models/user.model.js";
import Seller from "../models/seller.model.js";
import { createError } from "../utils/javascript.js";
import { HTTP_STATUS, DEFAULT_PAGE_SIZE } from "../utils/constant.js";
import { deleteMediaFromCloudinary } from "../utils/cloudinary.js";

// Helper: Escape regex special characters to prevent RegExp injection/crashes
const escapeRegex = (string) => {
  if (!string) return "";
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
};

// Helper: Generate unique slug
const generateUniqueSlug = async (title) => {
  let baseSlug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (!baseSlug) {
    baseSlug = "product";
  }

  let uniqueSlug = baseSlug;
  let count = 1;
  while (await Product.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${baseSlug}-${count}`;
    count++;
  }
  return uniqueSlug;
};

// ── 1. Create Product ──────────────────────────────────────────
export const createProduct = async (productData, currentUser) => {
  // Validate category existence
  const categoryExists = await Category.findById(productData.category);
  if (!categoryExists) {
    throw createError("Category not found", HTTP_STATUS.BAD_REQUEST);
  }

  const slug = await generateUniqueSlug(productData.title);

  const productFields = {
    ...productData,
    slug,
    createdBy: currentUser._id,
    createdByRole: currentUser.role,
  };

  if (currentUser.role === "seller") {
    productFields.seller = currentUser._id;
    productFields.status = "pending_review";
  } else if (currentUser.role === "admin") {
    // Admin must supply a seller, otherwise default to admin user itself or throw error
    if (!productFields.seller) {
      throw createError("Seller ID is required for admin-created products", HTTP_STATUS.BAD_REQUEST);
    }
    
    // Database integrity: verify seller exists and has seller role
    // Support matching both User ID directly or Seller ID (resolving by email in case of mismatched seed IDs)
    let sellerUser = await User.findOne({ _id: productFields.seller, role: "seller" });
    if (!sellerUser) {
      const sellerDoc = await Seller.findById(productFields.seller);
      if (sellerDoc) {
        sellerUser = await User.findOne({ email: sellerDoc.email, role: "seller" });
      }
    }
    
    if (!sellerUser) {
      throw createError("Seller user not found", HTTP_STATUS.BAD_REQUEST);
    }
    
    productFields.seller = sellerUser._id;
    productFields.status = "approved";
  }

  const product = await Product.create(productFields);
  await product.populate([
    { path: "category", select: "name url" },
    { path: "seller", select: "name email" }
  ]);
  return product;
};

// ── 2. Update Product ──────────────────────────────────────────
export const updateProduct = async (productId, updateData, currentUser) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw createError("Product not found", HTTP_STATUS.NOT_FOUND);
  }

  // Seller authorization check
  if (currentUser.role === "seller" && product.seller.toString() !== currentUser._id.toString()) {
    throw createError("You are not authorized to update this product", HTTP_STATUS.FORBIDDEN);
  }

  // Handle category validation if category is being updated
  if (updateData.category) {
    const categoryExists = await Category.findById(updateData.category);
    if (!categoryExists) {
      throw createError("Category not found", HTTP_STATUS.BAD_REQUEST);
    }
  }

  // Handle title update -> re-slugify
  if (updateData.title && updateData.title.trim() !== product.title) {
    updateData.slug = await generateUniqueSlug(updateData.title);
  }

  // Seller Update Rule: If seller updates an already approved product, status goes back to pending_review
  if (currentUser.role === "seller") {
    if (product.status === "approved") {
      updateData.status = "pending_review";
      updateData.rejectionReason = null; // Clear previous rejection reason
    }
  }

  // Extract old variant media URLs for Cloudinary cleanup checking
  const oldMediaUrls = [];
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach((v) => {
      if (v.media && v.media.length > 0) {
        v.media.forEach((m) => {
          if (m.url) oldMediaUrls.push(m.url);
        });
      }
    });
  }

  // Apply updates
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined) {
      product[key] = updateData[key];
    }
  });

  await product.save();

  // If variants were modified, delete any removed media from Cloudinary asynchronously
  if (updateData.variants) {
    const newMediaUrls = [];
    product.variants.forEach((v) => {
      if (v.media && v.media.length > 0) {
        v.media.forEach((m) => {
          if (m.url) newMediaUrls.push(m.url);
        });
      }
    });

    const removedUrls = oldMediaUrls.filter((url) => !newMediaUrls.includes(url));
    if (removedUrls.length > 0) {
      // Async loop: does not delay the HTTP response
      removedUrls.forEach((url) => {
        deleteMediaFromCloudinary(url).catch((err) =>
          console.error("❌ Asynchronous media deletion failed:", err.message)
        );
      });
    }
  }

  await product.populate([
    { path: "category", select: "name url" },
    { path: "seller", select: "name email" }
  ]);
  return product;
};

// ── 3. Get Products (Unified for Admin / Seller) ────────────────
export const getProducts = async (queryParams, restrictToSellerId = null) => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search,
    status,
    seller,
    category,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = queryParams;

  let limitValue = Number(limit || DEFAULT_PAGE_SIZE);
  if (isNaN(limitValue) || limitValue < 1) {
    limitValue = DEFAULT_PAGE_SIZE;
  }

  const skip = (page - 1) * limitValue;
  const filter = {};

  if (restrictToSellerId) {
    filter.seller = restrictToSellerId;
  } else if (seller) {
    filter.seller = seller;
  }

  if (status) filter.status = status;

  if (category) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
    if (isObjectId) {
      filter.category = category;
    } else {
      const catDoc = await Category.findOne({
        $or: [
          { url: category.trim().toLowerCase() },
          { name: { $regex: `^${escapeRegex(category.trim())}$`, $options: "i" } }
        ]
      });
      if (catDoc) {
        filter.category = catDoc._id;
      } else {
        filter.category = "000000000000000000000000";
      }
    }
  }

  if (search) {
    const escapedSearch = escapeRegex(search.trim());
    const searchFilter = {
      $or: [
        { title: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
        { sku: { $regex: escapedSearch, $options: "i" } },
        { tags: { $in: [new RegExp(escapedSearch, "i")] } },
        { "variants.sku": { $regex: escapedSearch, $options: "i" } }
      ]
    };
    if (filter.$and) {
      filter.$and.push(searchFilter);
    } else {
      filter.$and = [searchFilter];
    }
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select("title slug sku basePrice stock category seller status isActive createdAt")
      .populate("category", "name url")
      .populate("seller", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limitValue),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      total,
      page: Number(page),
      limit: limitValue,
      totalPages: Math.ceil(total / limitValue),
    },
  };
};

// ── 5. Public: Get Marketplace Products ──────────────────────
export const getMarketplaceProducts = async (queryParams) => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search,
    category,
    sortBy = "createdAt",
    sortOrder = "desc",
    minPrice,
    maxPrice,
    inStock,
    ...dynamicAttributes
  } = queryParams;

  // Enforce minimum 20 items per page limit in backend
  let limitValue = Number(limit || 20);
  if (isNaN(limitValue) || limitValue < 20) {
    limitValue = 20;
  }

  const skip = (page - 1) * limitValue;

  // Marketplace rules: Only returns approved & active products
  const filter = {
    status: "approved",
    isActive: true,
  };

  if (category) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
    if (isObjectId) {
      filter.category = category;
    } else {
      const catDoc = await Category.findOne({
        $or: [
          { url: category.trim().toLowerCase() },
          { name: { $regex: `^${escapeRegex(category.trim())}$`, $options: "i" } }
        ]
      });
      if (catDoc) {
        filter.category = catDoc._id;
      } else {
        filter.category = "000000000000000000000000";
      }
    }
  }

  if (search) {
    const escapedSearch = escapeRegex(search.trim());
    const searchFilter = {
      $or: [
        { title: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
        { sku: { $regex: escapedSearch, $options: "i" } },
        { tags: { $in: [new RegExp(escapedSearch, "i")] } },
        { "variants.sku": { $regex: escapedSearch, $options: "i" } }
      ]
    };
    if (filter.$and) {
      filter.$and.push(searchFilter);
    } else {
      filter.$and = [searchFilter];
    }
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.basePrice = {};
    if (minPrice !== undefined && minPrice !== "") filter.basePrice.$gte = Number(minPrice);
    if (maxPrice !== undefined && maxPrice !== "") filter.basePrice.$lte = Number(maxPrice);
  }

  if (inStock === "true" || inStock === true) {
    const stockFilter = {
      $or: [
        { stock: { $gt: 0 } },
        { "variants.stock": { $gt: 0 } }
      ]
    };
    if (filter.$and) {
      filter.$and.push(stockFilter);
    } else {
      filter.$and = [stockFilter];
    }
  }

  // Extract dynamic attributes and construct high-performance searchableAttributes query
  const reservedKeys = [
    "page",
    "limit",
    "search",
    "category",
    "sortBy",
    "sortOrder",
    "minPrice",
    "maxPrice",
    "inStock"
  ];
  const attrFilters = [];

  Object.entries(dynamicAttributes).forEach(([key, value]) => {
    if (!reservedKeys.includes(key) && value !== undefined && value !== "") {
      attrFilters.push({
        $elemMatch: { key, value: String(value) },
      });
    }
  });

  if (attrFilters.length > 0) {
    filter.searchableAttributes = { $all: attrFilters };
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name url")
      .populate("seller", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limitValue),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      total,
      page: Number(page),
      limit: limitValue,
      totalPages: Math.ceil(total / limitValue),
    },
  };
};

// ── 6. Public / Protected: Get Product details by slug ────────
export const getProductBySlug = async (slug, currentUser = null) => {
  const product = await Product.findOne({ slug })
    .populate("category", "name url")
    .populate("seller", "name email");

  if (!product) {
    throw createError("Product not found", HTTP_STATUS.NOT_FOUND);
  }

  // If product is not fully approved & active, only allow the owner or an admin to view it
  const isApprovedAndActive = product.status === "approved" && product.isActive;
  if (!isApprovedAndActive) {
    const sellerId = product.seller._id || product.seller;
    const isOwner = currentUser && sellerId.toString() === currentUser._id.toString();
    const isAdmin = currentUser && currentUser.role === "admin";
    if (!isOwner && !isAdmin) {
      throw createError("Product not found", HTTP_STATUS.NOT_FOUND);
    }
  }

  return product;
};

// ── 7. Admin: Review Product (Approve / Reject) ───────────────
export const reviewProduct = async (productId, { status, rejectionReason }) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw createError("Product not found", HTTP_STATUS.NOT_FOUND);
  }

  product.status = status;
  if (status === "rejected") {
    product.rejectionReason = rejectionReason;
  } else if (status === "approved") {
    product.rejectionReason = null; // Clear if previously rejected
  }

  await product.save();
  return product;
};
