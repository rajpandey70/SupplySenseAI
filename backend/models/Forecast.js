const mongoose = require('mongoose');

const forecastSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    projectName: {
      type: String,
      required: [true, 'Please add a project name'],
    },
    budget: {
      type: Number,
      required: [true, 'Please add a budget'],
    },
    location: {
      type: String,
      required: [true, 'Please add a location'],
      enum: ['Northern Region', 'Southern Region', 'Eastern Region', 'Western Region', 'North-Eastern Region'],
    },
    towerType: {
      type: String,
      required: [true, 'Please add tower type'],
      enum: ['Transmission Tower', 'Distribution Tower', 'Sub-station Tower', 'Monopole Tower'],
    },
    substationType: {
      type: String,
      enum: ['Not Applicable', 'AIS (Air Insulated)', 'GIS (Gas Insulated)', 'Hybrid'],
      default: 'Not Applicable',
    },
    forecastPeriod: {
      type: String,
      enum: ['6 Months', '1 Year', '2 Years'],
      default: '1 Year',
    },
    taxRate: {
      type: Number,
      default: 18,
    },
    materials: [{
      material: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
      },
      quantity: Number,
      unit: String,
      unitCost: Number,
      totalCost: Number,
      confidence: Number,
    }],
    subtotal: {
      type: Number,
      default: 0,
    },
    taxes: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Draft', 'Completed', 'Archived'],
      default: 'Draft',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Forecast', forecastSchema);

