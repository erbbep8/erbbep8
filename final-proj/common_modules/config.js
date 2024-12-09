const express = require("express");
const router = express.Router();
const path = require('path');
const fs = require('fs');

// setup config object
const config = {
  strDB: process.env.dbConnectString,
  dbPSS: "PhotoShareShare",
  colUser: "user_profile",
  colPhoto: "photo_collection",
  baseDir: process.cwd(),
  dataDir: path.join(process.cwd(), "data/"),
  fileLimits: { fileSize: 1024 * 1024 * 10 },
}
// setup middleware for config
const mwConfig = function (req, res, next) {
  const resConfig = res.locals.config || config;

  // create data directory if it doesn't exist
  if (!fs.existsSync(config.dataDir)) fs.mkdirSync(config.dataDir); 

  // store config object in res.locals for use in views
  res.locals.config = resConfig;
  // store loginID in res.locals for use in views
  res.locals.currentUser = req.session.loginID;
  
  next();
};
router.use(mwConfig);

// This function takes an original name as a parameter and returns the name in UTF-8 encoding
function utf8Name(originalname) {
  return Buffer.from(originalname, "latin1").toString("UTF-8");
}

// This function generates a unique filename by appending a random string to the original filename
function getUniqueFilename(originalFilename) {
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = path.extname(originalFilename);
  const baseFilename = path.basename(originalFilename, fileExtension);
  return `${baseFilename}_${randomString}${fileExtension}`;
}

//This function checks if the filename contains only alphanumeric characters, underscores, hyphens, Chinese characters, and spaces
function isValidFilename(filename) {
  return /^[a-zA-Z0-9_\-\u4e00-\u9fa5\s]+$/.test(filename);
}

// This function takes in a directory and filename and returns a normalized path
function normalizePath(directory, filename) {
  const normalizedDir = path.normalize(directory);
  const normalizedFilename = path.normalize(filename);

  if (!isValidFilename(normalizedFilename)) {
    throw new Error('Invalid filename');
  }

  return path.join(normalizedDir, normalizedFilename);
}

//This function checks if a target path is within a base directory
function isPathWithinBaseDir(baseDir, targetPath) {
  const normalizedBaseDir = path.normalize(baseDir);
  const normalizedTargetPath = path.normalize(targetPath);

  return normalizedTargetPath.startsWith(normalizedBaseDir);
}


//This is an object that contains helper functions
const helper = {
  utf8Name: utf8Name,
  getUniqueFilename: getUniqueFilename,
  isValidFilename: isValidFilename,
  normalizePath: normalizePath,
  isPathWithinBaseDir: isPathWithinBaseDir  
}

// const passport = require("passport");
// const LoaclStrategy = require("passport-local").Strategy;

// const authUser = (user, password, done) => {
//   // Use the "user" and "password" to search the DB and match user/password to authenticate the user
//   let authenticated_user = { id: user, name: user };

//   return done(null, authenticated_user);
// };
// passport.use(new LoaclStrategy(authUser));
// passport.serializeUser((userObj, done) => {
//   done(null, userObj);
// });
// passport.deserializeUser((userObj, done) => {
//   done(null, userObj);
// });

function isAuthenticated(req, res, next) {
  if (req.session.loginID) {
    return next();
  }
  res.redirect("/login");
}

module.exports = {routerConfig: router, config: config, helper: helper, isAuthenticated: isAuthenticated};
