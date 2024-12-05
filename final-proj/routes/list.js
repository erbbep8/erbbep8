var express = require('express');
var router = express.Router();
const path = require("path");
const {MongoClient, ObjectId} = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");
const { isAuthenticated } = require("./authenticate.js");
const fs = require('fs');
 
router.use((req, res, next) =>{ // list teachers name  
  res.locals.currentuser = req.session.loginID; 
  next();
});


router.get('/photodetail', async function(req, res, next) { 
  try {
  
    //找很多req.query字段
    await client.connect();
    let db = client.db("PhotoShareShare");

    //目前點擊的這張
    let newPhoto = await db.collection("photo_collection").find({filename:req.query.name}).toArray();
    
    //這個名字下面的所有照片
    let newPhotoAll = await db.collection("photo_collection").find({login_id:req.query.albumid}).toArray();

    res.render("phoDetail", {result: newPhoto, resultAll: newPhotoAll});

  } finally {
    await client.close();
  }
});


router.get('/delePhoto', async function(req, res, next) { 
  try {
  
    //找很多req.query字段
    await client.connect();
    let db = client.db("PhotoShareShare");

    let aa = await db.collection("photo_collection").findOne( ({ filename:req.query.filename }));
 // await db.collection("photo_collection").deleteOne( ({ login_id:req.body.login_id }));
    console.log(aa);

    res.redirect('/photolist?albumlist='+req.query.filename.split("_")[0] );

  } finally {
    await client.close();
  }
});


module.exports = router;