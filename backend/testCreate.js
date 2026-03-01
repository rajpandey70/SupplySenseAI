const fetch = require("node-fetch");

async function testCreateMaterial() {
  const payload = {
    name: "Metal ID Test",
    category: "Tower Components",
    unit: "Units",
    currentStock: 5,
    reorderLevel: 2,
    unitCost: 10,
  };

  const postRes = await fetch("http://localhost:5000/api/materials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const postData = await postRes.json();
  console.log(JSON.stringify(postData, null, 2));
}

testCreateMaterial().catch(console.error);
