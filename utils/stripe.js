import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "./constant.js";

if (!STRIPE_SECRET_KEY) {
  console.warn("⚠️ Warning: STRIPE_SECRET_KEY is not defined in environment variables. Stripe integrations will fail at runtime.");
}

export const stripe = new Stripe(STRIPE_SECRET_KEY || "dummy_stripe_secret_key_so_app_does_not_fail_to_boot");
