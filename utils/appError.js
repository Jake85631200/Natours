class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // called constructor function of parent class: Error, this will set message as the message from Error

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
