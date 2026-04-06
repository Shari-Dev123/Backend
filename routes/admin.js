// ✅ FIX: Converted from ES Module (import/export) to CommonJS (require/module.exports)
// to match rest of the backend
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../Middleware/auth');
const User = require('../models/User');
const Job = require('../models/Job');

// GET all pending workers (for approval)
router.get('/workers/pending', protect, adminOnly, async (req, res) => {
  try {
    const workers = await User.find({ role: 'field_worker', status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });
    return res.json({ success: true, count: workers.length, data: workers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET all workers
router.get('/workers', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { role: 'field_worker' };
    if (status) query.status = status;

    const workers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });
    return res.json({ success: true, count: workers.length, data: workers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST approve worker
router.post('/workers/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const worker = await User.findById(req.params.id);
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
    if (worker.role !== 'field_worker') return res.status(400).json({ success: false, message: 'User is not a field worker' });

    worker.status = 'approved';
    await worker.save();

    return res.json({ success: true, message: 'Worker approved successfully', data: worker });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST reject worker
router.post('/workers/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const worker = await User.findById(req.params.id);
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

    worker.status = 'rejected';
    await worker.save();

    return res.json({ success: true, message: 'Worker rejected', data: worker });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST suspend worker
router.post('/workers/:id/suspend', protect, adminOnly, async (req, res) => {
  try {
    const worker = await User.findById(req.params.id);
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

    worker.status = 'suspended';
    await worker.save();

    return res.json({ success: true, message: 'Worker suspended', data: worker });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET all jobs (admin view)
router.get('/jobs', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const jobs = await Job.find(query)
      .populate('assignedTo', 'name phone profileImage')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE worker
router.delete('/workers/:id', protect, adminOnly, async (req, res) => {
  try {
    const worker = await User.findById(req.params.id);
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
    if (worker.role !== 'field_worker') return res.status(400).json({ success: false, message: 'Not a field worker' });

    await User.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Worker deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


module.exports = router;