import crypto from "crypto";

export const sendResponse = (
  res,
  statusCode,
  message,
  data = null,
  error = null,
) => {
  const response = { message };

  if (data) {
    response.data = data;
  }

  if (error) {
    response.error = error;
  }

  return res.status(statusCode).send(response);
};

export const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

export const generatePassword = (length = 8) => {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "@#$!%&*";
  const allChars = uppercase + lowercase + numbers + symbols;

  // Use crypto for secure random values
  const getSecureByte = () => crypto.randomBytes(1)[0];

  let password = "";
  // Ensure at least one of each type
  password += uppercase[getSecureByte() % uppercase.length];
  password += lowercase[getSecureByte() % lowercase.length];
  password += numbers[getSecureByte() % numbers.length];
  password += symbols[getSecureByte() % symbols.length];

  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += allChars[getSecureByte() % allChars.length];
  }

  // Shuffle securely
  return password
    .split("")
    .map((value) => ({ value, sort: getSecureByte() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
    .join("");
};


