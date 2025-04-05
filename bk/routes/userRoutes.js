const express = require("express");
const pool = require("../db");
const bcrypt = require("bcrypt");

const router = express.Router();

// 📌 Get All Users (Admin Only)
router.get("/", async (req, res) => {
  try {
    // Only allow admins to view users
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied" });
    }

    const users = await pool.query("SELECT id, name, email, role FROM users");
    res.json(users.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 Create a New User (Admin Only)
router.post("/", async (req, res) => {
  try {
    // Only allow admins to create users
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied" });
    }

    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Allow teacher, admin, and student roles
    if (role !== "teacher" && role !== "admin" && role !== "student") {
      return res.status(400).json({ message: "Invalid role. Must be 'admin', 'teacher', or 'student'" });
    }

    // Check if user with same email exists
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, hashedPassword, role]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 Update User (Admin Only)
router.put("/:id", async (req, res) => {
  try {
    // Only allow admins to update users
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied" });
    }

    const { id } = req.params;
    const { name, email, password, role } = req.body;

    // Verify user exists
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // If updating email, check it doesn't conflict with another user
    if (email) {
      const existingUser = await pool.query("SELECT * FROM users WHERE email = $1 AND id != $2", [
        email, 
        id
      ]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: "Email already in use by another user" });
      }
    }

    // Start building the query
    let updateQuery = "UPDATE users SET ";
    const values = [];
    let valueCounter = 1;

    // Add name to update if provided
    if (name) {
      updateQuery += `name = $${valueCounter}, `;
      values.push(name);
      valueCounter++;
    }

    // Add email to update if provided
    if (email) {
      updateQuery += `email = $${valueCounter}, `;
      values.push(email);
      valueCounter++;
    }

    // Add role to update if provided
    if (role) {
      // Allow teacher, admin, and student roles
      if (role !== "teacher" && role !== "admin" && role !== "student") {
        return res.status(400).json({ message: "Invalid role. Must be 'admin', 'teacher', or 'student'" });
      }
      updateQuery += `role = $${valueCounter}, `;
      values.push(role);
      valueCounter++;
    }

    // Add password to update if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateQuery += `password = $${valueCounter}, `;
      values.push(hashedPassword);
      valueCounter++;
    }

    // Remove trailing comma and space
    updateQuery = updateQuery.slice(0, -2);

    // Complete the query with WHERE clause and RETURNING
    updateQuery += ` WHERE id = $${valueCounter} RETURNING id, name, email, role`;
    values.push(id);

    // Execute update if there are fields to update
    if (values.length <= 1) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const updatedUser = await pool.query(updateQuery, values);
    res.json(updatedUser.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 Delete User (Admin Only)
router.delete("/:id", async (req, res) => {
  try {
    // Only allow admins to delete users
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied" });
    }

    const { id } = req.params;

    // Check if user exists
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is the last admin
    if (user.rows[0].role === "admin") {
      const adminCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ message: "Cannot delete the last admin user" });
      }
    }

    // Delete the user
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 Get Total User Count (Admin Only)
router.get("/count", async (req, res) => {
  try {
    // Only allow admins to view user count
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access Denied" });
    }

    const result = await pool.query("SELECT COUNT(*) FROM users");
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error("Error counting users:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
