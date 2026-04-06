const LocationHistory = require('../models/LocationHistory');
const Job = require('../models/Job');
const User = require('../models/User');

exports.updateLocation = async (req, res) => {
  try {
    const { coordinates, accuracy, speed, heading, batteryLevel, jobId } = req.body;

    // Save location history
    const location = await LocationHistory.create({
      worker: req.user.id,
      job: jobId,
      coordinates,
      accuracy,
      speed,
      heading,
      batteryLevel
    });

    // Update user's current location
    await User.findByIdAndUpdate(req.user.id, {
      currentLocation: {
        type: 'Point',
        coordinates: coordinates
      },
      lastActive: new Date()
    });

    // Check geo-fence if job is active
    if (jobId) {
      const job = await Job.findById(jobId);
      if (job && job.status === 'active') {
        // Geo-fence check logic here (reuse from jobController)
      }
    }

    // Emit to admin
    const io = req.app.get('io');
    io.to('admin-room').emit('location-update', {
      workerId: req.user.id,
      coordinates,
      timestamp: new Date(),
      batteryLevel
    });

    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getWorkerLocations = async (req, res) => {
  try {
    const workers = await User.find(
      { role: 'field_worker', isOnline: true },
      'name currentLocation lastActive profileImage'
    );

    res.status(200).json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getLocationHistory = async (req, res) => {
  try {
    const { workerId, startDate, endDate } = req.query;
    
    const history = await LocationHistory.find({
      worker: workerId,
      timestamp: {
        $gte: new Date(startDate || Date.now() - 24 * 60 * 60 * 1000),
        $lte: new Date(endDate || Date.now())
      }
    }).sort({ timestamp: 1 });

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};