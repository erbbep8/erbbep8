var express = require('express');
var router = express.Router();
const path = require("path");
const {MongoClient, ObjectId} = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");
const { isAuthenticated } = require("./authenticate.js");
const fs = require('fs');
 
router.get('/', isAuthenticated, async (req, res, next) => { 
    let s = "";
    let result = [];
    try {
      await client.connect();
      result = await client.db("PhotoShareShare").collection("photo_collection").find({login_id:req.query.albumlist},
              { projection: ({ login_id: 1,
                               filename: 1,
                               likeCount: 1,
                               liked: { $cond: { if: { $in: [req.session.loginID, "$likeBy"]}, then: 1, else: 0}} 
              })}).toArray();//albumlist's ejs name
      console.log(result);
      if (result != null) res.render("photolist", { result: result });//create a new ejs
    } finally {
      await client.close();
    }
});

router.get('/:uid/:filename', (req, res, next) => {
  let filePath = path.join(__dirname, "/../data/", req.params.uid + "/" + req.params.filename)
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {return res.status(404).send('File not found!');}

    res.sendFile(filePath);
  })
});

router.get('/like', isAuthenticated, async (req, res, next) => {
  try {
    console.log(req.query);
    await client.connect();
    let likecondition = {login_id: req.query.login_id, filename: req.query.filename, likeBy:{$ne: req.session.loginID}};
    result = await client.db("PhotoShareShare").collection("photo_collection").updateOne(
      likecondition,
      { $inc: {likeCount: 1},
        $push: {likeBy: req.session.loginID}
      }
  );
  res.json(result);
  } catch (err) {
    console.log(err.name, err.message)
  } finally {
    client.close;
  }
})

router.get('/unlike', isAuthenticated, async (req, res, next) => {
  try {
    console.log(req.query);
    await client.connect();
    let unlikecondition = {login_id: req.query.login_id, filename: req.query.filename, likeBy:req.session.loginID};
    result = await client.db("PhotoShareShare").collection("photo_collection").updateOne(
      unlikecondition,
      { $inc: {likeCount: -1},
        $pull: {likeBy: req.session.loginID}
      }
  );
  res.json(result);
  } catch (err) {
    console.log(err.name, err.message)
  } finally {
    client.close;
  }
})

module.exports = router;
