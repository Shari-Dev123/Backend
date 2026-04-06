import express from "express";
import multer from "multer";
import auth from "../Middleware/auth.js";
import Activity from "../models/Activity.js";
import User from "../models/User.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req,file,cb) => cb(null, "uploads/"),
  filename: (req,file,cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });


router.post("/status", auth, upload.single("image"), async (req, res) => {
  try {
    const { type, lat, lng, address } = req.body;
    if (!type) return res.status(400).json({ msg: "Missing type" });

    const loc = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng), address: address || "" } : undefined;

    const activity = new Activity({
      client: req.user.id,
      type,
      location: loc,
      imagePath: req.file ? req.file.path : undefined,
    });

    await activity.save();
    return res.json({ ok: true, activity });
  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
});


router.get("/activities/me", auth, async (req, res) => {
  try {
    const activities = await Activity.find({ client: req.user.id }).sort({ timestamp: -1 }).limit(200);
    return res.json(activities);
  } catch (err) {
    console.error(err); 
    return res.status(500).json({ msg: "Server error" });
  }
});

export default router;
