'use strict';

module.exports = (req, res, next) => {
  if (req.isAuthenticated()) {
    req.currentUser = req.session.passport.user;
    return next();
  }
  res.redirect('/login');
}
