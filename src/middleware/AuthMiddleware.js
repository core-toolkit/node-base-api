const { Unauthorized } = require('../http/Errors');

module.exports = (req, res, next) => {
  if (!req.user.id) {
    return next(new Unauthorized());
  }
  next();
};
