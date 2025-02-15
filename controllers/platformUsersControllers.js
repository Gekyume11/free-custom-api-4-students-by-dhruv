const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const OTP = require("../models/otpModel");
const PlatformUser = require("../models/platformUser");
const sendEmail = require("../controllers/sendEmail");
const crypto = require("crypto"); // ✅ Import crypto for generating secure tokens

// 📌 OTP Sending
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    const normalizedEmail = email.toLowerCase();

    // Delete previous OTPs to ensure only one record exists
    await OTP.deleteMany({ email: normalizedEmail });

    // Generate a new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000);
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

    // Save OTP to the database
    await OTP.create({
      email: normalizedEmail,
      otp: otpCode,
      expiresAt: expiryTime,
    });

    // Send OTP Email
    const subject = "Your Verification Code";
    const message = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Your Verification Code</h2>
                <p>Your OTP is: <strong style="color:#007BFF;">${otpCode}</strong></p>
                <p>This OTP will expire in 10 minutes.</p>
            </div>
        `;
    await sendEmail(email, subject, message);

    res.json({ message: "OTP sent to email. Check your inbox!" });
  } catch (err) {
    console.error("❌ OTP Sending Error:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

// 📌 OTP Verification
exports.verifyOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;
    console.log("Received data:", { email, otp });

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required." });
    }

    const normalizedEmail = email.toLowerCase();

    // 🔍 Debugging: Check all OTP records before querying
    const allOtps = await OTP.find({});
    console.log("All OTP Records in DB:", allOtps);

    // Find OTP record
    const otpRecord = await OTP.findOne({ email: normalizedEmail });

    console.log("Found OTP Record:", otpRecord); // Debugging

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    if (Number(otpRecord.otp) !== Number(otp)) {
      return res.status(400).json({ error: "Incorrect OTP." });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ error: "OTP has expired. Request a new one." });
    }

    // ❌ Don't delete OTP here if you need it again later.
    // await OTP.deleteOne({ email: normalizedEmail });

    res.json({
      message: "OTP verified successfully. You can proceed with signup.",
    });
  } catch (err) {
    console.error("❌ OTP Verification Error:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

// 📌 Platform User Signup
exports.platformUserSignup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log("📥 Received Signup Data:", req.body);

    // Hash the password before saving the user
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Generate a secure API token
    const apiToken = crypto.randomBytes(32).toString("hex");

    // ✅ Create a new user with the required apiToken field
    const newUser = new PlatformUser({
      username,
      email,
      password: hashedPassword, // Use the hashed password
      apiToken, // ✅ Ensure apiToken is included
    });

    // ✅ Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "Signup successful", apiToken });
  } catch (error) {
    console.error("❌ Signup Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 📌 Platform User Login
exports.platformUserLogin = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }
  
      const normalizedEmail = email.toLowerCase();
      const user = await PlatformUser.findOne({ email: normalizedEmail });
  
      if (!user) {
        console.error("❌ Login Error: User not found");
        return res.status(404).json({ error: "User not found. Please sign up first." });
      }
  
      console.log("✅ User found:", user); // Debugging
  
      // Validate password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.error("❌ Login Error: Invalid password");
        return res.status(400).json({ error: "Invalid password." });
      }
  
      // 🔍 Debugging: Check if JWT secret is set correctly
      if (!process.env.SECRET_KEY) {
        console.error("❌ JWT Secret Key is missing in .env");
        return res.status(500).json({ error: "Server configuration error. Contact support." });
      }
  
      // Generate a new JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.SECRET_KEY,
        { expiresIn: "7d" }
      );
  
      console.log("✅ Token generated:", token); // Debugging
  
      // Send token via email
      const subject = "Your New API Access Token";
      const message = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #007BFF;">Your New API Access Token</h2>
          <p>Here is your new API token:</p>
          <p style="font-weight: bold; color: #007BFF;">${token}</p>
          <p>Use this token in the Authorization header for API requests.</p>
        </div>
      `;
  
      await sendEmail(user.email, subject, message);
  
      res.json({
        message: "Login successful! New token sent to your email.",
        token,
        userData: user,
      });
    } catch (err) {
      console.error("❌ Login Error:", err);
      res.status(500).json({ error: "Server error. Please try again later." });
    }
  };
