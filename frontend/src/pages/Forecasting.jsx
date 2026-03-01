import { useState, useRef } from "react";
import { Chart, registerables } from "chart.js";
import api from "../utils/api";

Chart.register(...registerables);

const MODEL_COLORS = {
  "Holt-Winters": "bg-purple-100 text-purple-700",
  "Linear Regression": "bg-blue-100 text-blue-700",
  EWMA: "bg-teal-100 text-teal-700",
  Constant: "bg-slate-100 text-slate-600",
  "No Data": "bg-red-100 text-red-600",
};

const Forecasting = () => {
  const [formData, setFormData] = useState({
    budget: "",
    location: "Southern Region",
    towerType: "Distribution Tower",
    substationType: "Not Applicable",
    forecastPeriod: "1 Year",
    taxRate: 12,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forecastData, setForecastData] = useState(null);

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setForecastData(null);

    try {
      const res = await api.post("/forecasts/generate", formData);
      const data = res.data.data;
      setForecastData(data);
      setTimeout(() => renderChart(data), 150);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate forecast");
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (data) => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }
    const ctx = chartRef.current?.getContext("2d");
    if (!ctx) return;

    const histCount = data.historyCount || 0;
    const fcastCount = data.forecastData?.length || 0;

    // Historical series — actual values
    const historicalPoints = [
      ...(data.historicalData || []),
      ...Array(fcastCount).fill(null),
    ];
    // Forecast series — null for history, values for forecast
    const forecastPoints = [
      ...Array(histCount).fill(null),
      ...(data.forecastData || []),
    ];

    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.chartLabels || [],
        datasets: [
          {
            label: "Historical Demand",
            data: historicalPoints,
            borderColor: "#0d9488",
            backgroundColor: "rgba(13,148,136,0.08)",
            pointRadius: 3,
            tension: 0.4,
            spanGaps: false,
          },
          {
            label: "ML Forecast",
            data: forecastPoints,
            borderColor: "#f97316",
            backgroundColor: "rgba(249,115,22,0.08)",
            borderDash: [6, 4],
            pointRadius: 4,
            pointBackgroundColor: "#f97316",
            tension: 0.4,
            spanGaps: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: true, position: "top" },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.dataset.label}: ${ctx.parsed.y?.toLocaleString("en-IN") || "—"} units`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 14, font: { size: 11 } },
          },
          y: {
            beginAtZero: false,
            ticks: { font: { size: 11 } },
          },
        },
      },
    });
  };

  const subtotal =
    forecastData?.materials?.reduce((s, m) => s + m.quantity * m.unitCost, 0) ||
    0;
  const taxes = subtotal * (formData.taxRate / 100);
  const total = subtotal + taxes;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              AI-Powered Demand Forecasting
            </h2>
            <p className="text-sm text-slate-500">
              Uses real historical order data with{" "}
              <span className="font-semibold text-purple-600">
                Holt-Winters
              </span>
              ,{" "}
              <span className="font-semibold text-blue-600">
                Linear Regression
              </span>{" "}
              & <span className="font-semibold text-teal-600">EWMA</span> — best
              model is auto-selected per material.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Form ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-1">
          <h3 className="text-base font-semibold text-slate-800 mb-4">
            Forecast Parameters
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Project Budget (₹ Crores)
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) =>
                  setFormData({ ...formData, budget: e.target.value })
                }
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-teal-500"
                placeholder="e.g., 50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Project Location
              </label>
              <select
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-teal-500"
              >
                {[
                  "Northern Region",
                  "Southern Region",
                  "Eastern Region",
                  "Western Region",
                  "North-Eastern Region",
                ].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tower Type
              </label>
              <select
                value={formData.towerType}
                onChange={(e) =>
                  setFormData({ ...formData, towerType: e.target.value })
                }
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-teal-500"
              >
                {[
                  "Transmission Tower",
                  "Distribution Tower",
                  "Sub-station Tower",
                  "Monopole Tower",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sub-station Type
              </label>
              <select
                value={formData.substationType}
                onChange={(e) =>
                  setFormData({ ...formData, substationType: e.target.value })
                }
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-teal-500"
              >
                {[
                  "Not Applicable",
                  "AIS (Air Insulated)",
                  "GIS (Gas Insulated)",
                  "Hybrid",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Forecast Period
              </label>
              <select
                value={formData.forecastPeriod}
                onChange={(e) =>
                  setFormData({ ...formData, forecastPeriod: e.target.value })
                }
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-teal-500"
              >
                {["6 Months", "1 Year", "2 Years"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                value={formData.taxRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    taxRate: parseFloat(e.target.value),
                  })
                }
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-md font-semibold text-white text-sm transition-colors ${loading ? "bg-slate-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="opacity-25"
                    />
                    <path
                      fill="currentColor"
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 110 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                    />
                  </svg>
                  Running ML Analysis…
                </span>
              ) : (
                "Generate AI Forecast"
              )}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </form>
        </div>

        {/* ── Chart ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">
              Aggregate Demand Trend
            </h3>
            {forecastData?.modelInfo && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold">
                🤖 {forecastData.modelInfo}
              </span>
            )}
          </div>
          <div className="h-80">
            {forecastData ? (
              <canvas ref={chartRef} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <svg
                  className="w-14 h-14 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
                <p className="text-slate-500 font-medium">
                  No forecast generated yet
                </p>
                <p className="text-sm text-slate-400">
                  Fill in parameters and click Generate
                </p>
              </div>
            )}
          </div>
          {forecastData && (
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-teal-500 inline-block" />
                Historical (actual)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-orange-500 inline-block border-dashed border-t border-orange-500" />
                ML Forecast
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── AI Insights ── */}
      {forecastData?.aiInsights?.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-200">
          <h3 className="text-base font-bold text-indigo-800 mb-3 flex items-center gap-2">
            <span>🧠</span> AI Demand Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {forecastData.aiInsights.map((insight, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100"
              >
                <div className="text-xs font-semibold text-indigo-500 mb-1">
                  {insight.category}
                </div>
                <div className="text-sm font-semibold text-slate-800 mb-2">
                  {insight.material}
                </div>
                <p className="text-xs text-slate-600">{insight.message}</p>
                <div className="mt-2 flex items-center gap-1">
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${insight.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-indigo-600">
                    {insight.confidence}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Materials Table ── */}
      {forecastData?.materials?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-800">
              Forecasted Material Requirements
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Per-material ML model selected automatically based on historical
              fit quality (RMSE)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Material",
                    "Category",
                    "Qty (avg/month)",
                    "Unit",
                    "ML Model",
                    "Confidence",
                    "Estimated Cost (₹)",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forecastData.materials.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">
                      {m.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {m.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 font-mono">
                      {m.quantity.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {m.unit}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-semibold ${MODEL_COLORS[m.model] || "bg-slate-100 text-slate-600"}`}
                      >
                        {m.model}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-teal-500 h-1.5 rounded-full"
                            style={{ width: `${m.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-teal-600">
                          {m.confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 text-right">
                      ₹{(m.quantity * m.unitCost).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-2 text-sm font-semibold text-right text-slate-600"
                  >
                    Subtotal
                  </td>
                  <td className="px-4 py-2 text-sm font-bold text-right">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-2 text-sm font-semibold text-right text-slate-600"
                  >
                    GST @ {formData.taxRate}%
                  </td>
                  <td className="px-4 py-2 text-sm font-bold text-right">
                    ₹{taxes.toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr className="bg-indigo-50">
                  <td
                    colSpan="6"
                    className="px-4 py-3 text-sm font-bold text-right text-indigo-700"
                  >
                    Total Estimated Cost
                  </td>
                  <td className="px-4 py-3 text-base font-extrabold text-right text-indigo-700">
                    ₹{total.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forecasting;
