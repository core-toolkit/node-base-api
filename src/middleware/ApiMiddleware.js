const { BaseError, Validation } = require('../http/Errors');

module.exports = (Logger) => ({ data, error }, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const response = {
    data: null,
    error: null,
  };

  if (data) {
    response.data = data;
  } else if (error instanceof BaseError) {
    res.status(error.code);
    response.error = { message: error.message };
    if (error instanceof Validation) {
      response.error.validations = error.validations;
    }
  } else if (error) {
    Logger.error(error);
    res.status(500);
    response.error = { message: 'Something went wrong' };
  }

  res.send(response);
};
