/**
 * Mailer Module
 * @module /email/email
 */

const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const { makeStandardError } = require("../http");
const { EMAIL } = require("../errors/errors.json");
const {
  CONFIG: {
    EMAILS,
    SYSTEM,
    SENDER,
    DEBUG_RECIP,
    FROM,
    HOST,
    PORT,
    SECURE,
    AUTH
  }
} = require("../enums");

let _parsony;
let _configs;
let _templates;

const DEFAULTS = {
  FROM: "Parsony Mailer <noreply@gmail.com>"
};

/**
 * Send HTML Email
 *  => If debug mode, will send to debug recipient from configs
 * @param {object} recipientEmail - String or Array of email addresses
 * @param {string} subject
 * @param {object} mergeData - marge data with keys in template
 * @param {string} template - Handlebars template filename.html
 * @param {object} sender - credentials and email address of sender
 * @return {Promise.<*>}
 *
 * @example Template
 *   <html>
 *     <body>
 *       <div> Hello, {{firstName}} {{lastName}} </div>
 *     </body>
 *   </html>
 *
 * @example Template Data
 *   {
 *     firstName : Eric
 *     lastName: Phelan
 *   }
 *
 * @example Sender
 *    {
 *      "from": "Eric Phelan  <eric@ericphelan.com>",
 *      "service": "Gmail",
 *      "host": "smtp.gmail.com",
 *      "port": 465,
 *      "secure": true,
 *      "auth": {
 *        "user": "eric@ericphelan.com",
 *        "pass": "*********"
 *      }
 *    }
 *
 */
const sendTemplateEmail = async (
  recipientEmail,
  subject,
  mergeData,
  template,
  sender
) => {
  let transporter, html;

  sender = sender || _getSystemSender();

  if (!sender || !_validSender(sender)) {
    throw makeStandardError(EMAIL.NO_SENDER);
  }

  transporter = nodemailer.createTransport(sender);
  const sendMail = promisify(transporter.sendMail).bind(transporter);
  const to = _parsony.debugMode ? _getDebugRecipient() : recipientEmail;
  const from = sender[FROM] || DEFAULTS.FROM;
  try {
    html = _makeHTMLEmail(template, mergeData);
  } catch (e) {
    throw makeStandardError(EMAIL.TEMPLATE);
  }

  const mailOptions = {
    from,
    to,
    subject,
    html
  };
  try {
    return await sendMail(mailOptions);
  } catch (e) {
    throw makeStandardError(EMAIL.NOT_SENT, e);
  }
};

function _makeHTMLEmail(template, mergeData) {
  const htmlTemplate = fs.readFileSync(path.join(_templates, template),'utf8');
  const hbs = handlebars.compile(htmlTemplate);
  return  hbs( mergeData);
}

function _getSystemSender() {
  if (
    _configs[EMAILS] &&
    _configs[EMAILS][SYSTEM] &&
    _configs[EMAILS][SYSTEM][SENDER]
  ) {
    return _configs[EMAILS][SYSTEM][SENDER];
  } else {
    return null;
  }
}

function _validSender(sender) {
  return (
    sender.hasOwnProperty(FROM) &&
    sender.hasOwnProperty(HOST) &&
    sender.hasOwnProperty(PORT) &&
    sender.hasOwnProperty(SECURE) &&
    sender.hasOwnProperty(AUTH)
  );
}

function _getDebugRecipient() {
  return _configs[EMAILS][DEBUG_RECIP];
}

const setParsony = parsony => (_parsony = parsony);

const setConfigs = configs => (_configs = configs);

const setTemplates = directory => (_templates = directory);

const getTemplatesDir = () => _templates;

module.exports = {
  setParsony,
  setConfigs,
  setTemplates,
  getTemplatesDir,
  sendTemplateEmail,
  getDebugRecipient: _getDebugRecipient
};
