var express = require('express');
var path = require('path');
var router = express.Router();
const {MongoClient, ObjectId} = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");
const { isAuthenticated } = require("./authenticate.js");
const fs = require('fs');
const multer = require('multer');
const upload = multer({ dest: 'data/upload/' });
const bcrypt = require('bcrypt');
const saltRounds = 10;

/* GET users listing. */
router.use((req, res, next) => {
  res.locals.currentUser = req.session.loginID;
  next();
});

router.get('/addUser', (req, res, next) => {
  if (!req.body.loginID) {
    req.body.login_id = "";
    req.body.display_name = "";
    req.body.msg = "";
  }
  res.render('addUser', req.body);
});

router.post('/addUser', upload.single("profile_pic"), async (req, res, next) => {
  try {
    await client.connect();
    result = await client.db("PhotoShareShare").collection("user_profile").findOne({login_id: req.body.login_id});
    if (!result) {
      try {
        req.body.password = await bcrypt.hash(req.body.password, saltRounds);
      } catch {
        console.log("Failed to hash password");
      };

      if (req.file) req.body.profile_pic = req.file.originalname;

      rtn = await client.db("PhotoShareShare").collection("user_profile").insertOne(req.body);
      if (!fs.existsSync('./data/' + req.body.login_id))
        fs.mkdirSync('./data/' + req.body.login_id);

      if (req.file)
        fs.renameSync(req.file.path, "./data/" + req.body.login_id + "/" + req.file.originalname);
      res.redirect('/login?msg=newdone');
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

router.get('/editUser', isAuthenticated, async (req, res, next) => {
  try {
    await client.connect();
    result = await client.db("PhotoShareShare").collection("user_profile").findOne({login_id: req.session.loginID});
    if (result)
      res.render('editUser', result);
  } catch {
    console.log("Failed to get user record");
  } finally {
    await client.close();
  }
});

router.post('/editUser', isAuthenticated, upload.single("profile_pic"), async (req, res, next) => {
  try {
    req.body.password = await bcrypt.hash(req.body.password, saltRounds);
    let pic_filename = "";
    if (req.file) pic_filename = req.file.originalname;

    try {
      await client.connect();
      const filter = {login_id: req.body.login_id};
      result = await client.db("PhotoShareShare").collection("user_profile").updateOne(filter, 
        { $set: {
          display_name: req.body.display_name,
          password: req.body.password,
          profile_pic: pic_filename
        }}
      );
  
      if (result) {
        if (!fs.existsSync('./data/' + req.body.login_id)) {
          fs.mkdirSync('./data/' + req.body.login_id);
        }
  
        if (req.body.old_photo != "") {
          let file = "./data/" + req.body.login_id + "/" + req.body.old_photo;
          if (fs.existsSync(file)) fs.unlinkSync(file);
        }

        if (req.file) {
          let newfile = "./data/" + req.body.login_id + "/" + req.file.originalname;
          fs.renameSync(req.file.path, newfile);
        }
      } else {
        console.log("Failed to update " + req.body.login_id + " profile");
      }
      
      res.redirect('/');
    } catch (err) {
      console.log(err.name, err.message)
    } finally {
      client.close;
    }
  } catch {
    console.log("Failed to hash password");
  };
});

router.get('/delUser', async (req, res, next) => {
  try {
    await client.connect();
    const filter = {login_id: req.query.loginID};
    result1 = await client.db("PhotoShareShare").collection("photo_collection").deleteMany(filter);
    result2 = await client.db("PhotoShareShare").collection("user_profile").deleteOne(filter);
    if (result2.deletedCount > 0) {
      let dir = "./data/" + req.query.loginID;
      if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
      res.json(result2);
    } else {
      res.send("System Error! No user profile found");
    }
  } catch (err) {
    console.log(err.name, err.message)
  } finally {
    client.close;
  }
});

router.get('/:uid/:filename', isAuthenticated, (req, res, next) => {
  let filePath = path.join(__dirname, "/../data/", req.params.uid + "/" + req.params.filename)
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {return res.status(404).send('File not found!');}

    res.sendFile(filePath);
  })
});

router.get('/test', isAuthenticated, async (req, res, next) => {
  try {
    await client.connect();
    let searchcondition = {login_id: req.query.album_id, filename: req.query.filename, likeBy: {$ne: req.session.loginID }};
    result = await client.db("PhotoShareShare").collection("photo_collection").updateOne(
      searchcondition,
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

module.exports = router;
