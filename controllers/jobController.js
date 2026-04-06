const Job = require('../models/Job');
const User = require('../models/User');
const geolib = require('geolib');

exports.createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      assignedTo,
      startTime,
      endTime,
      priority,
      instructions
    } = req.body;

    // Verify worker exists and is approved
    const worker = await User.findById(assignedTo);
    if (!worker || worker.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or unapproved worker'
      });
    }

    const job = await Job.create({
      title,
      description,
      location: {
        address: location.address,
        coordinates: location.coordinates,
        radius: location.radius || 100
      },
      assignedTo,
      createdBy: req.user.id,
      startTime,
      endTime,
      priority,
      instructions
    });

    // Populate and return
    await job.populate('assignedTo', 'name phone');
    
    // Emit to worker
    const io = req.app.get('io');
    io.to(assignedTo).emit('new-job', job);

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getJobs = async (req, res) => {
  try {
    let query = {};

    // If worker, only show their jobs
    if (req.user.role === 'field_worker') {
      query.assignedTo = req.user.id;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const jobs = await Job.find(query)
      .populate('assignedTo', 'name phone profileImage')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateJobStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const jobId = req.params.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Authorization check
    if (req.user.role === 'field_worker' && job.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    job.status = status;
    if (rejectionReason) job.rejectionReason = rejectionReason;
    
    if (status === 'accepted') {
      job.checkInTime = new Date();
    } else if (status === 'completed') {
      job.checkOutTime = new Date();
    }

    await job.save();

    // Notify admin
    const io = req.app.get('io');
    io.to(job.createdBy.toString()).emit('job-updated', job);

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.checkGeoFence = async (req, res) => {
  try {
    const { jobId, coordinates } = req.body;
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

    const isInside = distance <= job.location.radius;

    if (!isInside) {
      // Create alert
      job.alerts.push({
        type: 'geo_fence_breach',
        message: `Worker moved ${distance}m away from job location`
      });
      await job.save();

      // Notify admin
      const io = req.app.get('io');
      io.to(job.createdBy.toString()).emit('geo-fence-alert', {
        jobId,
        workerId: req.user.id,
        distance
      });
    }

    res.status(200).json({
      success: true,
      isInside,
      distance,
      radius: job.location.radius
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};