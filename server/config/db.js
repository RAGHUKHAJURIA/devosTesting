const mongoose = require('mongoose');

const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      retries++;
      console.error(`❌ MongoDB connection attempt ${retries} failed: ${error.message}`);
      if (retries === maxRetries) {
        console.error('💀 Max retries reached. Exiting...');
        process.exit(1);
      }
      // Wait 3 seconds before retrying
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
};

module.exports = connectDB;
