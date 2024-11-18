var express = require('express');
var router = express.Router();
const multer = require('multer');
const upload = multer({dest:'data/upload/', limits: { fileSize: 10*1024*1024 /* in bytes */}});
const fs = require('fs');

router.get('/', (req, res, next) => {
    res.render("fileUpload", {strResult: ""})
})
.post('/single', upload.single('myFile'), (req, res, next) => {
    if (!fs.existsSync("upload")) fs.mkdirSync("upload");
    let strFileName = Buffer.from(req.file.originalname, 'latin1').toString('UTF-8')
    fs.renameSync(req.file.path, 
        "data/upload/" + strFileName);
        res.render("fileUpload", {strResult: strFileName + ' File Uploaded!'})
    });
module.exports = router;