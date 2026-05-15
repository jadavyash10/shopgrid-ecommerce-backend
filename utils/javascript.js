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
