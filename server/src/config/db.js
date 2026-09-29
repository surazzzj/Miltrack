const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri && process.env.NODE_ENV === 'production') {
      console.error(
        '[Database Error] MONGO_URI environment variable is missing!\n' +
        '-> On Render, you must configure MONGO_URI in your Dashboard -> Environment with your cloud database URI (e.g. MongoDB Atlas).'
      );
      process.exit(1);
    }

    const uri = mongoUri || 'mongodb://127.0.0.1:27017/miltrack';
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    if (error.message.includes('ECONNREFUSED 127.0.0.1')) {
      console.error(
        '-> Render cannot connect to 127.0.0.1 (localhost). Please add your MongoDB Atlas connection string as MONGO_URI in the Render dashboard.'
      );
    }
    process.exit(1);
  }
};

module.exports = connectDB;
