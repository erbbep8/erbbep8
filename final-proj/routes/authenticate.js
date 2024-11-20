exports.isAuthenticated = (req, res, next) => {
    if (!req.session.loginID)
      res.redirect('/login');
    else
      next();
}