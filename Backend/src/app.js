// src/app.js

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const sanitizeInput = require('./middlewares/sanitize.middleware');
const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const ApiResponse = require('./utils/apiResponse');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// =========================================
// SECURITY MIDDLEWARE
// =========================================

app.use(helmet());

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  process.env.ADMIN_URL || 'http://localhost:5173/admin',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(sanitizeInput);

// -------------------------------------------
// Rate Limiting
// -------------------------------------------
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api', globalLimiter);

// =========================================
// BODY PARSING MIDDLEWARE
// =========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// =========================================
// HTTP REQUEST LOGGING (Morgan piped to Winston)
// =========================================
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, { stream: logger.stream }));

// =========================================
// STATIC FILES
// =========================================
app.use('/uploads', express.static('uploads'));

// =========================================
// HEALTH CHECK ROUTE
// =========================================
app.get('/api/v1/health', (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
        },
        'Server is healthy and running'
      )
    );
});

// =========================================
// API ROUTES
// (Mount each route file here as we build it, module by module)
// =========================================
app.use('/api/v1/auth', require('./routes/auth.routes'));

app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/addresses', require('./routes/address.routes'));
app.use('/api/v1/categories', require('./routes/category.routes'));
// app.use('/api/v1/subcategories', require('./routes/subcategory.routes'));
// app.use('/api/v1/products', require('./routes/product.routes'));
// app.use('/api/v1/cart', require('./routes/cart.routes'));
// app.use('/api/v1/wishlist', require('./routes/wishlist.routes'));
// app.use('/api/v1/coupons', require('./routes/coupon.routes'));
// app.use('/api/v1/orders', require('./routes/order.routes'));
// app.use('/api/v1/payments', require('./routes/payment.routes'));
// app.use('/api/v1/reviews', require('./routes/review.routes'));
// app.use('/api/v1/banners', require('./routes/banner.routes'));
// app.use('/api/v1/notifications', require('./routes/notification.routes'));
// app.use('/api/v1/admin', require('./routes/admin.routes'));

// =========================================
// ERROR HANDLING (must be mounted LAST)
// =========================================
app.use(notFound);
app.use(errorHandler);

module.exports = app;