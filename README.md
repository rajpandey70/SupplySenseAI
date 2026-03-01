<p align="center">
  <img src="https://img.shields.io/badge/SupplySenseAI-v1.0-blue?style=for-the-badge" alt="version" />
  <img src="https://img.shields.io/badge/MERN-Stack-green?style=for-the-badge&logo=mongodb" alt="MERN" />
  <img src="https://img.shields.io/badge/ML-Powered-orange?style=for-the-badge&logo=python" alt="ML" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="license" />
</p>

# 🏭 SupplySenseAI

**AI-powered Supply Chain Management System** — A full-stack web application that leverages machine learning to optimize inventory, forecast demand, and streamline supply chain operations.

> Built with the MERN stack + Python ML microservice for intelligent decision-making.

---

## ✨ Features

### 📊 Dashboard & Analytics
- Real-time overview of materials, orders, suppliers, and inventory health
- Interactive charts and visualizations using **Chart.js**
- Role-based dashboards (Admin & User views)

### 🤖 ML-Powered Forecasting
- **Multi-model comparison** — Linear Regression, EWMA, Holt-Winters (Double Exponential Smoothing)
- Auto-selects the best model per material based on RMSE
- Demand trend analysis with confidence scoring
- CSV data import support for bulk forecasting

### 📦 Inventory Optimization
- Automatic safety stock & reorder point calculations
- Economic Order Quantity (EOQ) recommendations
- Low-stock alerts and inventory health indicators

### 🏢 Supplier Management
- Supplier directory with contact details and ratings
- Performance tracking and supplier evaluation

### 📋 Order Management
- Create, track, and manage purchase orders
- Order status tracking (Pending → Approved → Shipped → Delivered)
- Real-time order analytics

### 📑 Reports
- Generate and export supply chain reports
- Material movement and consumption analysis

### 🔒 Authentication & Security
- JWT-based authentication with role-based access control
- Secure password hashing with **bcrypt**
- Protected API routes with middleware validation
- Input validation with **express-validator**
- Security headers via **Helmet**

### 📧 Communication
- Email notifications via **Nodemailer**
- Contact form integration with **EmailJS**

---

## 🛠️ Tech Stack

| Layer        | Technology                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------- |
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, React Router 7, Chart.js, Axios                                 |
| **Backend**  | Node.js, Express 5, Mongoose 9, JWT, bcrypt, Helmet, Morgan                                       |
| **Database** | MongoDB Atlas                                                                                      |
| **ML**       | Python 3.11, Flask, scikit-learn, pandas, NumPy + Pure JS forecasting engine (built-in)            |
| **Deployment** | Render (Frontend static site + Backend web service + ML web service)                             |

---

## 📁 Project Structure

```
SupplySenseAI/
├── backend/                    # Express.js API server
│   ├── config/                 # Database configuration
│   ├── controllers/            # Route handlers
│   │   ├── authController.js
│   │   ├── forecastController.js
│   │   ├── inventoryController.js
│   │   ├── materialController.js
│   │   ├── orderController.js
│   │   ├── reportController.js
│   │   └── supplierController.js
│   ├── middleware/             # Auth & error handling middleware
│   ├── ml/                    # Pure JS ML forecasting engine
│   │   └── forecasting.js     # Linear Reg, EWMA, Holt-Winters
│   ├── models/                # Mongoose schemas
│   │   ├── User.js
│   │   ├── Material.js
│   │   ├── Order.js
│   │   ├── Supplier.js
│   │   ├── Forecast.js
│   │   └── Report.js
│   ├── routes/                # API route definitions
│   ├── seed/                  # Database seeding scripts
│   ├── utils/                 # Email & helper utilities
│   └── server.js              # Entry point
│
├── frontend/                  # React + Vite SPA
│   ├── public/
│   └── src/
│       ├── layouts/           # App layout wrapper
│       ├── pages/             # Page components
│       │   ├── Dashboard.jsx
│       │   ├── Forecasting.jsx
│       │   ├── InventoryOptimization.jsx
│       │   ├── Materials.jsx
│       │   ├── Orders.jsx
│       │   ├── Suppliers.jsx
│       │   ├── Reports.jsx
│       │   ├── Settings.jsx
│       │   ├── LoginPage.jsx
│       │   ├── SignUpPage.jsx
│       │   └── HomePage.jsx
│       ├── utils/             # API config & helpers
│       ├── App.jsx
│       └── main.jsx
│
├── ml_service/                # Python Flask ML microservice
│   ├── app.py                 # Flask API with scikit-learn models
│   └── requirements.txt
│
├── render.yaml                # Render deployment blueprint
├── csv_template_example.csv   # Sample CSV for data import
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and npm
- **Python** 3.11+ (for ML service)
- **MongoDB Atlas** account (or local MongoDB instance)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/SupplySenseAI.git
cd SupplySenseAI
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/supplysenseai
JWT_SECRET=your_super_secret_key
FRONTEND_URL=http://localhost:5173
ML_SERVICE_URL=http://localhost:5001
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_ML_API_URL=http://localhost:5001
```

Start the frontend:

```bash
npm run dev
```

### 4. ML Service Setup (Optional)

```bash
cd ml_service
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python app.py
```

### 5. Seed the Database (Optional)

```bash
cd backend
node seed/seedData.js
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint              | Description         |
| ------ | --------------------- | ------------------- |
| POST   | `/api/auth/register`  | Register a new user |
| POST   | `/api/auth/login`     | Login & get JWT     |
| GET    | `/api/auth/profile`   | Get user profile    |

### Materials
| Method | Endpoint              | Description            |
| ------ | --------------------- | ---------------------- |
| GET    | `/api/materials`      | Get all materials      |
| POST   | `/api/materials`      | Add a new material     |
| PUT    | `/api/materials/:id`  | Update a material      |
| DELETE | `/api/materials/:id`  | Delete a material      |

### Orders
| Method | Endpoint           | Description         |
| ------ | ------------------ | ------------------- |
| GET    | `/api/orders`      | Get all orders      |
| POST   | `/api/orders`      | Create a new order  |
| PUT    | `/api/orders/:id`  | Update order status |
| DELETE | `/api/orders/:id`  | Delete an order     |

### Forecasting
| Method | Endpoint           | Description                      |
| ------ | ------------------ | -------------------------------- |
| POST   | `/api/forecast`    | Run ML forecast on material data |

### Suppliers, Reports, Inventory
> Full CRUD endpoints available — see `backend/routes/` for details.

---

## 🤖 ML Models Explained

SupplySenseAI uses a **multi-model approach** for demand forecasting:

| Model                | Best For                     | How It Works                                                 |
| -------------------- | ---------------------------- | ------------------------------------------------------------ |
| **Linear Regression** | Steady trends                | Fits `y = mx + b` to historical data                        |
| **EWMA**             | Noisy / fluctuating data     | Exponentially weighted moving average with auto-tuned α      |
| **Holt-Winters**     | Data with trends + momentum  | Double exponential smoothing (level + trend) with auto-tuned α, β |

The system automatically runs all three models, compares them by **RMSE** on the validation set, and selects the best-performing one for each material.

---

## 🌐 Deployment

This project is configured for **Render** deployment using the `render.yaml` blueprint:

| Service           | Type          | Details                |
| ----------------- | ------------- | ---------------------- |
| Frontend          | Static Site   | Vite build → `dist/`   |
| Backend           | Web Service   | Node.js on port 5000   |
| ML Service        | Web Service   | Python/Flask + Gunicorn |

To deploy:
1. Push the repo to GitHub
2. Connect the repo to [Render](https://render.com)
3. Set environment variables in the Render dashboard
4. Render automatically picks up `render.yaml`

---

## 📸 Screenshots

> _Screenshots coming soon — run the project locally to see the UI in action!_

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Pranjal Agarwal** — Developer

---

<p align="center">
  Made with ❤️ using MERN Stack + Machine Learning
</p>
