const express = require('express');
const router = express.Router();
const {
  updateLocation,
  getWorkerLocations,
  getLocationHistory
} = require('../controllers/locationController');
const { protect, authorize } = require('../middleware/auth');

router.post('/update', protect, updateLocation);
router.get('/workers', protect, authorize('admin'), getWorkerLocations);
router.get('/history', protect, authorize('admin'), getLocationHistory);

module.exports = router;