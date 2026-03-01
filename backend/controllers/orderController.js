const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Material = require("../models/Material");

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("material", "name unit unitCost")
    .populate("supplier", "name contactPerson phone email")
    .sort({ createdAt: -1 });
  res.status(200).json(orders);
});

// @desc    Create an order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { material, supplier, quantity, status, expectedDeliveryDate, notes } =
    req.body;

  if (!material || !supplier || !quantity) {
    res.status(400);
    throw new Error("Please provide material, supplier, and quantity");
  }

  // Ensure material exists
  const materialExists = await Material.findById(material);
  if (!materialExists) {
    res.status(404);
    throw new Error("Material not found");
  }

  // Auto-generate orderId
  const lastOrder = await Order.findOne({}, {}, { sort: { orderId: -1 } });
  let nextOrderId = 100001; // Starting ID
  if (lastOrder && lastOrder.orderId && lastOrder.orderId.startsWith("ORD-")) {
    const lastIdNum = parseInt(lastOrder.orderId.substring(4), 10);
    if (!isNaN(lastIdNum)) {
      nextOrderId = lastIdNum + 1;
    }
  }
  const generatedOrderId = `ORD-${nextOrderId}`;

  // Enforce Status RBAC on creation
  let finalStatus = "Pending";
  if (req.user.role === "admin" || req.user.role === "manager") {
    // Admins/Managers can create an order directly into Ordered/Approved status if they want
    finalStatus = status || "Ordered";
  }

  try {
    const order = await Order.create({
      orderId: generatedOrderId,
      material,
      supplier,
      quantity,
      status: finalStatus,
      expectedDeliveryDate,
      notes,
      createdBy: req.user.id,
    });

    const populatedOrder = await Order.findById(order._id)
      .populate("material", "name unit")
      .populate("supplier", "name");

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error("DEBUG CRASH ERROR:", error);
    res.status(500);
    throw new Error(
      error.message || "Failed to create order due to a server error.",
    );
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // RBAC check: only admin and manager can advance a "Pending" order
  if (
    order.status === "Pending" &&
    status !== "Pending" &&
    req.user.role !== "admin" &&
    req.user.role !== "manager"
  ) {
    res.status(403);
    throw new Error("You do not have permission to approve orders.");
  }

  // If receiving an order for the first time
  if (status === "Received" && order.status !== "Received") {
    const material = await Material.findById(order.material);
    if (!material) {
      res.status(404);
      throw new Error("Associated material not found to update stock");
    }

    // Add quantity to currentStock
    material.currentStock += order.quantity;

    // Recalculate material status based on stock level
    if (material.currentStock <= 0) {
      material.status = "Out of Stock";
    } else if (
      material.currentStock > 0 &&
      material.currentStock <= material.reorderLevel
    ) {
      material.status = "Low Stock";
    } else {
      material.status = "In Stock";
    }

    await material.save();
  }

  // If changing status from Received to something else, potentially revert stock logic could go here
  // For simplicity, we just won't permit undoing a 'Received' status automatically in this function without a separate returns API or manual fix by Admin.

  order.status = status;
  const updatedOrder = await order.save();

  const populatedOrder = await Order.findById(updatedOrder._id)
    .populate("material", "name unit")
    .populate("supplier", "name");

  res.status(200).json(populatedOrder);
});

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.status === "Received") {
    res.status(400);
    throw new Error(
      "Cannot delete a received order. Please adjust the stock count manually first.",
    );
  }

  await order.remove();

  res.status(200).json({ id: req.params.id });
});

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
};
