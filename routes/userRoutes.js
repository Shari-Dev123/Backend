const express = require('express');
const router = express.Router();
// ✅ FIX: Correct Middleware folder path (uppercase M)
const { protect, adminOnly } = require('../Middleware/auth');
const User = require('../models/User');

// GET all users — admin only
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { role, status } = req.query;
    const query = {};
    if (role)   query.role = role;
    if (status) query.status = status;

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single user
router.get('/:id', protect, async (req, res) => {
  try {
    // Worker can only see their own profile
    if (req.user.role === 'field_worker' && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE user profile
router.put('/:id', protect, async (req, res) => {
  try {
    // Worker can only update their own profile
    if (req.user.role === 'field_worker' && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Prevent role/status change by non-admin
    if (req.user.role !== 'admin') {
      delete req.body.role;
      delete req.body.status;
      delete req.body.password;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE user — admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;