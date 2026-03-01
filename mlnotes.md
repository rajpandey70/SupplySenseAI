# SupplySenseAI — Machine Learning & Forecasting Architecture

This document explains exactly how the Machine Learning and Data intelligence works in **SupplySenseAI**, how reports are generated, and how you can test different scenarios to see the AI adapt.

---

## 1. How the Machine Learning Forecasting Works

The old version of this project used a random math string (`Math.random()`) and pointed to a non-existent Python Flask service. **We have entirely replaced this with legitimate, purely native Node.js Machine Learning algorithms.**

When you click **"Generate AI Forecast"** in the frontend, here is exactly what happens step-by-step:

### Step 1: Data Aggregation

The backend (`forecastController.js`) queries the MongoDB `Orders` collection. It fetches the last **24 months of actual historical data**, aggregates it by `Material ID` and `Month`, and structures it into a mathematical time-series array.

### Step 2: Running the Models (`ml/forecasting.js`)

Instead of a single model, our ML engine runs **three separate algorithmic models** concurrently on every single material's historical array:

1. **Linear Regression (Trend Analysis):** Finds the best-fit line (`y = mx + b`). Best for detecting if a material has a steady, continuous upward or downward growth trend over the long term.
2. **Exponentially Weighted Moving Average (EWMA):** Provides single exponential smoothing. This algorithm gives more mathematical weight to _recent_ orders and less weight to _older_ orders. Best for standard, predictable materials without massive trends.
3. **Holt-Winters Double Exponential Smoothing:** The most advanced model we use. It independently tracks the **Level** (baseline average) and the **Trend** (rate of change) using `alpha` and `beta` tuning parameters. Best for generating multi-period future projections.

### Step 3: Auto-Selection via RMSE

Which model is the best? The AI answers this by testing itself.
For every material, it runs the three models on the historical data and calculates the **Root Mean Squared Error (RMSE)**. RMSE measures how far off the algorithm's "fitted" prediction would have been compared to the _actual_ historical numbers.
**The engine automatically selects the model with the lowest RMSE score.**

### Step 4: Confidence Scoring & Location Adjustments

- **Confidence Score:** The engine generates a percentage score (e.g., 92%) derived inversely from the RMSE. A lower error rate yields a higher confidence score.
- **Location Factor:** After the ML algorithm outputs a raw future quantity, it multiplies it by geographic difficulty. (e.g., The "North-Eastern Region" applies a `1.20x` multiplier because terrain delays require higher bulk ordering and buffer stock).

### Step 5: AI Insights Generation

If the ML engine detects a **steep upward trend (`T > 0`)** with a **Confidence Score > 75%**, it generates a natural-language AI Insight warning the user (e.g., _"XLPE Demand is spiking upward. Pre-order stock."_).

---

## 2. How the Real Database Seed Works (`seedData.js`)

To make the ML actually meaningful to look at, the database is seeded using complex mathematical noise generators inside `backend/seed/seedData.js`.

We generated **18 months of historical orders** for 12 materials, and we programmed the generator with real-world physics:

- **Trend Factor:** We programmed certain items (like Transmission Towers) to have a `0.012` upward trend modifier, meaning demand organically grew 1.2% every single month for 18 months.
- **Seasonality Index:** We programmed a Sine-wave modifier that causes artificial demand spikes in Summer (July) and Winter (Jan), which are the highest loads for power-grid construction.
- **Gaussian Noise:** Added a `±15%` random variance to every month so the data looks organic and not perfectly robotic.

---

## 3. How Other Reports Work (Report Module)

Currently, the `backend/controllers/reportController.js` and the `Reports.jsx` UI focus on **Historical Data Tracking**, not prediction.

- Reports module acts as the "Rear-View Mirror" (what _did_ happen), whereas the Forecasting module is the "Windshield" (what _will_ happen).
- The reports module takes in raw data on inventory movement, stock deliveries, and expenditures, and allows administrators to filter by timestamp, type, and search.
- _In a future upgrade_, we could run the same Linear Regression models on Supplier Defect rates to predict which suppliers might fail deliveries next quarter!

---

## 4. How to Test & Demo the ML Engine

You can easily demo that the AI reacts intelligently to different inputs. Head to `http://localhost:5173/forecasting`.

### Test 1: Testing Location Factors

1. Fill out a budget (e.g., `200`).
2. Select **"Southern Region"** and click Generate. Look at the total forecasted price and the quantities.
3. Change the location to **"North-Eastern Region"** and click Generate again.
4. **Notice:** You will see the material quantities and overall total estimated cost inflate by ~20%. The system knows hilly/remote locations require more buffer stock and different sub-station logistics.

### Test 2: Testing Forecast Horizons

1. Set the Forecast Period to **"6 Months"**. Note the dashed orange line on the chart and the Total Estimated Cost.
2. Change the Forecast Period to **"2 Years"**.
3. **Notice:** The chart will extend significantly further to the right. The Subtotal and Total Cost will roughly quadruple, because the ML algorithms are now mathematically plotting the Trend slope (`T`) out for 24 distinct future periods based on the `budget` baseline. You will usually see **Holt-Winters** take over as the preferred model for 2 Year forecasts, as it handles long-term trends better than EWMA.

### Test 3: Budget Constraints

1. Set a massive budget (e.g., `800` Crores).
2. Look at the **"Forecasted Material Requirements"** table.
3. Because the ML integrates the budget size as a baseline capacity modifier on the historical trajectory, all requested physical quantities in the table will scale up significantly to match the expanded capacity of the new project phase.
