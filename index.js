import cors from "cors";
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";
import routes from "./routes/index.js";
import { PORT } from "./utils/constant.js";

const app = express();

app.use(helmet()); // Sets secure HTTP headers

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*", // Restrict to your frontend URL
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parses form data

app.use(express.static("public")); // Serves files from /public folder

// ── Routes ───────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("Server Running");
});
app.use("/api", routes);

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server started successfully on port ${PORT}`);
});
