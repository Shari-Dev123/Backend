const Attendance = require('../models/Attendance');
const Job = require('../models/Job');
const User = require('../models/User');
const geolib = require('geolib');

exports.checkIn = async (req, res) => {
  try {
    const { jobId, coordinates, timestamp, timezone } = req.body;
    const photo = req.file?.path;

    if (!photo) {
      return res.status(400).json({
        success: false,
        message: 'Photo is required'
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const distance = geolib.getDistance(
      { latitude: coordinates[1], longitude: coordinates[0] },
      { latitude: job.location.coordinates[1], longitude: job.location.coordinates[0] }
    );

    const locationMatched = distance <= job.location.radius;

    const attendance = await Attendance.create({
      worker: req.user.id,
      job: jobId,
      type: 'check_in',
      location: {
        coordinates,
        address: job.location.address
      },
      photo,
      deviceInfo: req.body.deviceInfo,
      verification: {
        locationMatched,
        confidenceScore: req.body.confidenceScore || 0
      },
      metadata: {
        timestamp,
        timezone
      }
    });

    job.status = 'active';
    job.checkInTime = new Date();
    await job.save();

    res.status(201).json({
      success: true,
      data: attendance,
      locationMatched,
      distance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const { jobId, coordinates, timestamp, timezone } = req.body;
    const photo = req.file?.path;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const distance = geolib.getDistance(
      { latitude: coordinates[1], longitude: coordinates[0] },
      { latitude: job.location.coordinates[1], longitude: job.location.coordinates[0] }
    );

    const attendance = await Attendance.create({
      worker: req.user.id,
      job: jobId,
      type: 'check_out',
      location: {
        coordinates,
        address: job.location.address
      },
      photo,
      deviceInfo: req.body.deviceInfo,
      verification: {
        locationMatched: distance <= job.location.radius,
        confidenceScore: req.body.confidenceScore || 0
      },
      metadata: {
        timestamp,
        timezone
      }
    });

    job.status = 'completed';
    job.checkOutTime = new Date();
    await job.save();

    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAttendanceHistory = async (req, res) => {
  try {
    const { jobId, startDate, endDate } = req.query;
    const query = {};

    if (req.user.role === 'field_worker') {
      query.worker = req.user.id;
    }

    if (jobId) query.job = jobId;

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('worker', 'name profileImage')
      .populate('job', 'title location')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/attendance?date=YYYY-MM-DD
// Returns all workers with their check-in/out records for the given date
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date query parameter is required (YYYY-MM-DD)'
      });
    }

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    // Fetch all approved field workers
    const workers = await User.find({ role: 'field_worker', approved: true }).select('name email phone');

    // Fetch all attendance records for that day
    const records = await Attendance.find({
      'metadata.timestamp': { $gte: start, $lte: end }
    })
      .populate('worker', 'name email')
      .populate('job', 'title location');

    // Build one summary entry per worker
    const result = workers.map(worker => {
      const workerRecords = records.filter(
        r => r.worker?._id?.toString() === worker._id.toString()
      )

      const checkInRecord  = workerRecords.find(r => r.type === 'check_in')
      const checkOutRecord = workerRecords.find(r => r.type === 'check_out')

      return {
        worker: {
          _id:   worker._id,
          name:  worker.name,
          email: worker.email
        },
        checkIn:  checkInRecord?.metadata?.timestamp  || null,
        checkOut: checkOutRecord?.metadata?.timestamp || null,
        location: checkInRecord?.location || null
      }
    })

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};