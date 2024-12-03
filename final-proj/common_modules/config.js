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

const config = function (req, res, next) {
  const config = req.app.locals.config || (req.app.locals.config = {});

  config.dbConnectString = process.env.dbConnectString;
  config.pathUpload = "data/upload/";

  next();
};

module.exports = config;
