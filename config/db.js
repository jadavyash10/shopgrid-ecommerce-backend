import mongoose from "mongoose";
import { MONGO_URL } from "../utils/constant.js";

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("Database Connection Established...🌟🌟");
  })
  .catch((error) => {
    console.log(error);
  });
