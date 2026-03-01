const fetch = require("node-fetch");

async function testAutoReorder() {
  console.log("Fetching materials...");
  const getRes = await fetch("http://localhost:5000/api/materials");
  const data = await getRes.json();

  if (!data.data || data.data.length === 0) {
    console.log("No materials found to test.");
    return;
  }

  const targetMaterial = data.data[0];
  console.log(
    `Testing with material: ${targetMaterial.name} (ID: ${targetMaterial._id})`,
  );

  const updatePayload = {
    name: targetMaterial.name,
    category: targetMaterial.category,
    unit: targetMaterial.unit,
    unitCost: targetMaterial.unitCost,
    supplier: targetMaterial.supplier?._id,
    currentStock: 5,
    reorderLevel: 20,
    autoReorder: true,
    minimumReorderQuantity: 100,
  };

  console.log("Sending PUT payload:", updatePayload);

  const putRes = await fetch(
    `http://localhost:5000/api/materials/${targetMaterial._id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatePayload),
    },
  );

  const putData = await putRes.json();
  const fs = require("fs");
  fs.writeFileSync("testUpdateOutput.json", JSON.stringify(putData, null, 2));
  console.log("PUT Response written to testUpdateOutput.json");
}

testAutoReorder().catch(console.error);
