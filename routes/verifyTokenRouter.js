const express = require("express");
const router = express.Router();
const { verifyToken } = require("../controllers/verifyingTokenContollers"); // Import controller

router.get("/:uniqueId", verifyToken); // ✅ Define the route

module.exports = router;
