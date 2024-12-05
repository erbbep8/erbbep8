var express = require('express');
var router = express.Router();
const fs = require("fs");
const path = require('path');
const {MongoClient, ObjectId} = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");
const { isAuthenticated } = require("./authenticate.js");

/* GET home page. */
router.use((req, res, next) => {
  res.locals.currentUser = req.session.loginID;
  next();
});

router.get('/', isAuthenticated, async (req, res, next) => {
  console.log(req.query);
  try {
    console.log(req.session.loginID);
    await client.connect();
    profile = await client.db("PhotoShareShare").collection("user_profile").find({login_id: req.session.loginID}).toArray();
    result = await client.db("PhotoShareShare").collection("user_profile").find({login_id: {$ne: req.session.loginID}}).sort({filename: 1}).toArray();

    //res.send({profile: result1, result: result});
    res.render("albumlist", {profile: profile, result: result});
  } 
    catch (err) {
    console.log(err.message);
  } 
    finally {
    await client.close();
  }
});

router.get('/top/:uid/:filename', isAuthenticated, (req, res, next) => {
  let filePath = path.join(__dirname, "/../data/", req.params.uid + "/" + req.params.filename)
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {return res.status(404).send('File not found!');}

    res.sendFile(filePath);
  })
});

module.exports = router;
