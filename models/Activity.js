import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  address: String
}, { _id: false });

const activitySchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["signup_request","login","heartbeat","job_arrival","logout","form_submission"], required: true },
  timestamp: { type: Date, default: Date.now },
  location: locationSchema,
  imagePath: String,
  formData: mongoose.Schema.Types.Mixed 
});

export default mongoose.model("Activity", activitySchema);
