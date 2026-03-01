
function rmse(actual, predicted) {
  if (!actual || !predicted || actual.length === 0) return Infinity;
  const len = Math.min(actual.length, predicted.length);
  const sumSq = actual
    .slice(0, len)
    .reduce((acc, a, i) => acc + Math.pow(a - predicted[i], 2), 0);
  return Math.sqrt(sumSq / len);
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function fitLinearRegression(values) {
  const n = values.length;
  if (n < 2) return { m: 0, b: values[0] || 0 };

  const xs = values.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (values[i] - meanY);
    den += Math.pow(xs[i] - meanX, 2);
  }

  const m = den === 0 ? 0 : num / den;
  const b = meanY - m * meanX;
  return { m, b };
}

function forecastLinear(history, periods) {
  const { m, b } = fitLinearRegression(history);
  const n = history.length;

  // In-sample fit for RMSE
  const fitted = history.map((_, i) => m * i + b);

  // Future forecast
  const forecast = Array.from({ length: periods }, (_, i) =>
    Math.max(0, m * (n + i) + b),
  );

  return {
    model: "Linear Regression",
    fitted,
    forecast,
    rmse: rmse(history, fitted),
    equation: `y = ${m.toFixed(2)}x + ${b.toFixed(2)}`,
    slope: m,
  };
}


function forecastEWMA(history, periods, alpha = 0.3) {
  if (history.length === 0)
    return { model: "EWMA", fitted: [], forecast: [], rmse: Infinity };

  const fitted = [history[0]];
  for (let i = 1; i < history.length; i++) {
    fitted.push(alpha * history[i] + (1 - alpha) * fitted[i - 1]);
  }

  // Carry the last smooth value forward
  const lastSmooth = fitted[fitted.length - 1];
  const forecast = Array(periods).fill(lastSmooth);

  // Tune alpha: try a range and pick best
  const alphas = [0.1, 0.2, 0.3, 0.4, 0.5, 0.7];
  let bestAlpha = alpha;
  let bestRmse = Infinity;

  for (const a of alphas) {
    const fit = [history[0]];
    for (let i = 1; i < history.length; i++) {
      fit.push(a * history[i] + (1 - a) * fit[i - 1]);
    }
    const r = rmse(history, fit);
    if (r < bestRmse) {
      bestRmse = r;
      bestAlpha = a;
    }
  }

  // Re-compute with best alpha
  const bestFitted = [history[0]];
  for (let i = 1; i < history.length; i++) {
    bestFitted.push(
      bestAlpha * history[i] + (1 - bestAlpha) * bestFitted[i - 1],
    );
  }
  const bestLast = bestFitted[bestFitted.length - 1];
  const bestForecast = Array(periods).fill(bestLast);

  return {
    model: "EWMA",
    alpha: bestAlpha,
    fitted: bestFitted,
    forecast: bestForecast.map((v) => Math.max(0, v)),
    rmse: bestRmse,
  };
}



function forecastHoltWinters(history, periods, alpha = 0.4, beta = 0.3) {
  if (history.length < 3)
    return { model: "Holt-Winters", fitted: [], forecast: [], rmse: Infinity };

  // Auto-tune alpha and beta
  let bestAlpha = alpha,
    bestBeta = beta,
    bestRmse = Infinity;
  const candidates = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];

  for (const a of candidates) {
    for (const b of candidates) {
      let L = history[0];
      let T = history[1] - history[0];
      const fit = [L + T];
      for (let i = 1; i < history.length; i++) {
        const Ld = a * history[i] + (1 - a) * (L + T);
        const Td = b * (Ld - L) + (1 - b) * T;
        L = Ld;
        T = Td;
        fit.push(L + T);
      }
      const r = rmse(history, fit);
      if (r < bestRmse) {
        bestRmse = r;
        bestAlpha = a;
        bestBeta = b;
      }
    }
  }

  // Generate fitted values and forecast with best params
  let L = history[0];
  let T = history[1] - history[0];
  const fitted = [L + T];
  for (let i = 1; i < history.length; i++) {
    const Ld = bestAlpha * history[i] + (1 - bestAlpha) * (L + T);
    const Td = bestBeta * (Ld - L) + (1 - bestBeta) * T;
    L = Ld;
    T = Td;
    fitted.push(L + T);
  }

  const forecast = Array.from({ length: periods }, (_, h) =>
    Math.max(0, L + (h + 1) * T),
  );

  return {
    model: "Holt-Winters",
    alpha: bestAlpha,
    beta: bestBeta,
    fitted,
    forecast,
    rmse: bestRmse,
    trend: T > 0 ? "↑ Increasing" : T < 0 ? "↓ Decreasing" : "→ Stable",
    trendValue: T,
  };
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT: forecastSeries
// ─────────────────────────────────────────────────────────────

/**
 * Forecast a time series using the best available model.
 *
 * @param {number[]} history  — array of historical values (oldest → newest)
 * @param {number}   periods  — number of future periods to predict
 * @returns {{
 *   model: string,
 *   fitted: number[],
 *   forecast: number[],
 *   rmse: number,
 *   confidence: number,
 *   details: object
 * }}
 */
function forecastSeries(history, periods) {
  if (!history || history.length === 0) {
    // No data — return zeros with low confidence
    return {
      model: "No Data",
      fitted: [],
      forecast: Array(periods).fill(0),
      rmse: null,
      confidence: 0,
      details: {},
    };
  }

  if (history.length === 1) {
    return {
      model: "Constant",
      fitted: [history[0]],
      forecast: Array(periods).fill(history[0]),
      rmse: 0,
      confidence: 50,
      details: {},
    };
  }

  // Run all three models
  const linear = forecastLinear(history, periods);
  const ewma = forecastEWMA(history, periods);
  const hw = forecastHoltWinters(history, periods);

  // Auto-select based on RMSE
  const candidates = [linear, ewma, hw];
  const best = candidates.reduce((a, b) => (a.rmse < b.rmse ? a : b));

  // Confidence: 100% perfect = 0 RMSE. Scale inversely.
  const avgValue = history.reduce((a, b) => a + b, 0) / history.length || 1;
  const normalizedRmse = best.rmse / avgValue; // coefficient of variation
  const confidence = clamp(
    Math.round((1 - Math.min(normalizedRmse, 0.8)) * 100),
    60,
    98,
  );

  return {
    model: best.model,
    fitted: best.fitted,
    forecast: best.forecast,
    rmse: parseFloat(best.rmse.toFixed(2)),
    confidence,
    details: best,
    allModels: {
      linearRmse: parseFloat(linear.rmse.toFixed(2)),
      ewmaRmse: parseFloat(ewma.rmse.toFixed(2)),
      hwRmse: parseFloat(hw.rmse.toFixed(2)),
    },
  };
}

module.exports = {
  forecastSeries,
  forecastLinear,
  forecastEWMA,
  forecastHoltWinters,
};
