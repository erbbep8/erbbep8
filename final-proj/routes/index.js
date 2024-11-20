var express = require('express');
var router = express.Router();
const {MongoClient, ObjectId} = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");
const { isAuthenticated } = require("./authenticate.js");

/* GET home page. */
router.get('/', isAuthenticated, function(req, res, next) {
  res.render('index', { title: 'Photo to Share Share' });
});

router.get('/login', function(req, res, next) {
  let msg = "";
  if (req.query.msg) msg = req.query.msg;
  res.render('login', {loginID: req.session.loginID, msg: msg});
});

router.post('/login', async (req, res, next) => {
  try {
    await client.connect();
    result = await client.db("PhotoShareShare").collection("user_profile").findOne({login_id: req.body.loginID});
    if (result == null) {
      res.redirect("/login?msg=noexist");
    } else {
      if (result["password"] == req.body.password) {
        req.session.loginID = req.body.loginID;
        res.redirect('/');
      } else {
        res.redirect("/login?msg=invalid");
      }
    }
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

router.get('/addUser', (req, res, next) => {
  if (!req.body.loginID) {
    req.body.loginID = "";
    req.body.name = "";
    req.body.msg = "";
  }
  res.render('addUser', req.body);
})

router.post('/addUser', async (req, res, next) => {
  try {
    await client.connect();
    result = await client.db("PhotoShareShare").collection("user_profile").findOne({login_id: req.body.loginID});
    if (!result) {
      rtn = await client.db("PhotoShareShare").collection("user_profile").insertOne(req.body);
      res.redirect('/login');
    } else {
      req.body.msg = "exist";
      res.render('addUser', req.body);
    }
  } catch {
    console.log("Failed to insert record");
  } finally {
    await client.close();
  }
});

module.exports = router;
