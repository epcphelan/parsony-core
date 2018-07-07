const crypto = require('crypto');


exports.validateEmail = function(email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

exports.dateTime = function(offset = 0, date = new Date()) {
  date.setSeconds(date.getSeconds() + offset);
  return date
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
};

exports.randomString = function(length) {
  return crypto.randomBytes(Math.ceil(length/2))
    .toString('hex')
    .slice(0,length)
};

exports.isURL = function(str) {
  const regexp = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
  return regexp.test(str);
};

exports.isJSON = function(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return false;
  }
};


exports.requestLogger = function(req){
    const log = {
      SESSION_TOKEN:req.get('Session-Token'),
      API_KEY:req.get('Api-Key'),
      BODY: req.body
    };
    //console.log(JSON.stringify(log,null,2))
};