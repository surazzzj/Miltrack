require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 4000;

// Launch server immediately so cloud platforms (Render, Railway) detect the open port and mark service as live
const startServer = () => {
  try {
    const server = app.listen(PORT, () => {
      console.log(`[MILTRACK Gateway] Server active and listening on port ${PORT}`);
      console.log(`[MILTRACK Gateway] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[MILTRACK Gateway] Health check: http://localhost:${PORT}/health`);
      console.log(`[MILTRACK Gateway] API root: http://localhost:${PORT}/api`);
    });

    // Connect to database asynchronously in the background
    connectDB().catch((err) => {
      console.error(`[Database Startup Notice] Initial connect failed: ${err.message}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[MILTRACK Gateway] ${signal} received. Initiating graceful shutdown...`);
      server.close(() => {
        console.log('[MILTRACK Gateway] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error(`[Server Launch Error] Failed to boot: ${error.message}`);
    process.exit(1);
  }
};

startServer();
