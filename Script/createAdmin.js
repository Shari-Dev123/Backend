import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { connectDB } from "../Config/db.js";

dotenv.config();
const run = async () => {
  await connectDB(process.env.MONGO_URI);
  
  // Delete existing admin if any
  await User.deleteOne({ email: "admin@example.com" });
  
  const hashed = await bcrypt.hash("AdminPassword123!", 10);
  const admin = new User({ 
    name: "System Admin", 
    email: "admin@example.com", 
    password: hashed, 
    role: "admin", 
    status: "approved",
    phone: "03001234567"
  });
  await admin.save();
  console.log("Admin created:", admin.email);
  process.exit(0);
};
run();