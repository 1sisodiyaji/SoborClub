const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const SoboUser = require("../models/Sobo_user");
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
router.use(cookieParser());

router.post("/register", async (req, res) => {
  const { name, email, password , confirmPassword , isrole } = req.body;
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
      { email: User.email , role : User.isrole },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1y", // Token expiration time
      }
    );  

    res.cookie("token", token, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    }); 
    return res.json({
      status: "success",
      message: "Account created successfully.",
      token,
      savedSoboUser
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
      { email: User.email , role : User.isrole },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1y",
      }
    ); 
    res.cookie("token", token, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    return res.json({ status: "success",  message: "Login  successfully.", token , User});
  } catch (error) {
    console.error(error);
    return res.json({ status: "error", message: "Login failed." });
  }
});


router.post("/getByToken", async (req, res) => { 
  const token = req.cookies.token || req.headers['authorization'].split(' ')[1];
  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "No token provided.",
    });
  }

  try { 
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await SoboUser.findOne({ email: decoded.email });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }

    // Send user data in the response
    return res.json({
      status: "success",
      message: "User data retrieved successfully.",
      user: {
        name: user.name,
        email: user.email,
        isrole: user.isrole
      }
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to authenticate token.",
    });
  }
});

module.exports = router;
