const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  type: {
    type: String,
    enum: ['check_in', 'check_out'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  location: {
    coordinates: {
      type: [Number],
      required: true
    },
    address: String
  },
  photo: {
    type: String,
    required: true
  },
  deviceInfo: {
    deviceId: String,
    model: String,
    os: String,
    isEmulator: Boolean
  },
  verification: {
    faceMatched: {
      type: Boolean,
      default: false
    },
    locationMatched: {
      type: Boolean,
      default: false
    },
    confidenceScore: Number
  },
  metadata: {
    timestamp: String, // Original timestamp from device
    timezone: String
  }
});

module.exports = mongoose.model('Attendance', attendanceSchema);