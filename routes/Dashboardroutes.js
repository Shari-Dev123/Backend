const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../Middleware/auth');
const User = require('../models/User');
const Job = require('../models/Job');
const Attendance = require('../models/Attendance');

// GET admin dashboard stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    // ✅ FIX: role was 'guard' — correct role is 'field_worker'
    const totalWorkers = await User.countDocuments({ role: 'field_worker' });
    const totalJobs    = await Job.countDocuments();
    const activeJobs   = await Job.countDocuments({ status: 'active' });
    const pendingJobs  = await Job.countDocuments({ status: 'pending' });
    const completedJobs = await Job.countDocuments({ status: 'completed' });

    // ✅ FIX: Attendance uses 'timestamp' not 'date'
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.countDocuments({
      timestamp: { $gte: today }
    });

    // Online workers count
    const onlineWorkers = await User.countDocuments({
      role: 'field_worker',
      isOnline: true
    });

    // Pending approvals
    const pendingApprovals = await User.countDocuments({
      role: 'field_worker',
      status: 'pending'
    });

    res.json({
      success: true,
      data: {
        totalWorkers,
        totalJobs,
        activeJobs,
        pendingJobs,
        completedJobs,
        todayAttendance,
        onlineWorkers,
        pendingApprovals
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET recent activity (last 10 attendance records)
router.get('/activity', protect, adminOnly, async (req, res) => {
  try {
    // ✅ FIX: populate field was 'guard' — correct field is 'worker'
    const recentAttendance = await Attendance.find()
      .populate('worker', 'name email profileImage')
      .populate('job', 'title location')
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({ success: true, data: recentAttendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET workers list for dashboard
router.get('/workers', protect, adminOnly, async (req, res) => {
  try {
    const workers = await User.find({ role: 'field_worker' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: workers.length, data: workers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;