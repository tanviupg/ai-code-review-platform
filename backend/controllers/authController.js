const bcrypt = require("bcrypt");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { generateToken } = require("../utils/jwt");

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("name, email and password are required");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(409);
    throw new Error("Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    },
  });
});

module.exports = {
  register,
  login,
};
