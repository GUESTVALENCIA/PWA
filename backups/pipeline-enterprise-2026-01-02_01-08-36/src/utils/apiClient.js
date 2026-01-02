const config = require('../config/config');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);

    // Handle non-2xx responses
    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
            const errorData = await response.text();
             errorMessage += `: ${errorData}`;
        } catch (e) {
            // ignore
        }
      throw new AppError(errorMessage, response.status);
    }

    // Attempt to parse JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    // Fallback to text
    return await response.text();
  } catch (error) {
    throw error;
  }
};

module.exports = {
  handleRequest,
  AppError
};
