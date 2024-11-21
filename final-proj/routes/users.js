var express = require('express');
var router = express.Router();
const {MongoClient, ObjectId} = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");

/* GET users listing. */
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
