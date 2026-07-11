// src/config/db.js

const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Establishes connection to MongoDB Atlas using Mongoose.
 * Includes connection event listeners for monitoring and
 * graceful shutdown handling for production reliability.
 */
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // Mongoose 8+ no longer needs useNewUrlParser / useUnifiedTopology,
            // but we set sensible production options below.
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000, // fail fast if cluster unreachable
            socketTimeoutMS: 45000,
            family: 4, // force IPv4, avoids some DNS issues on certain networks
        });

        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        logger.info(`Database Name: ${conn.connection.name}`);

        return conn;
    } catch (error) {
        logger.error(`MongoDB Connection Error: ${error.message}`);
        // Exit process with failure — no point running an API with no DB
        process.exit(1);
    }
};

// -------------------------------------------
// Connection Event Listeners (for monitoring)
// -------------------------------------------
mongoose.connection.on('connected', () => {
    logger.info('Mongoose connected to DB cluster');
});

mongoose.connection.on('error', (err) => {
    logger.error(`Mongoose connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose disconnected from DB cluster');
});

// -------------------------------------------
// Graceful Shutdown
// -------------------------------------------
// When the Node process is terminated (Ctrl+C, or hosting platform
// sending SIGTERM), close the Mongoose connection cleanly instead
// of leaving dangling connections on the Atlas cluster.
const gracefulShutdown = async (signal) => {
    try {
        await mongoose.connection.close();
        logger.info(`Mongoose connection closed due to app termination (${signal})`);
        process.exit(0);
    } catch (error) {
        logger.error(`Error during graceful shutdown: ${error.message}`);
        process.exit(1);
    }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = connectDB;