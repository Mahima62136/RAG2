const mongoose = require("mongoose");
require("dotenv").config();

/*
  Establishes a connection to MongoDB.
 */
const connectMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.warn("  [MongoDB] MONGODB_URI is missing in .env!");
      console.warn("Please update .env with your real MongoDB Atlas connection string.");
      process.exit(1);
    }
    
    console.log("[MongoDB] Connecting to Atlas database...");
    
    await mongoose.connect(mongoURI);
   

    console.log("✓ [MongoDB] Connected successfully.");
  } catch (error) {
    console.error(`✗ [MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectMongoDB;
