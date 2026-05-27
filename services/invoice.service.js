import Invoice from "../models/invoice.model.js";
import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import { HTTP_STATUS } from "../utils/constant.js";
import { createError } from "../utils/javascript.js";

/**
 * Automatically generates invoices for a specific month and year.
 * Only processes approved bookings.
 * Overwrites pending invoices, but ignores completed ones.
 */
export const generateInvoices = async (month, year) => {
  const parsedMonth = Number(month);
  const parsedYear = Number(year);

  if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    throw createError("Invalid month provided for invoice generation", HTTP_STATUS.BAD_REQUEST);
  }
  if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
    throw createError("Invalid year provided for invoice generation", HTTP_STATUS.BAD_REQUEST);
  }

  // Calculate strict date boundaries for the UTC month
  const startDate = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(parsedYear, parsedMonth, 0, 23, 59, 59, 999));

  // Find all approved and paid bookings in this range
  const bookings = await Booking.find({
    createdAt: { $gte: startDate, $lte: endDate },
    status: "approved",
    paymentStatus: "paid",
  }).populate({
    path: "product",
    select: "seller title basePrice",
  });

  if (bookings.length === 0) {
    return {
      message: `No approved bookings found for ${parsedMonth}/${parsedYear}. No invoices generated.`,
      count: 0,
    };
  }

  // Group bookings by seller
  const sellerBookingsMap = {};
  for (const booking of bookings) {
    if (!booking.product || !booking.product.seller) {
      continue; // Skip bookings with missing products or sellers
    }
    const sellerId = booking.product.seller.toString();
    if (!sellerBookingsMap[sellerId]) {
      sellerBookingsMap[sellerId] = [];
    }
    sellerBookingsMap[sellerId].push(booking);
  }

  const generatedInvoices = [];

  for (const [sellerId, sellerBookings] of Object.entries(sellerBookingsMap)) {
    // Check if seller actually exists as an active user
    const sellerUser = await User.findById(sellerId);
    if (!sellerUser) continue;

    // Calculate sales totals
    const totalAmount = sellerBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const commissionAmount = Number((totalAmount * 0.10).toFixed(2)); // 10% commission
    const payoutAmount = Number((totalAmount - commissionAmount).toFixed(2));
    
    // Default to first booking currency or 'inr'
    const currency = sellerBookings[0].currency || "inr";
    const bookingIds = sellerBookings.map((b) => b._id);

    // Safeguard: Check if an invoice already exists for this seller/month/year
    const existingInvoice = await Invoice.findOne({
      seller: sellerId,
      month: parsedMonth,
      year: parsedYear,
    });

    if (existingInvoice) {
      if (existingInvoice.status === "completed") {
        // Skip generating if it is already manually completed/paid by Admin
        console.log(`Skipping invoice for seller ${sellerId} as it is already marked COMPLETED.`);
        continue;
      }
      // If it is pending, delete it first to recreate with latest booking counts and amounts
      await Invoice.findByIdAndDelete(existingInvoice._id);
    }

    const newInvoice = await Invoice.create({
      seller: sellerId,
      month: parsedMonth,
      year: parsedYear,
      bookings: bookingIds,
      totalAmount,
      commissionRate: 10,
      commissionAmount,
      payoutAmount,
      currency,
      status: "pending",
    });

    generatedInvoices.push(newInvoice);
  }

  return {
    message: `Successfully processed invoices for ${parsedMonth}/${parsedYear}`,
    count: generatedInvoices.length,
    invoices: generatedInvoices,
  };
};

/**
 * Retrieves paginated invoices, scoped by the user's role.
 */
export const getInvoices = async (queryParams, currentUser) => {
  const { page = 1, limit = 20, seller, month, year, status } = queryParams;
  const skip = (page - 1) * limit;

  const filter = {};

  // Permission Scoping
  if (currentUser.role === "admin" || currentUser.role === "operator") {
    // Admin and Operators can see all and optionally filter by seller ID
    if (seller) filter.seller = seller;
  } else if (currentUser.role === "seller") {
    // Sellers can ONLY see their own invoices
    filter.seller = currentUser._id;
  } else {
    // Normal users have no access to invoice system
    throw createError("You are not authorized to view invoices", HTTP_STATUS.FORBIDDEN);
  }

  // Common filters
  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);
  if (status) filter.status = status;

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate("seller", "name email status")
      .populate({
        path: "bookings",
        populate: [
          { path: "product", select: "title sku basePrice" },
          { path: "user", select: "name email" }
        ],
      })
      .sort({ year: -1, month: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Invoice.countDocuments(filter),
  ]);

  return {
    invoices,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Retrieves a single invoice by its ID.
 */
export const getInvoiceById = async (id, currentUser) => {
  const invoice = await Invoice.findById(id)
    .populate("seller", "name email status")
    .populate({
      path: "bookings",
      populate: [
        { path: "product", select: "title sku basePrice" },
        { path: "user", select: "name email" }
      ],
    });

  if (!invoice) {
    throw createError("Invoice not found", HTTP_STATUS.NOT_FOUND);
  }

  // Permission Scoping
  if (currentUser.role === "seller" && invoice.seller._id.toString() !== currentUser._id.toString()) {
    throw createError("You are not authorized to view this invoice", HTTP_STATUS.FORBIDDEN);
  } else if (currentUser.role !== "admin" && currentUser.role !== "operator" && currentUser.role !== "seller") {
    throw createError("You are not authorized to view invoices", HTTP_STATUS.FORBIDDEN);
  }

  return invoice;
};

/**
 * Updates invoice payment status manually.
 */
export const updateInvoiceStatus = async (id, updateData, adminUser) => {
  if (adminUser.role !== "admin" && adminUser.role !== "operator") {
    throw createError("Only administrators and operators can update invoice states", HTTP_STATUS.FORBIDDEN);
  }

  const { status, paymentReference, paymentNotes } = updateData;

  const invoice = await Invoice.findById(id);
  if (!invoice) {
    throw createError("Invoice not found", HTTP_STATUS.NOT_FOUND);
  }

  if (status === "completed") {
    invoice.status = "completed";
    invoice.paidAt = new Date();
    invoice.paymentReference = paymentReference;
    if (paymentNotes) invoice.paymentNotes = paymentNotes;
  } else {
    // Revert to pending
    invoice.status = "pending";
    invoice.paidAt = null;
    invoice.paymentReference = null;
    if (paymentNotes !== undefined) invoice.paymentNotes = paymentNotes;
  }

  await invoice.save();

  // Populate references for the final response
  return Invoice.findById(invoice._id)
    .populate("seller", "name email status")
    .populate({
      path: "bookings",
      populate: [
        { path: "product", select: "title sku basePrice" },
        { path: "user", select: "name email" }
      ],
    });
};
