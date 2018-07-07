module.exports = {
  ...require('./json'),
  ...require('./endpointValidation'),
  ...require('./apiKey'),
  ...require('./sessionAuthentication'),
  ...require('./signedRequest')
};