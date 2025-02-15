const express = require("express");
const { platformUserSignup, platformUserLogin, sendOtp, verifyOtp } = require("../controllers/platformUsersControllers");

const router = express.Router();

router.post("/signup", platformUserSignup);
router.post("/login", platformUserLogin);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp)



module.exports = router;