// src/middlewares/sanitize.middleware.js

const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return value
      .replace(/<script.*?>.*?<\/script>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')
      .replace(/javascript:/gi, '');
  }
  return value;
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return;

  Object.keys(obj).forEach((key) => {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
      return;
    }

    if (obj[key] && typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    } else {
      obj[key] = sanitizeValue(obj[key]);
    }
  });
};

const sanitizeInput = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  if (req.query) sanitizeObject(req.query);
  next();
};

module.exports = sanitizeInput;