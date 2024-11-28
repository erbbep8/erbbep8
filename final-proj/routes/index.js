var express = require('express');
var router = express.Router();
const {MongoClient, ObjectId} = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");
const { isAuthenticated } = require("./authenticate.js");

/* GET home page. */
router.use((req, res, next) => {
  res.locals.currentUser = req.session.loginID;
  next();
});

router.get('/', isAuthenticated, function(req, res, next) {
  res.render('index', { title: 'Photo to Share Share' });
});

module.exports = router;
