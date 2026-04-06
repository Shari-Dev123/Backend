const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getAttendanceHistory,
  getAttendanceByDate
} = require('../controllers/attendanceController');
const { protect, adminOnly } = require('../Middleware/auth');
const { upload } = require('../Middleware/upload');

// Admin: get all workers' attendance for a specific date
// GET /api/attendance?date=YYYY-MM-DD
router.get('/', protect, adminOnly, getAttendanceByDate);

// Worker: check in with photo
router.post('/check-in', protect, upload.single('photo'), checkIn);

// Worker: check out with photo
router.post('/check-out', protect, upload.single('photo'), checkOut);

// Worker/Admin: attendance history with optional filters
router.get('/history', protect, getAttendanceHistory);

module.exports = router;