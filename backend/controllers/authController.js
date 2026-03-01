const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role: role || "user",
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid user data",
      });
    }
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check for user email or username
    const user = await User.findOne({
      $or: [{ email: username }, { username: username }],
    }).select("+password");

    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password field (normally excluded)
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if current password is correct
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create a user (Admin only)
// @route   POST /api/auth/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Managers cannot create Admin or Manager users
    if (
      req.user.role === "manager" &&
      (role === "admin" || role === "manager")
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Managers are not permitted to create admin or manager accounts",
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role: role || "user",
    });

    // Send Welcome Email
    const loginUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    try {
      await sendEmail({
        email: user.email,
        subject: "Welcome to SupplySenseAI - Your Account Details",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to SupplySenseAI, ${user.fullName}!</h2>
            <p>An administrator has created an account for you.</p>
            <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Username:</strong> ${user.username}</p>
              <p style="margin: 0;"><strong>Password:</strong> ${password}</p>
            </div>
            <p>Please log in and change your password immediately.</p>
            <a href="${loginUrl}" style="display: inline-block; background-color: #0d9488; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">Log in to your Dashboard</a>
          </div>
        `,
      });
      console.log(`Welcome email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // We still return 201 because the user was created successfully
    }

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete a user (Admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own admin account",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: `User ${user.username} deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reset a user's password (Admin/Manager only)
// @route   PUT /api/auth/users/:id/reset-password
// @access  Private/Admin/Manager
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide a new password",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Managers cannot reset passwords for Admins or other Managers
    if (
      req.user.role === "manager" &&
      (user.role === "admin" || user.role === "manager")
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Managers are not permitted to reset passwords for admin or manager accounts",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send Password Reset Email
    const loginUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    try {
      await sendEmail({
        email: user.email,
        subject: "Security Alert: Your Password Was Reset",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello, ${user.fullName}</h2>
            <p>An administrator has reset your SupplySenseAI password.</p>
            <div style="background-color: #fce7f3; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fbcfe8;">
              <p style="margin: 0; color: #be185d;"><strong>Your new temporary password is:</strong> ${newPassword}</p>
            </div>
            <p>Please log in immediately and change this to a secure password of your choosing.</p>
            <a href="${loginUrl}" style="display: inline-block; background-color: #0d9488; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">Log in to your Dashboard</a>
          </div>
        `,
      });
      console.log(`Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // We still return 200 because the password was reset successfully
    }

    res.status(200).json({
      success: true,
      data: {},
      message: `Password for ${user.username} reset successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  changePassword,
  getUsers,
  createUser,
  deleteUser,
  resetUserPassword,
};
