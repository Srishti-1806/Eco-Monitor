

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI ?? process.env.NEXT_PUBLIC_MONGODB_URI;
let isConnected = false;

const connectDB = async () => {
  if (!MONGODB_URI) {
    console.warn("MongoDB URI is not configured. Database operations will be disabled.");
    return false;
  }

  if (mongoose.connection.readyState >= 1) {
    isConnected = true;
    return true;
  }

  await mongoose.connect(MONGODB_URI);
  isConnected = true;
  console.log("✅ Connected to MongoDB");
  return true;
};

export default connectDB;
