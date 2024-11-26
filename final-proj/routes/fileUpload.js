var express = require("express");
var router = express.Router();
const fs = require("fs");
const path = require('path')
const multer = require("multer");
const pathUpload = "data/upload/";
const upload = multer({
  dest: pathUpload,
  limits: { fileSize: 10 * 1024 * 1024 /* in bytes */ },
});

function utf8Name(originalname) {
  return Buffer.from(originalname, "latin1").toString("UTF-8");
}

router
  .post("/single", upload.single("myFile"), (req, res, next) => {
    if (!fs.existsSync(pathUpload)) fs.mkdirSync(pathUpload);
    let utf8FileName = utf8Name(req.file.originalname);
    fs.renameSync(req.file.path, pathUpload + utf8FileName);
    res.render("fileUpload", { strResult: utf8FileName + " File Uploaded!",
         imgOnServer: "/fileUpload/" + utf8FileName});
  })
  .post("/multiple", upload.array("myFile"), async (req, res, next) => {
    if (!fs.existsSync(pathUpload)) fs.mkdirSync(pathUpload);
    const utf8FileNames = [];
    let utf8FileName = "";
    for (let f of req.files) {
      utf8FileName = utf8Name(f.originalname);
      utf8FileNames.push(utf8FileName);
      fs.renameSync(f.path, pathUpload + utf8FileName);
    }
    res.render("fileUpload", {
      strResult: req.files.length + " files uploaded",
    });
  })
  .post(
    "/different",
    upload.fields([
      { name: "singleFile", maxCount: 1 },
      { name: "multiFiles", maxCount: 10 },
    ]),
    (req, res, next) => {
      if (!fs.existsSync(pathUpload)) fs.mkdirSync(pathUpload);
      let utf8SingleFileName = utf8Name(req.files.singleFile[0].originalname);
      fs.renameSync(
        req.files.singleFile[0].path,
        pathUpload + utf8SingleFileName
      );
      const utf8FileNames = [];
      let utf8FileName = "";
      for (let f of req.files.multiFiles) {
        utf8FileName = utf8Name(f.originalname);
        utf8FileNames.push(utf8FileName);
        fs.renameSync(f.path, pathUpload + "raw/" + utf8FileName);
      }
      res.render("fileUpload", {
        strResult:
        utf8SingleFileName +
          " File Uploaded! ; Raw files: " +
          utf8FileNames.length +
          " files uploaded",
      });
    }
  );

router.get('/:filename', (req, res, next) => {
  let filePath = path.join(__dirname, "/../data/upload/", req.params.filename)
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {return res.status(404).send('File not found!');}

    res.sendFile(filePath);
  })
  console.log(filePath)
  res.sendFile(filePath)
})

module.exports = router;
