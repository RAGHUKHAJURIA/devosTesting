const mongoose = require('mongoose');

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/blogapp';

  if (process.env.IN_DOCKER === 'true' && /localhost|127\.0\.0\.1/.test(uri)) {
    return uri.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal');
  }

  return uri;
};

const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;
  const mongoUri = getMongoUri();

  while (retries < maxRetries) {
    try {
      const conn = await mongoose.connect(mongoUri, {
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
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
};

module.exports = connectDB;
