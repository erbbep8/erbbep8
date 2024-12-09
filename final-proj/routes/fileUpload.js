var express = require("express");
var router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { MongoClient } = require("mongodb");
const { config, helper, isAuthenticated, } = require("../common_modules/config.js");
const { strDB, dbPSS, colUser, colPhoto, baseDir, dataDir, fileLimits, } = config;
const { utf8Name, getUniqueFilename, isValidFilename, normalizePath, isPathWithinBaseDir } = helper;

const client = new MongoClient(strDB);
const upload = multer({ dest: dataDir, limits: fileLimits, });
const objFileUpload = { strResult: "", imgOnServer: "", };

router
  .get("/", isAuthenticated, (req, res, next) => {
    objFileUpload.strResult = "";
    res.render("fileUpload", { objFileUpload: objFileUpload });
  })
  .get("/V3", isAuthenticated, (req, res, next) => {
    objFileUpload.strResult = "";
    res.render("fileUploadV3", { objFileUpload: objFileUpload });
  });

router.get("/:filename", isAuthenticated, (req, res, next) => {
  let filePath = path.join(dataDir, res.session.loginID, req.params.filename);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send("File not found!");
    }
    res.sendFile(filePath);
  });
});

router.post("/single", isAuthenticated, upload.single("myFile"),
    (req, res, next) => {
      let utf8FileName = utf8Name(getUniqueFilename(req.file.originalname));
      fs.renameSync(req.file.path, dataDir + utf8FileName);
      objFileUpload.strResult = utf8FileName + " File Uploaded!";
      objFileUpload.imgOnServer = "/fileUpload/" + utf8FileName;
      res.render("fileUpload", { objFileUpload: objFileUpload });
    }
  )

router.post("/different", isAuthenticated,
    upload.fields([
      { name: "mainFile", maxCount: 1 },
      { name: "raw1_inputFile", maxCount: 1 },
      { name: "raw2_inputFile", maxCount: 1 },
    ]),
    async (req, res, next) => {
      if (!fs.existsSync(dataDir + req.session.loginID)) fs.mkdirSync(dataDir + req.session.loginID);

      let utf8MainFileName = "", utf8raw1_FileName = "", utf8raw2_FileName = "";
      if (req.files.mainFile) {
        utf8MainFileName = utf8Name(getUniqueFilename(req.files.mainFile[0].originalname));
        fs.renameSync(
          req.files.mainFile[0].path,
          dataDir + req.session.loginID + "/" + utf8MainFileName
        );
      }
      if (req.files.raw1_inputFile) {
        utf8raw1_FileName = utf8Name(getUniqueFilename(req.files.raw1_inputFile[0].originalname));
        fs.renameSync(
          req.files.raw1_inputFile[0].path,
          dataDir + req.session.loginID + "/raw1_" + utf8raw1_FileName
        );
      }
      if (req.files.raw2_inputFile) {
        utf8raw2_FileName = utf8Name(getUniqueFilename(req.files.raw2_inputFile[0].originalname));
        fs.renameSync(
          req.files.raw2_inputFile[0].path,
          dataDir + req.session.loginID + "/raw2_" + utf8raw2_FileName
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
        const col = client.db(dbPSS).collection(colPhoto);
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

      objFileUpload.strResult = utf8MainFileName + " File Uploaded!"
      if (utf8raw1_FileName) objFileUpload.strResult += " ; Raw file 1: " + utf8raw1_FileName + " File uploaded!"
      if (utf8raw2_FileName) objFileUpload.strResult += " ; Raw file 2: " + utf8raw2_FileName + " File uploaded!"
      objFileUpload.imgOnServer = "/fileUpload/" + utf8MainFileName;

      res.render("fileUpload", { objFileUpload: objFileUpload });
    }
  )

router.post("/differentV3", isAuthenticated,
    upload.fields([
      { name: "mainFile", maxCount: 1 },
      { name: "inputRawFiles", maxCount: 2 },
    ]),
    async (req, res, next) => {
      let utf8MainFileName = utf8Name(getUniqueFilename(req.files.mainFile[0].originalname));
      fs.renameSync(req.files.mainFile[0].path, dataDir + utf8MainFileName);
      const utf8FileNames = [];
      let utf8FileName = "";
      if (req.files.inputRawFiles) {
        for (let f of req.files.inputRawFiles) {
          utf8FileName = utf8Name(getUniqueFilename(f.originalname));
          utf8FileNames.push(utf8FileName);
          fs.renameSync(f.path, dataDir + "raw-" + utf8FileName);
        }
      }

      try {
        await client.connect();
        const col = client.db(dbPSS).collection(colPhoto);
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

        objFileUpload.strResult =
          utf8MainFileName +
          " File Uploaded! ; Raw files: " +
          utf8FileNames.length +
          " files uploaded";
        objFileUpload.imgOnServer = "/fileUpload/" + utf8MainFileName;

        res.render("fileUploadV3", { objFileUpload: objFileUpload });
      }
    }
  );

module.exports = router;
