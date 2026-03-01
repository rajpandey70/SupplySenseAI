# SupplySenseAI — ML Final (Viva Preparation Guide)

> **Purpose:** Everything you need to know about the Machine Learning used in this project for your viva.  
> **Project:** SupplySenseAI — AI-Powered Supply Chain Demand Forecasting & Inventory Optimization

---

## 1. What Problem Does ML Solve Here?

SupplySenseAI is a supply chain management system for **electrical/power-grid infrastructure** (e.g., transmission towers, cables, transformers). The ML module answers:

- **"How much of each material will we need in the next 6/12/24 months?"** → Demand Forecasting
- **"Which model gives the most accurate prediction?"** → Auto Model Selection
- **"How much safety stock should we keep?"** → Inventory Optimization

---

## 2. Where Is the ML Code Located?

| File | Language | Purpose |
|------|----------|---------|
| `backend/ml/forecasting.js` | JavaScript (Node.js) | **Core ML engine** — runs 3 algorithms, auto-selects best one |
| `backend/controllers/forecastController.js` | JavaScript (Node.js) | **Data pipeline** — fetches history from MongoDB, calls ML, returns results |
| `ml_service/app.py` | Python (Flask) | **Alternative Python ML service** — uses scikit-learn Random Forest |
| `backend/seed/seedData.js` | JavaScript | Generates realistic synthetic historical order data |

### Which ML is actually used in production?
**The Node.js engine (`forecasting.js`) is the one actively used.** When the user clicks "Generate AI Forecast" on the frontend, it calls `forecastController.js`, which calls `forecasting.js`. The Python Flask service (`app.py`) exists as a standalone microservice option but is **not called** by the main app flow.

---

## 3. The Three ML Models (What the Project Uses)

### 3.1 Linear Regression (Trend Analysis)

**File:** `backend/ml/forecasting.js` → `fitLinearRegression()` + `forecastLinear()`

**What is it?**  
The simplest ML model. Finds the **best-fit straight line** through historical data.

**Math formula:**  
```
y = mx + b
```
- `m` = slope (how much demand changes per month)  
- `b` = intercept (baseline demand)  
- `x` = time index (month number: 0, 1, 2, 3…)

**How it's calculated (Least Squares Method):**
```
m = Σ(xi - x̄)(yi - ȳ) / Σ(xi - x̄)²
b = ȳ - m × x̄
```
Where `x̄` = mean of time indices, `ȳ` = mean of actual quantities.

**When it wins:** Best for materials with a **steady, consistent upward or downward trend** (e.g., demand growing 5% every month).

**Limitation:** Cannot capture seasonality or sudden spikes. Assumes demand follows a straight line forever.

**Example:** If demand is `[100, 110, 120, 130, 140]`, Linear Regression perfectly fits this because it's literally a straight line going up by 10 each month.

---

### 3.2 EWMA (Exponentially Weighted Moving Average)

**File:** `backend/ml/forecasting.js` → `forecastEWMA()`

**What is it?**  
A **smoothing algorithm** that gives **more weight to recent data** and less weight to older data. Also called **Single Exponential Smoothing (SES)**.

**Math formula:**
```
S(t) = α × Y(t) + (1 - α) × S(t-1)
```
- `S(t)` = smoothed value at time t (the prediction)  
- `Y(t)` = actual observed value at time t  
- `α` (alpha) = smoothing factor, between 0 and 1  
- `S(t-1)` = previous smoothed value

**What does alpha (α) do?**
| α value | Behavior |
|---------|----------|
| High (0.7) | Reacts quickly to recent changes (short memory) |
| Low (0.1) | Smooth, stable predictions (long memory) |

**How our project tunes alpha:**  
The code tries 6 different values: `[0.1, 0.2, 0.3, 0.4, 0.5, 0.7]`  
It computes RMSE for each and picks the alpha with the **lowest RMSE**.

**For future predictions:** It takes the **last smoothed value** and repeats it as a flat line (no trend).

**When it wins:** Best for **stable, predictable materials** without heavy trends — e.g., consumables with roughly constant demand.

**Limitation:** Cannot capture trends! If demand is rising, EWMA's future forecast will be a flat line at the latest smoothed value.

---

### 3.3 Holt-Winters Double Exponential Smoothing

**File:** `backend/ml/forecasting.js` → `forecastHoltWinters()`

**What is it?**  
The **most advanced model** in our project. It separately tracks TWO components:
1. **Level (L)** — the baseline average demand  
2. **Trend (T)** — the rate at which demand is increasing or decreasing

**Math formulas:**
```
Level:  L(t) = α × Y(t) + (1 - α) × (L(t-1) + T(t-1))
Trend:  T(t) = β × (L(t) - L(t-1)) + (1 - β) × T(t-1)
Forecast: F(t+h) = L(t) + h × T(t)
```
- `α` (alpha) = level smoothing parameter  
- `β` (beta) = trend smoothing parameter  
- `h` = how many steps ahead to forecast  
- `L(t)` = estimated level at time t  
- `T(t)` = estimated trend at time t

**How our project tunes α and β:**  
It tries a **grid search** over `[0.1, 0.2, 0.3, 0.4, 0.5, 0.6]` for both α and β (6 × 6 = 36 combinations), picks the pair with the **lowest RMSE**.

**When it wins:** Best for **long-term forecasting** (2 years) where demand has both a baseline and a growth/decline trend. This is why Holt-Winters usually takes over for 2-year forecasts.

**Example output:** The model also returns:
- `trend: "↑ Increasing"` or `"↓ Decreasing"` or `"→ Stable"`
- `trendValue: 5.2` (demand growing by ~5.2 units per month)

---

## 4. How the Auto-Selection Works (The "AI" Part)

**File:** `backend/ml/forecasting.js` → `forecastSeries()`

This is the **main function** that the controller calls. Here's the logic:

```
Step 1: Run ALL THREE models on the same historical data
Step 2: Each model produces "fitted" values (what it WOULD have predicted for known history)
Step 3: Calculate RMSE for each model (how far off its fitted values are from actual)
Step 4: Pick the model with the LOWEST RMSE → This becomes the winner
Step 5: Calculate a Confidence Score from the RMSE
```

### RMSE (Root Mean Squared Error) — The Selection Metric

```
RMSE = √(Σ(actual_i - predicted_i)² / n)
```
- Lower RMSE = better model  
- RMSE of 0 = perfect predictions  
- The unit is the same as the data (e.g., if measuring kg, RMSE is in kg)

### Confidence Score Calculation

```
Normalized RMSE = RMSE / average_historical_value
Confidence = (1 - min(normalizedRMSE, 0.8)) × 100
Clamped between 60% and 98%
```
- A model with 0 error → 98% confidence (capped)
- A model with RMSE equal to 80% of the average → 60% confidence (floor)

---

## 5. Complete Data Flow (End-to-End Pipeline)

When a user clicks **"Generate AI Forecast"** on the frontend:

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. USER INPUT (Frontend)                                         │
│    Budget: 200 Crores, Location: North-Eastern, Period: 1 Year   │
└────────────────────────┬─────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. CONTROLLER (forecastController.js → generateForecast)         │
│    - Parses budget, location, forecast period                    │
│    - Sets location multiplier (NE = 1.20x)                      │
│    - Sets period months (1 Year = 12)                            │
└────────────────────────┬─────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. DATA AGGREGATION (MongoDB)                                    │
│    - Fetches ALL materials from Materials collection             │
│    - Fetches last 24 months of orders from Orders collection     │
│    - Groups orders by (material_id, year, month)                 │
│    - Creates a time-series array per material:                   │
│      e.g., Steel Rod → [450, 520, 480, 510, 530, ...]           │
└────────────────────────┬─────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. ML FORECASTING (forecasting.js → forecastSeries)              │
│    FOR EACH MATERIAL:                                            │
│    ├── Run Linear Regression → RMSE = 25.3                      │
│    ├── Run EWMA             → RMSE = 18.7                       │
│    ├── Run Holt-Winters     → RMSE = 12.1  ← WINNER (lowest)   │
│    └── Auto-select Holt-Winters, confidence = 88%               │
│                                                                  │
│    Output: forecasted quantities for next 12 months              │
└────────────────────────┬─────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. POST-PROCESSING                                               │
│    - Average forecasted qty across period                        │
│    - Multiply by location factor (× 1.20 for NE region)         │
│    - Generate AI Insights (if trend ↑ and confidence > 75%)     │
└────────────────────────┬─────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. RESPONSE TO FRONTEND                                          │
│    - Per-material: quantity, model used, confidence, RMSE        │
│    - Chart data: historical + forecasted demand                  │
│    - AI Insights: "XLPE demand is trending upward. Pre-order."   │
│    - Also saved to Forecast collection in MongoDB                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. The Python ML Service (ml_service/app.py)

This is a **separate Flask microservice** that uses scikit-learn's **Random Forest Regressor**.

### Random Forest Regressor

**What is it?**  
An **ensemble learning** method that builds **100 decision trees** and averages their predictions.

**How it works:**
1. Takes historical data with features: `month_num`, `year`
2. Target: `quantity`
3. Each tree learns different patterns from random subsets of data
4. Final prediction = average of all 100 trees' predictions

**Configuration:**
```python
RandomForestRegressor(n_estimators=100, random_state=42)
```
- `n_estimators=100` → builds 100 decision trees
- `random_state=42` → ensures reproducible results

**Additional logic in app.py:**
- Budget multiplier: scales predictions based on project budget  
  `final_predictions = predictions × (budget / 100)`
- **Safety Stock** = Z × σ × √(lead_time) where Z=1.645 for 95% service level
- **Reorder Point** = (Avg Monthly Demand × Lead Time) + Safety Stock

### Why It's Not the Main ML Used
The current app flow calls `forecastController.js` → `forecasting.js` (Node.js). The Python service would need to be started separately (`python app.py` on port 5001) and the backend doesn't currently call it. It exists as a **standalone alternative or future upgrade path**.

---

## 7. Inventory Optimization Formulas

These are calculated AFTER the ML predictions to help with stock management:

### Safety Stock
```
Safety Stock = Z × σ_forecast × √(Lead Time)
```
- Z = 1.645 (for 95% service level — means 95% chance we won't run out)
- σ_forecast = standard deviation of forecasted demand
- Lead Time = 1 month (assumed)

**Plain English:** "How much extra stock should we keep as a buffer so we don't run out 95% of the time."

### Reorder Point
```
Reorder Point = (Average Demand × Lead Time) + Safety Stock
```
**Plain English:** "When our stock drops to this number, place a new order."

---

## 8. Seed Data — How the Training Data Is Generated

**File:** `backend/seed/seedData.js`

The database is pre-populated with **18 months of synthetic orders** for 12 materials using mathematically realistic patterns:

| Factor | What It Does | Example |
|--------|-------------|---------|
| **Trend Factor** | Simulates gradual demand growth | `0.012` = 1.2% monthly growth |
| **Seasonality (Sine Wave)** | Simulates seasonal peaks (summer/winter) | High demand in Jul/Jan |
| **Gaussian Noise** | Adds ±15% random variance | Makes data look organic |

This ensures the ML models have **realistic patterns** to learn from instead of random noise.

---

## 9. Location & Budget Adjustments (Non-ML but Important)

### Location Factors
After ML predicts raw quantities, they are multiplied by geographic difficulty:

| Region | Factor | Meaning |
|--------|--------|---------|
| Southern Region | 1.00× | Baseline |
| Eastern Region | 1.05× | 5% more |
| Western Region | 1.08× | 8% more |
| Northern Region | 1.10× | 10% more |
| **North-Eastern Region** | **1.20×** | **20% more** (terrain difficulty) |

### Budget Factor (Python service)
```
Budget Multiplier = Budget / 100 (normalized around 100 Crores)
```
A budget of 200 Crores → 2× multiplier on predicted quantities.

---

## 10. AI Insights Feature

The system generates natural-language recommendations:

**Trigger condition:**
```
IF trend_value > 0 AND confidence >= 75%
THEN generate insight
```

**Example outputs:**
- *"XLPE Cable demand is trending upward (↑ Increasing). Consider pre-ordering stock."*
- *"Transmission Tower demand is trending upward. Consider pre-ordering stock."*

Only the **top 3 most significant insights** (sorted by trendValue) are shown to the user.

---

## 11. Likely Viva Questions & Answers

### Q1: "Which ML algorithm does your project use?"
**A:** "Our project runs three ML algorithms concurrently — **Linear Regression**, **Exponentially Weighted Moving Average (EWMA)**, and **Holt-Winters Double Exponential Smoothing**. For each material, it auto-selects the best model based on the lowest RMSE. We also have a separate Python microservice that uses **Random Forest Regressor** from scikit-learn."

### Q2: "Why did you use multiple models instead of just one?"
**A:** "Different demand patterns suit different models. Linear Regression is best for steady trends, EWMA handles stable demand well, and Holt-Winters captures both level and trend — which is critical for long-term forecasting. Running all three and auto-selecting ensures we get the best prediction regardless of the data pattern."

### Q3: "How do you evaluate which model is best?"
**A:** "We use **Root Mean Squared Error (RMSE)** as our evaluation metric. Each model produces 'fitted' values for the known historical data, and we calculate RMSE between the fitted values and actual values. The model with the lowest RMSE wins. RMSE penalizes large errors more heavily than MAE because it squares the differences."

### Q4: "What is RMSE? How is it calculated?"
**A:** "RMSE = square root of the average of squared differences between actual and predicted values. Formula: `√(Σ(actual-predicted)² / n)`. Lower is better. An RMSE of 0 means perfect predictions."

### Q5: "What is EWMA? How does alpha work?"
**A:** "EWMA stands for Exponentially Weighted Moving Average. It smooths data by giving more weight to recent observations. Alpha (α) is the smoothing factor: a high alpha (like 0.7) reacts quickly to recent changes, while a low alpha (like 0.1) produces smoother, more stable predictions. Our system auto-tunes alpha by trying 6 values and picking the one with the lowest RMSE."

### Q6: "Explain Holt-Winters in simple terms."
**A:** "Holt-Winters tracks two things separately: the **Level** (current baseline demand) and the **Trend** (how fast demand is growing or shrinking). It uses two parameters — alpha for level smoothing and beta for trend smoothing. To forecast h months ahead, it computes: Level + h × Trend. It's the best model for long-term projections because it can project growth curves, not just flat lines."

### Q7: "What is Random Forest?"
**A:** "Random Forest is an ensemble ML method that builds many decision trees (100 in our case), each trained on random subsets of the data. The final prediction is the average of all trees' predictions. It captures non-linear patterns like seasonality that Linear Regression cannot."

### Q8: "What features does your ML use?"
**A:** "For the Node.js models: raw historical quantity values as a time series (no explicit feature engineering — the algorithms work directly on the sequence). For the Python Random Forest: `month_number` and `year` as features, with `quantity` as the target."

### Q9: "What is Safety Stock and how do you calculate it?"
**A:** "Safety Stock is a buffer of extra inventory kept to prevent stockouts. We calculate it as: Z × σ × √(Lead Time), where Z=1.645 for 95% service level, σ is the standard deviation of forecasted demand, and Lead Time is 1 month. This means there's only a 5% chance of running out."

### Q10: "What is the Confidence Score?"
**A:** "Confidence is derived inversely from RMSE. We normalize RMSE by dividing it by the average historical value (like a coefficient of variation). Lower normalized RMSE → higher confidence. It's clamped between 60% and 98%. A confidence of 92% means the model's predictions are very close to actual historical patterns."

### Q11: "Why Node.js for ML instead of Python?"
**A:** "We implemented the main ML in Node.js to avoid the complexity of running a separate Python microservice in deployment. The algorithms (Linear Regression, EWMA, Holt-Winters) are mathematical formulas that can be implemented in any language. We also have a Python Flask service with Random Forest as an alternative, showing we understand both approaches."

### Q12: "How does the location factor work?"
**A:** "After ML produces raw predictions, we multiply by a geographic difficulty factor. For example, the North-Eastern Region has a 1.20× multiplier because remote/hilly terrain requires more buffer stock and logistics planning. This is a domain-specific post-processing step, not part of the ML model itself."

### Q13: "What is hyperparameter tuning? Does your project do it?"
**A:** "Yes! Our EWMA model auto-tunes alpha by trying 6 values [0.1, 0.2, 0.3, 0.4, 0.5, 0.7] and picking the best. Holt-Winters does a grid search over 36 combinations of alpha and beta. The Python Random Forest uses `n_estimators=100` as a preset, but could use GridSearchCV for tuning in a production setup."

### Q14: "What libraries does the ML use?"
**A:** "The Node.js ML engine uses **zero external libraries** — all three algorithms are implemented from scratch using native JavaScript math. The Python service uses `scikit-learn` (for Random Forest), `pandas` (for data processing), and `numpy` (for numerical computations)."

### Q15: "What is Time Series Forecasting?"
**A:** "Time Series Forecasting is predicting future values based on historically observed values ordered by time. In our project, we have monthly demand quantities for each material going back 18-24 months. The ML models learn patterns (trends, levels) from this sequence and project them forward."

---

## 12. Quick Summary Table for Revision

| Aspect | Details |
|--------|---------|
| **Active ML Engine** | Node.js (`backend/ml/forecasting.js`) |
| **Models Used** | 1. Linear Regression, 2. EWMA, 3. Holt-Winters |
| **Model Selection** | Auto-select via lowest RMSE |
| **Confidence Range** | 60% – 98% |
| **Training Data** | 24 months of historical orders from MongoDB |
| **Seed Data Pattern** | Trend + Sine-wave seasonality + Gaussian noise |
| **Python Alternative** | Random Forest Regressor (scikit-learn) on Flask |
| **Inventory Formulas** | Safety Stock, Reorder Point |
| **Post-Processing** | Location factor (1.0×–1.2×), Budget scaling |
| **AI Insights** | Auto-generated if trend↑ and confidence≥75% |

---

**Good luck with your viva! 🎓**
