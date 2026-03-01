const mongoose = require("mongoose");

async function clearOrders() {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/supplysenseai",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  );

  try {
    const db = mongoose.connection.db;
    const result = await db.collection("orders").deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} orders.`);
  } catch (err) {
    console.log("Error clearing orders:", err.message);
  }

  process.exit();
}

clearOrders();
