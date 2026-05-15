import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

const loadRoutes = async () => {
  const routesFolderPath = __dirname;

  const files = fs
    .readdirSync(routesFolderPath)
    .filter((file) => file.endsWith(".js") && file !== "index.js");

  const importPromises = files.map(async (file) => {
    const filePath = path.join(routesFolderPath, file);
    try {
      const routeModule = await import(`file://${filePath}`);
      if (typeof routeModule.default === "function") {
        // pass the sub-router to the route module
        routeModule.default(router);
      } else {
        console.warn(`Warning: ${file} does not export a default function.`);
      }
    } catch (error) {
      console.error(`Error loading route file ${file}:`, error);
    }
  });

  await Promise.all(importPromises);
};

await loadRoutes(); // run loader on import

export default router;
