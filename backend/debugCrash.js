const mongoose = require("mongoose");

async function debugBackend() {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/supplysenseai",
  );
  const db = mongoose.connection.db;

  try {
    const Order = require("./models/Order");
    const Material = require("./models/Material");
    console.log("Re-compiling schema...");

    // Check what materials exist
    const material = await Material.findOne({});
    console.log("Found material:", material ? material._id : "none");

    const order = await Order.create({
      material: material._id,
      supplier: material.supplier || material._id,
      quantity: 5,
      createdBy: material._id, // bypassing strict auth validation locally just to test schema
    });
    console.log("CREATED ORDER:", order);
  } catch (err) {
    console.log("SCHEMA CRASH REASON:", err.message);
  }

  process.exit();
}

debugBackend();
