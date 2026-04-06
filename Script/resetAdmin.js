import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { connectDB } from "../Config/db.js";

dotenv.config();

const run = async () => {
  await connectDB(process.env.MONGO_URI);
  
  const newPassword = "AdminPassword123!";
  const hashed = await bcrypt.hash(newPassword, 10);

  const admin = await User.findOneAndUpdate(
    { role: "admin" },
    { password: hashed },
    { new: true }
  );

  if (admin) {
    console.log("✅ Password reset ho gaya!");
    console.log("Email:", admin.email);
    console.log("Password:", newPassword);
  } else {
    console.log("❌ Koi admin nahi mila DB mein");
  }

  process.exit(0);
};

run();