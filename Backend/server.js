// server.js

require('dotenv').config({ quiet: true });

const app = require('./src/app');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// -------------------------------------------
// Handle uncaught synchronous exceptions
// (e.g., accessing a property of undefined outside a promise)
// These are serious — the process is in an unknown state,
// so we log and exit; a process manager (PM2/Render/Railway) restarts it.
// -------------------------------------------
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION! Shutting down...`);
  logger.error(`${err.name}: ${err.message}\n${err.stack}`);
  process.exit(1);
});

let server;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB first
    await connectDB();

    // 2. Only start listening once DB connection is confirmed
    server = app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// -------------------------------------------
// Handle unhandled promise rejections
// (e.g., a DB query rejects and nothing catches it)
// -------------------------------------------
process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION! Shutting down...`);
  logger.error(`${err.name}: ${err.message}\n${err.stack}`);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// -------------------------------------------
// Graceful shutdown on termination signals
// (Render/Railway send SIGTERM before restarting/redeploying)
// -------------------------------------------
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      logger.info('Process terminated.');
    });
  }
});