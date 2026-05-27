import * as invoiceService from "../services/invoice.service.js";
import { HTTP_STATUS } from "../utils/constant.js";
import { sendResponse } from "../utils/javascript.js";

/**
 * List all invoices (scoped by roles)
 */
export const getInvoices = async (req, res, next) => {
  try {
    const queryParams = req.body; // validateBody merges query + body into req.body
    const result = await invoiceService.getInvoices(queryParams, req.user);
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Invoices retrieved successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific invoice by ID
 */
export const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoice = await invoiceService.getInvoiceById(id, req.user);
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Invoice retrieved successfully",
      invoice
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update the status of a specific invoice (Admin/Operator only)
 */
export const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const invoice = await invoiceService.updateInvoiceStatus(id, updateData, req.user);
    const message = updateData.status === "completed" 
      ? "Invoice marked as COMPLETED and paid successfully" 
      : "Invoice reverted to PENDING state";

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      message,
      invoice
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Manually trigger invoice generation for a specific month and year (Admin/Operator only)
 */
export const triggerInvoiceGeneration = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    const result = await invoiceService.generateInvoices(month, year);
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      result.message,
      result
    );
  } catch (error) {
    next(error);
  }
};
