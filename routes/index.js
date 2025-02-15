var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', async function(req, res, next) {
  res.send("Hello from Server, This is free APIs 4 students by Dhruv!");
});

module.exports = router;
