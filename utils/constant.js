export const ROLES = {
  USER: "user",
  SELLER: "seller",
  ADMIN: "admin",
};

export const COLLECTIONS = {
  USER: "users",
  SELLER: "sellers",
};

export const STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
  DRAFT: "draft",
  INACTIVE: "inactive",
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export const MONGO_URL = process.env.MONGO_URI;
export const PORT = process.env.PORT || 5000;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = "1d";
export const SALT_ROUNDS = 10;
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
export const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASS = process.env.EMAIL_PASS;
export const EMAIL_HOST = process.env.EMAIL_HOST;
export const EMAIL_PORT = process.env.EMAIL_PORT;
export const PASSWORD_RESET_TOKEN_EXPIRES_IN = 3600000; // 1 hour
export const ACCOUNT_ACTIVATION_TOKEN_EXPIRES_IN = 3600000; // 1 hour
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/gif",
];
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const CACHE_TTL = 60 * 60; // 1 hour
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100; // Max 100 requests per window per IP
export const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
export const CORS_METHODS = "GET,POST,PUT,DELETE,OPTIONS";
export const CORS_HEADERS = "Content-Type,Authorization";
export const CORS_CREDENTIALS = true;
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";
export const LOG_FILE = process.env.LOG_FILE || "app.log";
export const LOG_MAX_SIZE = 10 * 1024 * 1024; // 10MB
export const LOG_MAX_FILES = 5;
export const LOG_FORMAT = "combined";
export const LOG_COLORIZE = true;
export const LOG_TIMESTAMP = true;
export const LOG_JSON = false;
export const LOG_SILENCE = false;
export const LOG_ERROR_STACK = true;
export const LOG_UNCAUGHT_EXCEPTIONS = true;
export const LOG_UNHANDLED_REJECTIONS = true;
export const LOG_EXIT_ON_ERROR = true;
export const LOG_STREAMS = [
  {
    level: "info",
    stream: process.stdout,
  },
  {
    level: "error",
    stream: process.stderr,
  },
];
