const express = require("express");
const router = express.Router();
const authControllers = require("../controllers/authControllers");

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get("/:uniqueId", authControllers.handleGetRequest)

router.post('/:uniqueId', authControllers.handlePostRequest)

router.put('/:uniqueId/:updateId', authControllers.handlePutRequest)

router.delete("/:uniqueId/:deleteId", authControllers.handleDeleteRequest);

module.exports = router;
