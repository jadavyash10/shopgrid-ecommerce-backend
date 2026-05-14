import "dotenv/config";
import "./config/db.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
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

app.get("/", (req, res) => {
  res.send("Server Running");
});

app.listen(PORT, () => {
  console.log(`Server started successfully on port ${PORT}`);
});
