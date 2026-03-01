/**
 * SupplySenseAI — Realistic Data Seeder
 *
 * Seeds the database with:
 *  - 3 realistic power-grid suppliers
 *  - 12 realistic materials (used in power transmission/distribution)
 *  - 18 months of realistic purchase orders per material, with:
 *      ★ Seasonal variation (demand spikes in summer/winter)
 *      ★ Upward growth trend (10–15% YoY)
 *      ★ Natural random variance
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const mongoose = require("mongoose");

const User = require("../models/User");
const Supplier = require("../models/Supplier");
const Material = require("../models/Material");
const Order = require("../models/Order");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/supplysenseai";

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIER DATA
// ─────────────────────────────────────────────────────────────────────────────
const SUPPLIERS = [
  {
    name: "Ashoka Electrical Industries",
    contactPerson: "Rajesh Sharma",
    email: "supply@ashoka-elec.in",
    phone: "+91-98100-44321",
    address: "Plot 47, Industrial Area, Noida, UP 201301",
    rating: 4.5,
    leadTime: 14,
    isActive: true,
  },
  {
    name: "BharatCable & Conductors Ltd.",
    contactPerson: "Priya Mehta",
    email: "orders@bharatcable.com",
    phone: "+91-98200-12345",
    address: "Sector 9, MIDC, Pune, MH 411023",
    rating: 4.2,
    leadTime: 21,
    isActive: true,
  },
  {
    name: "National Power Components Corporation",
    contactPerson: "Anantha Krishnan",
    email: "procurement@npcc.in",
    phone: "+91-98450-67890",
    address: "12th Cross, Electronic City, Bengaluru, KA 560100",
    rating: 4.8,
    leadTime: 10,
    isActive: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MATERIAL DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
// Each material has seasonal sensitivity (0 = flat, 1 = high) and a base demand
const MATERIALS = [
  {
    name: "XLPE Power Cable (33kV)",
    category: "Transmission Line",
    unit: "Kilometers",
    unitCost: 185000,
    reorderLevel: 15,
    baseDemand: 40,
    seasonalFactor: 0.3,
    trend: 0.008,
    supplierIdx: 1,
  },
  {
    name: "Steel Core Conductor (ACSR)",
    category: "Transmission Line",
    unit: "Kilometers",
    unitCost: 95000,
    reorderLevel: 30,
    baseDemand: 80,
    seasonalFactor: 0.2,
    trend: 0.005,
    supplierIdx: 1,
  },
  {
    name: "GI Lattice Transmission Tower",
    category: "Tower Components",
    unit: "Units",
    unitCost: 420000,
    reorderLevel: 5,
    baseDemand: 12,
    seasonalFactor: 0.5,
    trend: 0.012,
    supplierIdx: 0,
  },
  {
    name: "Porcelain Disc Insulator (70kN)",
    category: "Transmission Line",
    unit: "Units",
    unitCost: 850,
    reorderLevel: 500,
    baseDemand: 1200,
    seasonalFactor: 0.4,
    trend: 0.006,
    supplierIdx: 2,
  },
  {
    name: "Transformer Oil (Naphthenic)",
    category: "Accessories",
    unit: "Cubic Meters",
    unitCost: 120,
    reorderLevel: 5000,
    baseDemand: 14000,
    seasonalFactor: 0.2,
    trend: 0.003,
    supplierIdx: 2,
  },
  {
    name: "Silicone Rubber Surge Arrester",
    category: "Sub-station Fittings",
    unit: "Units",
    unitCost: 7500,
    reorderLevel: 50,
    baseDemand: 150,
    seasonalFactor: 0.35,
    trend: 0.009,
    supplierIdx: 0,
  },
  {
    name: "Tubular Steel Pole (11m)",
    category: "Tower Components",
    unit: "Units",
    unitCost: 18000,
    reorderLevel: 20,
    baseDemand: 55,
    seasonalFactor: 0.45,
    trend: 0.011,
    supplierIdx: 0,
  },
  {
    name: "HDPE Conduit Pipe (250mm)",
    category: "Transmission Line",
    unit: "Kilometers",
    unitCost: 75000,
    reorderLevel: 20,
    baseDemand: 70,
    seasonalFactor: 0.1,
    trend: 0.004,
    supplierIdx: 1,
  },
  {
    name: "CT/PT Instrument Transformer",
    category: "Sub-station Fittings",
    unit: "Units",
    unitCost: 38000,
    reorderLevel: 10,
    baseDemand: 30,
    seasonalFactor: 0.25,
    trend: 0.007,
    supplierIdx: 2,
  },
  {
    name: "Earthing Electrode (GI 3m)",
    category: "Foundation Materials",
    unit: "Units",
    unitCost: 2800,
    reorderLevel: 100,
    baseDemand: 280,
    seasonalFactor: 0.3,
    trend: 0.005,
    supplierIdx: 2,
  },
  {
    name: "HV Epoxy Resin Bushings",
    category: "Sub-station Fittings",
    unit: "Units",
    unitCost: 12500,
    reorderLevel: 30,
    baseDemand: 70,
    seasonalFactor: 0.2,
    trend: 0.006,
    supplierIdx: 0,
  },
  {
    name: "SF6 Gas Cylinder (50L)",
    category: "Accessories",
    unit: "Units",
    unitCost: 4500,
    reorderLevel: 25,
    baseDemand: 60,
    seasonalFactor: 0.15,
    trend: 0.008,
    supplierIdx: 2,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA GENERATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seasonal index using a sine wave (peaks in Jan/Jul for power industry)
 * month: 0-indexed (0=Jan, 11=Dec)
 */
function seasonalIndex(month, factor) {
  // Peak in Jan (winter load) and Jun (construction season)
  const summer = Math.sin((month / 12) * 2 * Math.PI);
  const winter = Math.sin(((month - 6) / 12) * 2 * Math.PI);
  const combined = 0.5 * summer + 0.5 * winter;
  return 1 + factor * combined;
}

/**
 * Generate a realistic quantity with trend + seasonality + Gaussian noise
 */
function generateQuantity(base, month, monthIndex, trend, seasonalFactor) {
  const trendMultiplier = Math.pow(1 + trend, monthIndex);
  const seasonal = seasonalIndex(month, seasonalFactor);
  const noise = 0.85 + Math.random() * 0.3; // ±15% random

  const qty = Math.round(base * trendMultiplier * seasonal * noise);
  return Math.max(1, qty);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("\n===== SupplySenseAI Data Seeder =====");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB Connected");

    // Find an admin user to attach orders to
    const adminUser = await User.findOne({ role: "admin" }).lean();
    if (!adminUser) {
      throw new Error(
        "No admin user found. Please create an admin account first via the app.",
      );
    }
    console.log(`🔑 Running as user: ${adminUser.username}`);

    // ── 1. Wipe existing suppliers and materials (clean slate) ──
    await Order.deleteMany({});
    await Material.deleteMany({});
    await Supplier.deleteMany({});
    console.log("🗑  Cleared existing suppliers, materials, orders");

    // ── 2. Create suppliers ──
    const createdSuppliers = await Supplier.insertMany(SUPPLIERS);
    console.log(`✅ Created ${createdSuppliers.length} suppliers`);

    // ── 3. Create materials with unique IDs ──
    let materialIdCounter = 100001;
    const createdMaterials = [];

    for (const matDef of MATERIALS) {
      const supplier = createdSuppliers[matDef.supplierIdx];
      const mat = await Material.create({
        materialId: `MAT-${materialIdCounter++}`,
        name: matDef.name,
        category: matDef.category,
        unit: matDef.unit,
        currentStock: Math.round(
          matDef.baseDemand * (0.5 + Math.random() * 0.5),
        ),
        reorderLevel: matDef.reorderLevel,
        maxStock: Math.round(matDef.baseDemand * 3),
        unitCost: matDef.unitCost,
        supplier: supplier._id,
        status: "In Stock",
        createdBy: adminUser._id,
      });
      createdMaterials.push({
        ...mat.toObject(),
        baseDemand: matDef.baseDemand,
        seasonalFactor: matDef.seasonalFactor,
        trend: matDef.trend,
      });
    }
    console.log(`✅ Created ${createdMaterials.length} materials`);

    // ── 4. Create 18 months of historical orders ──
    let orderIdCounter = 100001;
    const now = new Date();
    const orders = [];

    for (const mat of createdMaterials) {
      // 18 months back to 1 month ago
      for (let monthsAgo = 18; monthsAgo >= 1; monthsAgo--) {
        const orderDate = new Date(
          now.getFullYear(),
          now.getMonth() - monthsAgo,
          Math.floor(Math.random() * 10) + 5,
        );
        const deliveryDate = new Date(orderDate);
        deliveryDate.setDate(
          deliveryDate.getDate() + 14 + Math.floor(Math.random() * 14),
        );

        const month = orderDate.getMonth();
        const monthIndex = 18 - monthsAgo;
        const qty = generateQuantity(
          mat.baseDemand,
          month,
          monthIndex,
          mat.trend,
          mat.seasonalFactor,
        );

        orders.push({
          orderId: `ORD-${orderIdCounter++}`,
          material: mat._id,
          supplier: mat.supplier,
          quantity: qty,
          status: "Received",
          expectedDeliveryDate: deliveryDate,
          notes: `Auto-seeded order — Month -${monthsAgo}`,
          createdBy: adminUser._id,
          createdAt: orderDate,
          updatedAt: deliveryDate,
        });
      }
    }

    await Order.insertMany(orders, { timestamps: false });
    console.log(
      `✅ Created ${orders.length} historical orders (18 months × ${createdMaterials.length} materials)`,
    );

    // ── 5. Update material stock to reflect realistic current state ──
    for (const mat of createdMaterials) {
      const recentOrders = orders
        .filter((o) => o.material.toString() === mat._id.toString())
        .slice(-3); // last 3 orders received
      const received = recentOrders.reduce((sum, o) => sum + o.quantity, 0);
      const consumed = Math.round(received * (0.6 + Math.random() * 0.3));
      const currentStock = Math.max(mat.reorderLevel, received - consumed);

      let status = "In Stock";
      if (currentStock <= mat.reorderLevel) status = "Low Stock";
      if (currentStock === 0) status = "Out of Stock";

      await Material.findByIdAndUpdate(mat._id, { currentStock, status });
    }
    console.log("✅ Updated material stock levels");

    console.log("\n🚀 Seeding complete! Summary:");
    console.log(`  Suppliers: ${createdSuppliers.length}`);
    console.log(`  Materials: ${createdMaterials.length}`);
    console.log(`  Orders:    ${orders.length}`);
    console.log(
      "\n  You can now generate forecasts using real historical data.",
    );
  } catch (err) {
    console.error("\n❌ Seeding Error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
