// src/utils/logger.js

const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// -------------------------------------------
// Custom console format (human-readable, colored)
// -------------------------------------------
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] ${level}: ${stack || message}`;
});

// -------------------------------------------
// Logger instance
// -------------------------------------------
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // capture stack traces for Error objects
    json()
  ),
  defaultMeta: { service: 'grocery-backend' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  // Don't crash the app if logging itself throws an error
  exitOnError: false,
});

// -------------------------------------------
// Console transport (only in non-production for readability)
// -------------------------------------------
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat
      ),
    })
  );
} else {
  // In production, still log to console (Render/Railway capture stdout),
  // but in JSON format for structured log aggregation.
  logger.add(
    new winston.transports.Console({
      format: combine(timestamp(), json()),
    })
  );
}

// -------------------------------------------
// Stream object for Morgan (HTTP request logging) to use
// -------------------------------------------
logger.stream = {
  write: (message) => logger.info(message.trim()),
};

module.exports = logger;