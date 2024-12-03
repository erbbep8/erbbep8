var express = require("express");
var router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const pathUpload = "data/";
const upload = multer({
  dest: pathUpload,
  limits: { fileSize: 10 * 1024 * 1024 /* 10M */ },
});
const { MongoClient } = require("mongodb");
const dbConnectString = process.env.dbConnectString;
const client = new MongoClient(dbConnectString);
const dbName = "PhotoShareShare";
const collectionName = "photo_collection";
const fileUploadObj = {
  strResult: "",
  imgOnServer: "",
};
const { isAuthenticated } = require("./authenticate.js");

function utf8Name(originalname) {
  return Buffer.from(originalname, "latin1").toString("UTF-8");
}

router.use((req, res, next) => {
  res.locals.currentUser = req.session.loginID;
  next();
});

router
  .get("/", isAuthenticated, (req, res, next) => {
    fileUploadObj.strResult = "";
    res.render("fileUpload", { fileUploadObj });
  })
  .get("/V3", isAuthenticated, (req, res, next) => {
    res.render("fileUploadV3", { fileUploadObj });
  });

router.get("/:filename", isAuthenticated, (req, res, next) => {
  let filePath = path.join(__dirname, "/../data/upload/", req.params.filename);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send("File not found!");
    }
    res.sendFile(filePath);
  });
});

router
  .post(
    "/single",
    isAuthenticated,
    upload.single("myFile"),
    (req, res, next) => {
      if (!fs.existsSync(pathUpload)) fs.mkdirSync(pathUpload);
      let utf8FileName = utf8Name(req.file.originalname);
      fs.renameSync(req.file.path, pathUpload + utf8FileName);
      fileUploadObj.strResult = utf8FileName + " File Uploaded!";
      fileUploadObj.imgOnServer = "/fileUpload/" + utf8FileName;
      res.render("fileUpload", { fileUploadObj });
    }
  )
  .post(
    "/different",
    isAuthenticated,
    upload.fields([
      { name: "mainFile", maxCount: 1 },
      { name: "raw1_inputFile", maxCount: 1 },
      { name: "raw2_inputFile", maxCount: 1 },
    ]),
    async (req, res, next) => {
      if (!fs.existsSync(pathUpload)) fs.mkdirSync(pathUpload);
      if (!fs.existsSync(pathUpload + req.session.loginID))
        fs.mkdirSync(pathUpload + req.session.loginID);

      let utf8MainFileName = "", utf8raw1_FileName = "", utf8raw2_FileName = "";
      if (req.files.mainFile) {
        utf8MainFileName = utf8Name(req.files.mainFile[0].originalname);
        fs.renameSync(
          req.files.mainFile[0].path,
          pathUpload + req.session.loginID + "/" + utf8MainFileName
        );
      }
      if (req.files.raw1_inputFile) {
        utf8raw1_FileName = utf8Name(req.files.raw1_inputFile[0].originalname);
        fs.renameSync(
          req.files.raw1_inputFile[0].path,
          pathUpload + req.session.loginID + "/raw1_" + utf8raw1_FileName
        );
      }
      if (req.files.raw2_inputFile) {
        utf8raw2_FileName = utf8Name(req.files.raw2_inputFile[0].originalname);
        fs.renameSync(
          req.files.raw2_inputFile[0].path,
          pathUpload + req.session.loginID + "/raw2_" + utf8raw2_FileName
        );
      }
      let main_ISO = req.body.main_ISO || 0;
      let main_aperture = req.body.main_aperture || "";
      let main_shutter = req.body.main_shutter || "";
      let main_EV = req.body.main_EV || "";
      let raw1_ISO = req.body.raw1_ISO || 0;
      let raw1_aperture = req.body.raw1_aperture || "";
      let raw1_shutter = req.body.raw1_shutter || "";
      let raw1_EV = req.body.raw1_EV || "";
      let raw2_ISO = req.body.raw2_ISO || 0;
      let raw2_aperture = req.body.raw2_aperture || "";
      let raw2_shutter = req.body.raw2_shutter || "";
      let raw2_EV = req.body.raw2_EV || "";

      try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection(collectionName);
        await col.insertOne({
          login_id: req.session.loginID,
          filename: utf8MainFileName,
          ISO: main_ISO,
          aperture: main_aperture,
          shutter: main_shutter,
          EV: main_EV,
          likeCount: 0,
          likeBy: [],
          raw1: {
            filename: utf8raw1_FileName,
            ISO: raw1_ISO,
            aperture: raw1_aperture,
            shutter: raw1_shutter,
            EV: raw1_EV,
          },
          raw2: {
            filename: utf8raw2_FileName,
            ISO: raw2_ISO,
            aperture: raw2_aperture,
            shutter: raw2_shutter,
            EV: raw2_EV,
          },
        });
      } catch (error) {
        console.error(error);
        res.send("Error: ", error);
      } finally {
        await client.close();
      }

      fileUploadObj.strResult = utf8MainFileName +" File Uploaded!"
      if(utf8raw1_FileName) fileUploadObj.strResult += " ; Raw file 1: " + utf8raw1_FileName + " File uploaded!"
      if(utf8raw2_FileName) fileUploadObj.strResult += " ; Raw file 2: " + utf8raw2_FileName + " File uploaded!"
      fileUploadObj.imgOnServer = "/fileUpload/" + utf8MainFileName;

      res.render("fileUpload", { fileUploadObj });
    }
  )
  .post(
    "/differentV3",
    isAuthenticated,
    upload.fields([
      { name: "mainFile", maxCount: 1 },
      { name: "inputRawFiles", maxCount: 2 },
    ]),
    async (req, res, next) => {
      if (!fs.existsSync(pathUpload)) fs.mkdirSync(pathUpload);
      let utf8MainFileName = utf8Name(req.files.mainFile[0].originalname);
      fs.renameSync(req.files.mainFile[0].path, pathUpload + utf8MainFileName);
      const utf8FileNames = [];
      let utf8FileName = "";
      if (req.files.inputRawFiles) {
        for (let f of req.files.inputRawFiles) {
          utf8FileName = utf8Name(f.originalname);
          utf8FileNames.push(utf8FileName);
          fs.renameSync(f.path, pathUpload + "raw-" + utf8FileName);
        }
      }

      try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection(collectionName);
        await col.insertOne({
          login_id: req.session.loginID,
          filename: utf8MainFileName,
          ISO: "",
          aperture: "",
          shutter: "",
          EV: "",
          rawFiles: utf8FileNames,
        });
      } catch (error) {
      } finally {
        await client.close();

        fileUploadObj.strResult =
          utf8MainFileName +
          " File Uploaded! ; Raw files: " +
          utf8FileNames.length +
          " files uploaded";
        fileUploadObj.imgOnServer = "/fileUpload/" + utf8MainFileName;

        res.render("fileUploadV3", { fileUploadObj });
      }
    }
  );

module.exports = router;
