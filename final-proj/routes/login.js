var express = require('express');
var router = express.Router();
const {MongoClient, ObjectId} = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");
const { isAuthenticated } = require("./authenticate.js");
const bcrypt = require('bcrypt');
const saltRounds = 10;

/* GET home page. */
router.use((req, res, next) => {
  res.locals.currentUser = req.session.loginID;
  next();
});

router.get('/', function(req, res, next) {
  let msg = "";
  if (req.query.msg) msg = req.query.msg;
  res.render('login', {loginID: req.session.loginID, msg: msg});
});

router.post('/', async (req, res, next) => {
  try {
    await client.connect();
    result = await client.db("PhotoShareShare").collection("user_profile").findOne({login_id: req.body.loginID});
    if (result == null) {
      res.redirect("/login?msg=noexist");
    } else {
      bcrypt.compare(req.body.password, result["password"], (err, result) => {
        if (err)
          console.error(err);
        else if (result) {
          req.session.loginID = req.body.loginID;
          if (req.session.msg) delete req.session.msg;
          res.redirect('/');
        } else
          res.redirect("/login?msg=invalid");
      });
    }
    if (req.session.msg) delete req.session.msg;
  } finally {
    await client.close();
  }
});

router.get('/logout', (req, res, next) => {
  if (req.session.loginID) {
    delete req.session.loginID;
    res.redirect('/login');
  }
});

module.exports = router;
