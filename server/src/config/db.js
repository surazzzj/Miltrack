const mongoose = require('mongoose');

let isConnecting = false;
let retryTimeout = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn(
      '\n[Database Warning] MONGO_URI is not set in environment variables!\n' +
      '-> On Render, please add MONGO_URI in Dashboard -> Environment with your MongoDB Atlas URI.\n' +
      '-> The server will stay online and healthy, but database operations will return 503 until MONGO_URI is configured.\n'
    );
    return null;
  }

  try {
    isConnecting = true;
    console.log('[Database] Connecting to MongoDB...');
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    isConnecting = false;
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
    return conn;
  } catch (error) {
    isConnecting = false;
    console.error(`[Database Error] Connection failed: ${error.message}`);
    if (error.message.includes('ECONNREFUSED 127.0.0.1')) {
      console.warn(
        '-> Render cannot connect to 127.0.0.1 (localhost). Please add your MongoDB Atlas connection string as MONGO_URI in the Render dashboard.'
      );
    }

    if (!retryTimeout) {
      console.log('[Database] Will retry connection in 15 seconds...');
      retryTimeout = setTimeout(() => {
        retryTimeout = null;
        connectDB();
      }, 15000);
    }
    return null;
  }
};

module.exports = connectDB;
