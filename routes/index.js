var express = require('express');
const User = require('../models/User');
var router = express.Router();

/* GET home page. */
router.get('/', async function(req, res, next) {
  let allUsers;
  try {
    allUsers = await User.find();
  } catch (err) {
    res.status(500).json(err.message);
  }
  res.render('index', { title: 'User Form', users: allUsers });
});

module.exports = router;
