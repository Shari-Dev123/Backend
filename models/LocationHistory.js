const mongoose = require('mongoose');

const locationHistorySchema = new mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  coordinates: {
    type: [Number],
    required: true
  },
  accuracy: Number,
  speed: Number,
  heading: Number,
  batteryLevel: Number,
  timestamp: {
    type: Date,
    default: Date.now
  },
  isOffline: {
    type: Boolean,
    default: false
  }
});

locationHistorySchema.index({ coordinates: '2dsphere' });
locationHistorySchema.index({ worker: 1, timestamp: -1 });

module.exports = mongoose.model('LocationHistory', locationHistorySchema);