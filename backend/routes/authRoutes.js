const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  changePassword,
  getUsers,
  createUser,
  deleteUser,
  resetUserPassword,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);

// Admin and Manager routes for user management
router
  .route("/users")
  .get(protect, authorize("admin", "manager"), getUsers)
  .post(protect, authorize("admin", "manager"), createUser);

router
  .route("/users/:id/reset-password")
  .put(protect, authorize("admin", "manager"), resetUserPassword);

router.route("/users/:id").delete(protect, authorize("admin"), deleteUser);

module.exports = router;
