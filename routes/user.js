const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const SoboUser = require("../models/Sobo_user");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res) => {
  const { name, email, password , confirmPassword , isrole } = req.body;
  console.log("Received data:", req.body);
  if (!name || !email || !password || !confirmPassword || !isrole) {
    return res.json({
      status: "error",
      message: "Please fill the data Correctly.",
    });
  }

  if(password !== confirmPassword){
    return res.json({
          status: "error",
          message: "Password and Confirm Password does not match.",
    });
  }

  try {
    const User = await SoboUser.findOne({ email });
    if (User) {
      return res.json({ status: "error", message: "SoboUser already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = new SoboUser({
      name,
      email,
      password: hashPassword,
      isrole
    });
    const savedSoboUser = await newUser.save().catch((error) => {
      console.error("Error saving SoboUser to database:", error);
      throw error;
    });
    const token = jwt.sign(
      { email: SoboUser.email , role : SoboUser.isrole },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1y", // Token expiration time
      }
    );

    // Set the token in a cookie
    res.cookie("token", token, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
console.log(" Account created successfully "+savedSoboUser);
    return res.json({
      status: "success",
      message: "Account created successfully.",
      token,
    });
  } catch (error) {
    console.error(error);
    return res.json({ status: "error", message: "Account creation failed." });
  }
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({
      status: "error",
      message: "Please fill the data Correctly.",
    });
  }
  try {
    const User = await SoboUser.findOne({ email });
    if (!User) {
      return res.json({ status: "error", message: "Account does not exist." });
    }

    const isMatch = await bcrypt.compare(password, User.password);
    if (!isMatch) {
      return res.json({ status: "error", message: "Invalid password." });
    }

    const token = jwt.sign(
      { id: SoboUser._id , role : SoboUser.isrole},
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1y",
      }
    );
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
    console.log("Login  successfully." + User);
    return res.json({ status: "success",  message: "Login  successfully.", token});
  } catch (error) {
    console.error(error);
    return res.json({ status: "error", message: "Login failed." });
  }
});

module.exports = router;
