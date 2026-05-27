import { Router } from "express";
import * as invoiceController from "../controllers/invoice.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validateBody } from "../middleware/validateBody.js";
import { ROLES } from "../utils/constant.js";
import {
  queryInvoicesSchema,
  updateInvoiceStatusSchema,
  manualGenerateSchema,
} from "../validations/invoice.validation.js";

export default (app) => {
  const router = Router();

  // Apply authentication for all invoice routes (Accessible only by Admin, Operator, or Seller)
  router.use(authenticate([ROLES.ADMIN, ROLES.OPERATOR, ROLES.SELLER]));

  // Retrieve invoices list (Sellers see their own, Admin/Operators see all)
  router.get(
    "/",
    validateBody(queryInvoicesSchema),
    invoiceController.getInvoices
  );

  // Retrieve details of a single invoice by ID
  router.get(
    "/:id",
    invoiceController.getInvoiceById
  );

  // Update status (mark complete/pending) - Admin and Operator only
  router.patch(
    "/:id/status",
    authenticate([ROLES.ADMIN, ROLES.OPERATOR]),
    validateBody(updateInvoiceStatusSchema),
    invoiceController.updateInvoiceStatus
  );

  // Manually trigger monthly invoice generation - Admin and Operator only
  router.post(
    "/generate",
    authenticate([ROLES.ADMIN, ROLES.OPERATOR]),
    validateBody(manualGenerateSchema),
    invoiceController.triggerInvoiceGeneration
  );

  // Mount router onto the main API namespace
  app.use("/invoices", router);
};
