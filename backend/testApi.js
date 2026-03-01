const axios = require("axios");

async function testPost() {
  try {
    // 1. Login to get a real token
    const loginRes = await axios.post("http://localhost:5000/api/auth/login", {
      username: "admin",
      password: "password123",
    });
    const token = loginRes.data.token;
    console.log("Got token!");

    // 2. Fetch materials to get a real material ID
    const matRes = await axios.get("http://localhost:5000/api/materials", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!matRes.data.data || matRes.data.data.length === 0) {
      console.log("No materials found to create an order with.");
      return;
    }
    const realMaterialId = matRes.data.data[0]._id;
    const realSupplierId =
      matRes.data.data[0].supplier || matRes.data.data[0]._id; // fallback

    // 3. Try creating the order
    const orderRes = await axios.post(
      "http://localhost:5000/api/orders",
      {
        material: realMaterialId,
        supplier: realSupplierId,
        quantity: 10,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    console.log("Order Created:", orderRes.data);
  } catch (e) {
    if (e.response) {
      console.log("Error Data:", e.response.data);
    } else {
      console.log("Error:", e.message);
    }
  }
}

testPost();
