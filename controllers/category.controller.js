import * as categoryService from "../services/category.service.js";
import { sendResponse } from "../utils/javascript.js";
import { HTTP_STATUS } from "../utils/constant.js";

export const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body, req.file);

    return sendResponse(
      res,
      HTTP_STATUS.CREATED,
      "Category created successfully",
      category,
    );
  } catch (err) {
    next(err);
  }
};

export const getAllCategories = async (req, res, next) => {
  try {
    const data = await categoryService.getAllCategories(req.body);

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Categories retrieved successfully",
      data,
    );
  } catch (err) {
    next(err);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Category retrieved successfully",
      category,
    );
  } catch (err) {
    next(err);
  }
};

export const getCategoryByUrl = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryByUrl(req.params.url);

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Category retrieved successfully",
      category,
    );
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.body,
      req.file,
    );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Category updated successfully",
      category,
    );
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await categoryService.deleteCategory(req.params.id);

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Category deleted successfully",
      category,
    );
  } catch (err) {
    next(err);
  }
};
