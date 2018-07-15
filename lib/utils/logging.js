const winston = require('winston');
const expressWinston = require('express-winston');

exports.log = function(app){
  app.use(expressWinston.logger({
    transports: [
      new winston.transports.Console({
        json: true,
        colorize: true
      })
    ],
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "RPC: Method:{{req.body.method}} | Success:{{res.body.success}} | Error:{{res.body.error ? res.body.error.type : null}}",
    requestWhitelist:['url', 'headers', 'method', 'body'],
    responseWhitelist:['body'],
    bodyWhitelist: ['method','args', 'signed', 'hint'],
    expressFormat: false, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    statusLevels: false,
    level: function (req, res) {
      if (res.body.success === true) {
        return 'info';
      } else{
        return 'error'
      }
    }
  }));
};