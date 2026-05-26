import { Router } from "express";
import * as mediaController from "../controllers/media.controller.js";
import { uploadMediaMiddleware } from "../middleware/upload.js";

export default (app) => {
  const router = Router();

  // Accept single file upload under field name 'file'
  router.post("/upload", uploadMediaMiddleware.single("file"), mediaController.uploadMedia);

  // Register router to handle both /api/media/upload and /api/v1/media/upload paths
  app.use("/media", router);
  app.use("/v1/media", router);
};
