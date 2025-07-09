import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const registerUser = async (req, res) => {
  const { tenantId, email, name, password, profilePicture, apiKey } = req.body;

  if (!tenantId || !email || !name || !password || !apiKey) {
    return res.status(400).json({
      error: "tenantId, email, name, password, and apiKey are required",
    });
  }

  try {
    // Validate tenant and API key
    const tenant = await mongoose.connection.db
      .collection("tenants")
      .findOne({ tenantId, apiKey });
    if (!tenant) {
      return res.status(401).json({ error: "Invalid tenantId or apiKey" });
    }

    // Check for existing user
    const existingUser = await User.findOne({ tenantId, email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User already exists for this tenant" });
    }

    const user = await User.create({
      tenantId,
      email,
      name,
      password,
      profilePicture,
    });

    const token = jwt.sign(
      { user: { email, name, profilePicture, tenantId } },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { tenantId, email, name, token },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

export const loginUser = async (req, res) => {
  const { tenantId, email, password, apiKey } = req.body;

  if (!tenantId || !email || !password || !apiKey) {
    return res
      .status(400)
      .json({ error: "tenantId, email, password, and apiKey are required" });
  }

  try {
    const tenant = await mongoose.connection.db
      .collection("tenants")
      .findOne({ tenantId, apiKey });
    if (!tenant) {
      return res.status(401).json({ error: "Invalid tenantId or apiKey" });
    }

    const user = await User.findOne({ tenantId, email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        user: {
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          tenantId,
        },
      },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { tenantId, email: user.email, name: user.name, token },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
