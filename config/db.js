import mongoose from "mongoose";
import dotenv from "dotenv";
import { getString } from "../utils/env/env.js";

dotenv.config();

const connectionUrl = process.env.MONGO_URI;

let connection; // Declare a global variable to hold the connection

const connectDB = async () => {
  const connString = getString(
    "MONGO_URI",
    "mongodb://localhost:27017/auth-service"
  );
  try {
    mongoose.set("strictQuery", false);
    mongoose.set("strictPopulate", false);
    connection = await mongoose.connect(connString);
    console.log("MongoDB connection SUCCESS");
  } catch (error) {
    console.error("MongoDB connection FAIL");
    console.error(error);
    process.exit(1);
  }
};

export { connectDB, connection };
