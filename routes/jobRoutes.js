const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  updateJobStatus,
  checkGeoFence
} = require('../controllers/jobController');
// ✅ FIX: Import adminOnly (authorize was not exported from Middleware/auth.js correctly for this usage)
const { protect, adminOnly, authorize } = require('../Middleware/auth');

// Only admin can create jobs
router.post('/',                 protect, adminOnly, createJob);
// Both admin and worker can get jobs (controller filters by role)
router.get('/',                  protect, getJobs);
// Worker updates status (accept/reject), admin can also update
router.put('/:id/status',        protect, updateJobStatus);
// Geo-fence check (worker calls this)
router.post('/geo-fence-check',  protect, checkGeoFence);

module.exports = router;