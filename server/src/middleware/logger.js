const apiLogger = (req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;

  res.end = function (...args) {
    const duration = Date.now() - start;
    const userDisplay = req.user ? `[User:${req.user.email} (${req.user.role})]` : '[Unauthenticated]';
    // Sanitized logging: do not log credentials
    console.log(
      `[API] ${req.method} ${req.originalUrl || req.url} -> ${res.statusCode} (${duration}ms) ${userDisplay}`
    );
    originalEnd.apply(res, args);
  };

  next();
};

module.exports = { apiLogger };
