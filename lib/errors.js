export class BaseError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class APIError extends BaseError {
  constructor(statusCode, data) {
    const message = data?.message || `La petició API ha fallat amb estat ${statusCode}`;
    super(message, data?.code || 'API_ERROR', statusCode);
    this.details = data;
  }
}

export class AuthenticationError extends BaseError {
  constructor(message) {
    super(message, 'AUTH_ERROR', 401);
  }
}

export class ValidationError extends BaseError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class FileError extends BaseError {
  constructor(message) {
    super(message, 'FILE_ERROR', 500);
  }
}

export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  NETWORK_ERROR: 2,
  VALIDATION_ERROR: 3,
  API_ERROR: 4,
  FILE_ERROR: 5,
  AUTH_ERROR: 6
};