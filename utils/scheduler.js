import cron from "node-cron";
import Invoice from "../models/invoice.model.js";
import { generateInvoices } from "../services/invoice.service.js";

/**
 * Executes a self-healing startup check.
 * If the current date is the 10th or later and no invoices exist for the previous month,
 * it runs the generation service automatically to prevent missed cycles due to downtime.
 */
const runSelfHealingCheck = async () => {
  try {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();

    if (currentDay >= 10) {
      let targetMonth = currentDate.getMonth(); // 0-11. (Month 0 is January, which makes previous month Dec (12))
      let targetYear = currentDate.getFullYear();

      if (targetMonth === 0) {
        targetMonth = 12;
        targetYear -= 1;
      }

      // Check if any invoices have been created for the target month/year
      const invoicesExist = await Invoice.exists({ month: targetMonth, year: targetYear });
      if (!invoicesExist) {
        console.log(`⚠️ [Scheduler] Self-Healing: Previous month invoices (${targetMonth}/${targetYear}) are missing. Initiating automatic backup run...`);
        const result = await generateInvoices(targetMonth, targetYear);
        console.log(`✅ [Scheduler] Self-Healing finished:`, result.message);
      } else {
        console.log(`ℹ️ [Scheduler] Self-Healing: Previous month invoices (${targetMonth}/${targetYear}) already present.`);
      }
    } else {
      console.log(`ℹ️ [Scheduler] Current day is ${currentDay} (less than 10). Automated invoice generation not yet due for this month.`);
    }
  } catch (error) {
    console.error("❌ [Scheduler] Self-Healing startup check encountered an error:", error);
  }
};

/**
 * Initializes all automated cron and scheduled jobs for the application.
 */
export const initScheduler = () => {
  console.log("⏰ [Scheduler] Initializing automated background cron tasks...");

  // Run on the 10th of every month at 00:00:00 (Server time)
  // Cron pattern: minute hour day-of-month month day-of-week
  cron.schedule("0 0 10 * *", async () => {
    console.log("⏰ [Scheduler] Triggered automated monthly billing cycle...");
    try {
      const currentDate = new Date();
      let targetMonth = currentDate.getMonth();
      let targetYear = currentDate.getFullYear();

      if (targetMonth === 0) {
        targetMonth = 12;
        targetYear -= 1;
      }

      console.log(`⏰ [Scheduler] Generating invoices for: ${targetMonth}/${targetYear}`);
      const result = await generateInvoices(targetMonth, targetYear);
      console.log(`✅ [Scheduler] Automated billing cycle completed successfully:`, result.message);
    } catch (error) {
      console.error("❌ [Scheduler] Automated monthly billing cycle failed:", error);
    }
  });

  console.log("⏰ [Scheduler] Monthly invoice generation job registered for date 10.");

  // Run self-healing check asynchronously on startup (delayed slightly to ensure DB connection is active)
  setTimeout(() => {
    runSelfHealingCheck();
  }, 5000);
};
