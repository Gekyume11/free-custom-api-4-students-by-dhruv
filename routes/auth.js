const express = require("express");
const router = express.Router();
const authControllers = require("../controllers/authControllers");

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Routes for API generation and CRUD operations
router.post("/generate-signup-url", authControllers.generateAPI);

module.exports = router;
