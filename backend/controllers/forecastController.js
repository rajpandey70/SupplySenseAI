const asyncHandler = require("express-async-handler");
const Forecast = require("../models/Forecast");
const Material = require("../models/Material");
const Order = require("../models/Order");
const { forecastSeries } = require("../ml/forecasting");

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Build month labels (e.g. ["Jan 24", "Feb 24", ..., "Dec 25"])
// ─────────────────────────────────────────────────────────────────────────────
function monthLabels(startDate, count) {
  const labels = [];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const d = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  for (let i = 0; i < count; i++) {
    labels.push(
      `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
    );
    d.setMonth(d.getMonth() + 1);
  }
  return labels;
}

// ─────────────────────────────────────────────────────────────
// GET /api/forecasts
// ─────────────────────────────────────────────────────────────
const getForecasts = asyncHandler(async (req, res) => {
  const forecasts = await Forecast.find({})
    .populate("materials.material")
    .sort("-createdAt")
    .limit(50);
  res
    .status(200)
    .json({ success: true, count: forecasts.length, data: forecasts });
});

// ─────────────────────────────────────────────────────────────
// GET /api/forecasts/:id
// ─────────────────────────────────────────────────────────────
const getForecast = asyncHandler(async (req, res) => {
  const forecast = await Forecast.findById(req.params.id)
    .populate("materials.material")
    .populate("user", "username email fullName");

  if (!forecast) {
    res.status(404);
    throw new Error("Forecast not found");
  }
  res.status(200).json({ success: true, data: forecast });
});

// ─────────────────────────────────────────────────────────────
// POST /api/forecasts
// ─────────────────────────────────────────────────────────────
const createForecast = asyncHandler(async (req, res) => {
  req.body.user = req.user.id;
  let subtotal = 0;
  const materials = [];

  if (req.body.materials?.length > 0) {
    for (const mat of req.body.materials) {
      const material = await Material.findById(mat.material);
      if (material) {
        const totalCost = mat.quantity * material.unitCost;
        subtotal += totalCost;
        materials.push({
          material: mat.material,
          quantity: mat.quantity,
          unit: material.unit,
          unitCost: material.unitCost,
          totalCost,
          confidence: mat.confidence || 90,
        });
      }
    }
  }

  const taxes = subtotal * (req.body.taxRate / 100);
  const totalCost = subtotal + taxes;

  const forecast = await Forecast.create({
    ...req.body,
    materials,
    subtotal,
    taxes,
    totalCost,
    status: "Completed",
  });

  res.status(201).json({ success: true, data: forecast });
});

// ─────────────────────────────────────────────────────────────
// PUT /api/forecasts/:id
// ─────────────────────────────────────────────────────────────
const updateForecast = asyncHandler(async (req, res) => {
  let forecast = await Forecast.findById(req.params.id);
  if (!forecast) {
    res.status(404);
    throw new Error("Forecast not found");
  }
  if (forecast.user.toString() !== req.user.id && req.user.role !== "admin") {
    res.status(401);
    throw new Error("Not authorized to update this forecast");
  }
  forecast = await Forecast.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ success: true, data: forecast });
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/forecasts/:id
// ─────────────────────────────────────────────────────────────
const deleteForecast = asyncHandler(async (req, res) => {
  const forecast = await Forecast.findById(req.params.id);
  if (!forecast) {
    res.status(404);
    throw new Error("Forecast not found");
  }
  await forecast.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

// ─────────────────────────────────────────────────────────────
// POST /api/forecasts/generate  ← MAIN ML ENDPOINT
// ─────────────────────────────────────────────────────────────
const generateForecast = asyncHandler(async (req, res) => {
  const { budget, location, towerType, substationType, forecastPeriod } =
    req.body;

  const budgetCr = parseFloat(budget) || 10;

  // Location-based cost adjustment factor
  const locationFactors = {
    "Northern Region": 1.1,
    "Southern Region": 1.0,
    "Eastern Region": 1.05,
    "Western Region": 1.08,
    "North-Eastern Region": 1.2,
  };
  const locationFactor = locationFactors[location] || 1.0;

  // Forecast period in months
  const periodMap = { "6 Months": 6, "1 Year": 12, "2 Years": 24 };
  const forecastMonths = periodMap[forecastPeriod] || 12;

  // ── STEP 1: Fetch all materials from DB ──
  const allMaterials = await Material.find({}).populate("supplier", "name");

  // ── STEP 2: Load 24 months of historical order data, grouped by material & month ──
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 24);

  const orderHistory = await Order.aggregate([
    {
      $match: {
        status: { $in: ["Received", "Ordered", "Approved", "In Transit"] },
        createdAt: { $gte: cutoff },
      },
    },
    {
      $group: {
        _id: {
          material: "$material",
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalQty: { $sum: "$quantity" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Build a map: materialId → sorted array of monthly quantities
  const historyMap = {};
  for (const r of orderHistory) {
    const key = r._id.material.toString();
    if (!historyMap[key]) historyMap[key] = [];
    historyMap[key].push(r.totalQty);
  }

  // ── STEP 3: Run ML forecast per material ──
  const forecastedMaterials = [];
  const aiInsights = [];

  for (const mat of allMaterials) {
    const key = mat._id.toString();
    const history = historyMap[key] || [];

    // Get ML prediction
    const mlResult = forecastSeries(history, forecastMonths);

    // Average forecasted quantity over the period
    const avgForecastQty =
      mlResult.forecast.length > 0
        ? mlResult.forecast.reduce((a, b) => a + b, 0) /
          mlResult.forecast.length
        : mat.reorderLevel;

    // Apply location adjustment
    const adjustedQty = Math.max(
      1,
      Math.round(avgForecastQty * locationFactor),
    );

    forecastedMaterials.push({
      material: mat._id,
      name: mat.name,
      category: mat.category,
      quantity: adjustedQty,
      unit: mat.unit,
      unitCost: mat.unitCost,
      confidence: mlResult.confidence,
      model: mlResult.model,
      rmse: mlResult.rmse,
      trend: mlResult.details?.trend || null,
      allModels: mlResult.allModels || null,
      history: history.slice(-12), // last 12 real months
      forecast: mlResult.forecast,
    });

    // Build AI insights for top-demand items
    if (mlResult.details?.trendValue > 0 && mlResult.confidence >= 75) {
      aiInsights.push({
        material: mat.name,
        category: mat.category,
        trendValue: mlResult.details.trendValue,
        confidence: mlResult.confidence,
        message: `${mat.name} demand is trending upward (${mlResult.details?.trend || "↑"}). Consider pre-ordering stock.`,
      });
    }
  }

  // ── STEP 4: Aggregate chart data (overall demand trend) ──
  // Use the 12 most data-rich material as the chart's representative series
  const representativeMat = forecastedMaterials
    .filter((m) => m.history.length >= 3)
    .sort((a, b) => b.history.length - a.history.length)[0];

  const today = new Date();
  const historyStartDate = new Date(
    today.getFullYear(),
    today.getMonth() - (representativeMat?.history?.length || 12),
    1,
  );

  const chartLabelCount =
    (representativeMat?.history?.length || 0) + forecastMonths;
  const allChartLabels = monthLabels(historyStartDate, chartLabelCount);

  const historicalChartData = representativeMat?.history || [];
  const forecastChartData = representativeMat?.forecast || [];

  // Number normalised to total demand index (aggregate all materials)
  const totalHistoryByMonth = {};
  for (const mat of forecastedMaterials) {
    mat.history.forEach((qty, idx) => {
      totalHistoryByMonth[idx] = (totalHistoryByMonth[idx] || 0) + qty;
    });
  }
  const aggregateHistory = Object.values(totalHistoryByMonth);
  const aggregateForecast = forecastedMaterials.reduce(
    (acc, mat) => mat.forecast.map((v, i) => (acc[i] || 0) + v),
    [],
  );

  const histLabels = monthLabels(historyStartDate, aggregateHistory.length);
  const forecastStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const fcastLabels = monthLabels(forecastStartDate, aggregateForecast.length);

  // ── STEP 5: Save forecast to DB ──
  const subtotal = forecastedMaterials.reduce(
    (s, m) => s + m.quantity * m.unitCost,
    0,
  );

  try {
    await Forecast.create({
      user: req.user.id,
      projectName: `${towerType || "Project"} – ${location}`,
      budget: budgetCr,
      location,
      towerType,
      forecastPeriod,
      materials: forecastedMaterials.map((m) => ({
        material: m.material,
        quantity: m.quantity,
        unit: m.unit,
        unitCost: m.unitCost,
        totalCost: m.quantity * m.unitCost,
        confidence: m.confidence,
      })),
      subtotal,
      taxes: 0,
      totalCost: subtotal,
      status: "Completed",
    });
  } catch (saveErr) {
    console.error("Forecast save error (non-fatal):", saveErr.message);
  }

  // ── STEP 6: Return rich response ──
  res.status(200).json({
    success: true,
    data: {
      materials: forecastedMaterials,
      // Aggregate chart data
      chartLabels: [...histLabels, ...fcastLabels],
      historicalData: aggregateHistory,
      forecastData: aggregateForecast,
      // Legacy single array for backward compat
      chartData: [...aggregateHistory, ...aggregateForecast],
      historyCount: aggregateHistory.length,
      modelInfo: `Auto-Selected ML (${forecastedMaterials[0]?.model || "N/A"})`,
      forecastMonths,
      locationFactor,
      // AI Insights – top 3 most significant demand spikes
      aiInsights: aiInsights
        .sort((a, b) => b.trendValue - a.trendValue)
        .slice(0, 3),
    },
  });
});

module.exports = {
  getForecasts,
  getForecast,
  createForecast,
  updateForecast,
  deleteForecast,
  generateForecast,
};
