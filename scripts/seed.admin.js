import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { MONGO_URL, ROLES, STATUS } from "../utils/constant.js";

// ── Admin credentials from .env ────────────────────────────
const ADMIN_SEED = {
  name: process.env.ADMIN_NAME || "Super Admin",
  email: process.env.ADMIN_EMAIL || "admin@shopgrid.com",
  password: process.env.ADMIN_PASSWORD || "Admin@123456", // override in .env!
  role: ROLES.ADMIN,
  status: STATUS.ACTIVE,
};

const isFresh = process.argv.includes("--fresh");

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URL);

    // ── --fresh flag: wipe existing admin first ────────────
    if (isFresh) {
      await User.deleteOne({ email: ADMIN_SEED.email });
    }

    // ── Check if admin already exists ─────────────────────
    const existing = await User.findOne({ email: ADMIN_SEED.email });
    if (existing) {
      console.log("✅ Admin already exists, skipping seeding.");
      return;
    }

    // ── Create admin ───────────────────────────────────────
    const admin = await User.create(ADMIN_SEED);
  } catch (err) {
    console.error("❌ Seeder failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 DB disconnected");
  }
};

seedAdmin();
