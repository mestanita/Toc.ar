const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  artistId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Artist', 
    required: true 
  },
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  reviewerName: { 
    type: String, 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String, 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);