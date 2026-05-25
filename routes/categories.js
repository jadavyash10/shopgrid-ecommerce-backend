import { Router } from "express";
import * as categoryController from "../controllers/category.controller.js";
import { upload } from "../middleware/upload.js";
import { validateBody } from "../middleware/validateBody.js";
import { authenticate } from "../middleware/auth.js";
import { ROLES } from "../utils/constant.js";
import {
  createCategorySchema,
  updateCategorySchema,
  listCategoryQuerySchema,
} from "../validations/category.validation.js";

export default (app) => {
  const router = Router();

  router.get(
    "/",
    validateBody(listCategoryQuerySchema),
    categoryController.getAllCategories,
  );

  router.get("/url/:url", categoryController.getCategoryByUrl);

  router.get("/:id", categoryController.getCategoryById);

  router.post(
    "/",
    authenticate(ROLES.ADMIN),
    upload.single("bannerImage"),
    validateBody(createCategorySchema),
    categoryController.createCategory,
  );

  router.put(
    "/:id",
    authenticate(ROLES.ADMIN),
    upload.single("bannerImage"),
    validateBody(updateCategorySchema),
    categoryController.updateCategory,
  );

  router.delete(
    "/:id",
    authenticate(ROLES.ADMIN),
    categoryController.deleteCategory,
  );

  app.use("/categories", router);
};
