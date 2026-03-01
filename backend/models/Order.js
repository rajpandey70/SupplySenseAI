const mongoose = require("mongoose");

const orderSchema = mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: [true, "Please add a material"],
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Please add a supplier"],
    },
    quantity: {
      type: Number,
      required: [true, "Please add the quantity to order"],
      min: [1, "Quantity must be at least 1"],
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Ordered",
        "In Transit",
        "Received",
        "Cancelled",
      ],
      default: "Pending",
    },
    expectedDeliveryDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Order", orderSchema);
