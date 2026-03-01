const express = require("express");
const router = express.Router();
const {
  getOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController");

const { protect } = require("../middleware/auth");

router.route("/").get(protect, getOrders).post(protect, createOrder);
router.route("/:id/status").put(protect, updateOrderStatus);
router.route("/:id").delete(protect, deleteOrder);

module.exports = router;
