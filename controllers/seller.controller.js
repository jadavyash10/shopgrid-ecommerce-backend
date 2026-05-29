import * as sellerService from "../services/seller.service.js";
import { sendResponse } from "../utils/javascript.js";
import { HTTP_STATUS, ROLES, STATUS } from "../utils/constant.js";

export const signup = async (req, res, next) => {
  try {
    const files = req.files;
    const isAdminCreate = req.user?.role === ROLES.ADMIN;
    const seller = await sellerService.signup(req.body, files, isAdminCreate);

    return sendResponse(
      res,
      HTTP_STATUS.CREATED,
      "Seller application submitted successfully",
      seller,
    );
  } catch (err) {
    next(err);
  }
};

export const getAllSellers = async (req, res, next) => {
  try {
    const { sellers, pagination } = await sellerService.getAllSellers(req.body);

    return sendResponse(res, HTTP_STATUS.OK, "Sellers retrieved successfully", {
      sellers,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const getSellerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const seller = await sellerService.getSellerById(id);

    // Permission Check: Admin can view any; Seller can only view their own
    if (req.user.role === ROLES.SELLER && req.user.email !== seller.email) {
      return sendResponse(
        res,
        HTTP_STATUS.FORBIDDEN,
        "You are not authorized to view this seller's information",
      );
    }

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Seller retrieved successfully",
      seller,
    );
  } catch (err) {
    next(err);
  }
};

export const updateSellerStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const seller = await sellerService.updateSellerStatus(
      req.params.id,
      status,
      rejectionReason,
    );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      `Seller ${status} successfully`,
      seller,
    );
  } catch (err) {
    next(err);
  }
};

export const updateSeller = async (req, res, next) => {
  try {
    const { id } = req.params;
    const files = req.files;

    // Fetch seller to check permissions
    const seller = await sellerService.getSellerById(id);

    // Permission Check: Admin can update any; Seller can only update their own
    if (req.user.role === ROLES.SELLER && req.user.email !== seller.email) {
      return sendResponse(
        res,
        HTTP_STATUS.FORBIDDEN,
        "You are not authorized to update this seller's information",
      );
    }

    // Status Check: Admin can update PENDING/APPROVED; Seller only APPROVED
    if (req.user.role === ROLES.ADMIN) {
      if (![STATUS.PENDING, STATUS.APPROVED].includes(seller.status)) {
        return sendResponse(
          res,
          HTTP_STATUS.FORBIDDEN,
          `Admins can only update sellers with ${STATUS.PENDING} or ${STATUS.APPROVED} status`,
        );
      }
    } else {
      if (seller.status !== STATUS.APPROVED) {
        return sendResponse(
          res,
          HTTP_STATUS.FORBIDDEN,
          `Sellers can only update their information when their status is ${STATUS.APPROVED}`,
        );
      }
    }

    const updatedSeller = await sellerService.updateSeller(id, req.body, files);

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Seller information updated successfully",
      updatedSeller,
    );
  } catch (err) {
    next(err);
  }
};
