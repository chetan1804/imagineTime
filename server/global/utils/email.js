/**
 * Global utililty methods.
 *
 * NOTE:  You will need your own Mandrill API key, or change these to work with
 * some other email service.
 */

// import secrets
let secrets = require('../../config')[process.env.NODE_ENV].secrets;

// import libraries
// let async = require('async');

let mandrill = require('mandrill-api/mandrill');
let mandrill_client = new mandrill.Mandrill(secrets[process.env.NODE_ENV].mandrill);

// let mandrill_client = require('@mailchimp/mailchimp_transactional')(secrets[process.env.NODE_ENV].mandrill);
let logger = global.logger;
const brandingName = require('../brandingName.js').brandingName;

exports.sendEmail = function(targets, subject, content, fromInfo, callback) {

  logger.debug("trying to send email");
  // message fields
  let msg = {
    important: true
    , track_opens: true
    , track_clicks: true
    , auto_text: true
    , auto_html: true
    , preserve_recipients: true
    , view_content_link: true
    , signing_domain: brandingName.host
    , from_email: brandingName.email.noreply
    , from_name: fromInfo.name
    , to: []
    , subject: subject
    , html: content
    , headers: {
      'Reply-To': fromInfo.replyTo
    }
  }

  // targets = (process.env.NODE_ENV === 'production' ? targets : ['ali.imagine.time@gmail.com']);

  // build recipients list
  for(var i = 0; i < targets.length; i++) {
    msg.to.push({
      "type": "to"
      , "email": targets[i]
    });
  }

  // // for testing: don't actually send any emails
  // callback({success: true, message: "email(s) sent", result: {}});

  // for deployment: actually send emails
  mandrill_client.messages.send({ "message": msg, "async": false }, function(result) {
    logger.debug(result);
    callback({success: true, message: "email(s) sent", result: result});
  }, function(e) {
    // Mandrill returns the error as an object with name and message keys
    logger.error('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    callback({success: false, message: "Failed to send email.", error: e});
  });
}


exports.sendEmailTemplate = function(targets, subject, template_name, template_content, html, text, fromInfo, callback) {
  if(!targets || targets.length < 1) {
    callback({success: false, message: "No recipient provided."});
  }

  // message fields
  var msg = {
    important: true
    , track_opens: true
    , track_clicks: true
    , auto_text: true
    , auto_html: true
    , preserve_recipients: false
    , view_content_link: true
    , signing_domain: brandingName.host
    , from_email: brandingName.email.noreply
    , from_name: fromInfo.name
    , to: []
    , subject: subject
    , html: html
    , text: text
    , headers: {
      'Reply-To': fromInfo.replyTo
    }
  }

  // build recipients list
  for(var i = 0; i < targets.length; i++) {
    msg.to.push({
      "type": "to"
      , "email": targets[i]
    });
  }
  
  logger.debug('about to send email to : ', msg.to);

  // for deployment: actually send emails
  mandrill_client.messages.sendTemplate({"template_name": template_name, "template_content": template_content, "message": msg, "async": true }, function(result) {
    logger.debug("mandrill send success");
    logger.debug(result);
    callback({success: true, message: "email(s) sent", result: result});
  }, function(e) {
    // Mandrill returns the error as an object with name and message keys
    logger.error('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    callback({success: false, message: "Failed to send email.", error: e});
  });

}

exports.isValidEmail = (email) => {
  email = email.toLowerCase().trim()
  
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const isValid = re.test(email)

  return !!isValid;
}
