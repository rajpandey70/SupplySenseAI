const mongoose = require('mongoose');

const reportSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a report name'],
    },
    type: {
      type: String,
      required: [true, 'Please add a report type'],
      enum: ['Forecast', 'Inventory', 'Usage', 'Review', 'Summary'],
    },
    status: {
      type: String,
      enum: ['Completed', 'In Progress', 'Failed'],
      default: 'In Progress',
    },
    filePath: {
      type: String,
    },
    fileSize: {
      type: String,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Report', reportSchema);

