const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 *
 * On a serverless platform (Vercel) the same function instance is reused
 * for many requests, so we cache the connection on the Node global object
 * instead of opening a new one on every invocation.
 */
let cached = global.__mongo;
if (!cached) {
  cached = global.__mongo = { conn: null, promise: null };
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Add it to your environment (locally in .env, on Vercel in Project Settings -> Environment Variables).'
    );
  }

  // Reuse an existing (possibly in-flight) connection
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10000 })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow a retry on the next request
    throw err;
  }

  console.log(
    `MongoDB connected: ${cached.conn.connection.host}/${cached.conn.connection.name}`
  );
  return cached.conn;
};

module.exports = connectDB;
