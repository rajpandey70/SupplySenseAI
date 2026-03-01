const mongoose = require("mongoose");

async function dropIndex() {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/supplysenseai",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  );

  try {
    const db = mongoose.connection.db;
    await db.collection("materials").dropIndex("materialId_1");
    console.log("Successfully dropped materialId_1 index.");
  } catch (err) {
    console.log("Error or index doesn't exist:", err.message);
  }

  process.exit();
}

dropIndex();
