require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 4000;

// Connect Database and launch server
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`[MILTRACK Gateway] Server active and listening on port ${PORT}`);
      console.log(`[MILTRACK Gateway] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[MILTRACK Gateway] API root: http://localhost:${PORT}/api`);
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
