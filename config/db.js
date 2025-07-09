import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let connection;

const connectDB = async () => {
  const connString = process.env.MONGO_URI;
  console.log("🚀 ~ connectDB ~ connString:", connString);

  if (!connString) {
    console.error(
      "MongoDB connection string is not defined in environment variables."
    );
    return;
  }

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
