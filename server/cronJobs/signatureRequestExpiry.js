const cron = require('node-cron');
const signatureDAO = require('../resources/signature/signatureDAO');
const QuickTask = require('../resources/quickTask/QuickTaskModel');
const firmsController = require('../resources/firm/firmsController');
const Firm = require('../resources/firm/FirmModel');

const emailUtil = require('../global/utils/email');
const moment = require('moment');

const brandingName = require('../global/brandingName.js').brandingName;
let appUrl = require('../config')[process.env.NODE_ENV].appUrl;

const logger = global.logger;

async function sendEmail(request, signingLink, includeLink, subject, message, callback) {
  if(!signingLink || !signingLink.signatoryEmail) {
    callback({success: false, message: "No signing link."});
    return;
  }

  let firmUrl = appUrl;
  let firmLogo;
  if(request.firmDomain) {
      firmUrl = request.firmDomain;
  }
  if(request.firmLogoUrl) {
      firmLogo = `<img alt="" src="http://${firmUrl}/api/firms/logo/${request.firmId}/${request.firmLogoUrl}" style="max-width:800px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage" width="564" align="left"/>`
  }

  let template = 'notification-email' + brandingName.emailTemplateSuffix;

  const targets = [signingLink.signatoryEmail];
  //logger.debug('Email to be sent to ', signingLink.signerName, signingLink.signatoryEmail);
  const notifContent = `<h4 style="font-weight:500;font-size:1rem;line-height:135%">${message}</h4><br/>`
  const fromInfo = await firmsController.getEmailFromInfo(request.firmId, request.createdById);
  logger.debug(getFileIdentifier(), ' fromInfo for firm [id: ' + request.firmId + ']:', fromInfo);
  let link = '';
  let notifLink = ''
  if(includeLink && !!signingLink.url) {
    link = signingLink.url;
    notifLink = `<td style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="center">
      <table class="mcnButtonContentContainer" style="border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
          <tbody>
              <tr>
                  <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                    <a class="mcnButton " title="View in ${brandingName.title}" href=${link} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">Signature Request</a>
                  </td>
              </tr>
          </tbody>
      </table>
    </td>`;
  }

  const content = [
    { name: 'notifLink', content: notifLink }
    , { name: 'notifContent', content: notifContent}
  ];
  if(firmLogo) {
    content.push({
      name: 'firmLogo', content: firmLogo
    })
  }
  if(targets && targets.length > 0) {
    emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
      callback(data);
    });
      
  }
}

exports.signatureRequestReminderEmails = () => {
  // trigger at 2:00 AM every day
  cron.schedule('0 0 2 * * *', () => {
    let maxDueDate = new Date();
    maxDueDate = new Date(maxDueDate.getFullYear(), maxDueDate.getMonth(), maxDueDate.getDate() + 5, 0, 0, 0);

    signatureDAO.getRequestsForReminderNotification(maxDueDate, (requests) => {
      logger.debug(getFileIdentifier(), requests.length + ' signature requests found for reminder emails.');

      requests.map((request, index) => {
        Firm.query()
        .findById(request.firmId)
        .asCallback((err, firm) => {
          if (err || !firm) {
            logger.error("Could not find firm");
          } else {
            try {
              let sendReminderEmailFlag = shouldSendReminderEmail(request);
              //logger.debug(getFileIdentifier(), index, '. - [isReminderEmailSent:', request.isReminderEmailSent, ', Create Date:', request.createdDateTime, ', Expire Date:', request.expireDate, ', shouldSendEmail:', sendReminderEmailFlag, ']');
              if(!sendReminderEmailFlag) return;
              let expireDate = request.expireDate;

              request.signingLinks.forEach((link) => {
                // send email to the signer

                // copy current values of the variables from the outer function
                // scope such that they can be used inside the callback function.
                let link2 = link; 
                let index2 = index;
                //logger.debug(getFileIdentifier(), index + '. - Sending email to ' + link2.signerName + ' at ' + link2.signatoryEmail);

                const expireDateStr = moment(expireDate).format('MM/DD/YYYY');
                const subject = 'A signature request is expiring on ' + expireDateStr;
                let signerName = 'Hi';
                if(!!link2.signerName) {
                  signerName = 'Hi ' + link2.signerName;
                }
                let message = `${signerName},<br/><br/>The following signature request is expiring on ${expireDateStr}. Please sign the document at the earliest.`;
                if (firm.company_name === 'ImagineTime') {
                  sendEmail(request, link2, true, subject, message, (result) => {
                    let index3 = index2;
                    if(result.success) {
                      logger.debug(getFileIdentifier(), index3, '. - Success=True, Result:', result.message);
                    }
                    else {
                      logger.error(getFileIdentifier(), index3, '. - Success=False, Result:', result.message);
                    }
                  });
                } else {
                  sendEmail(request, link2, true, subject, message, (result) => {
                    let index3 = index2;
                    if(result.success) {
                      logger.debug(getFileIdentifier(), index3, '. - Success=True, Result:', result.message);
                    }
                    else {
                      logger.error(getFileIdentifier(), index3, '. - Success=False, Result:', result.message);
                    }
                  });
                }
                
              });

              QuickTask.query()
              .findById(request.quickTaskId)
              .skipUndefined()
              .update({
                isReminderEmailSent : true
              })
              .asCallback((err, quickTask) => {
                if(err) {
                  logger.error(getFileIdentifier(), 'isReminderEmailSent could not be updated in quickTask[id: ' + request.quickTaskId + ']. Error message is :', err);
                }
                else {
                  logger.debug(getFileIdentifier(), 'isReminderEmailSent updated in quickTask[id: ' + request.quickTaskId + ']');
                }
              });
            } catch (e) {
              logger.error(e);
            }
          }
        });
      })
    });
  });
}

function shouldSendReminderEmail(signatureRequest) {
  if(signatureRequest.isReminderEmailSent) return false;

  if(!!signatureRequest.createdDateTime) {
    var signatureDurationMS = signatureRequest.expireDate.getTime() - signatureRequest.createdDateTime.getTime();
    const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;
    // If there are less than or equal to two days between create and expire dates
    if(signatureDurationMS <= (2 * MILLISECONDS_IN_A_DAY)) {
      return false;
    }
    // If there are more than 10 days between create and expire dates
    else if(signatureDurationMS > (10 * MILLISECONDS_IN_A_DAY)) {
      var notificationDate = new Date(signatureRequest.expireDate.valueOf());
      notificationDate.setDate(notificationDate.getDate() - 5);
      // if request is expiring within 5 days
      return notificationDate.getTime() < new Date().getTime();
    }
    else {
    // If there are two to ten days between create and expire dates
    var notificationDate = new Date(signatureRequest.expireDate.valueOf());
      notificationDate.setTime(notificationDate.getTime() - Math.trunc(signatureDurationMS / 2));
      // if more than half time has passed between create and expire dates
      return notificationDate.getTime() < new Date().getTime();
    }
  }
  else {
    // Date on 5 days before expiry
    var notificationDate = new Date(signatureRequest.expireDate.valueOf());
    notificationDate.setDate(notificationDate.getDate() - 5);
    // if request is expiring within 5 days
    return notificationDate.getTime() < new Date().getTime();
  }
}

exports.signatureRequestExpiryEmails = () => {
  // trigger at 2:30 AM every day
  cron.schedule('0 30 2 * * *', () => {
    signatureDAO.getExpiredRequestsForNotification((requests) => {
      logger.debug(getFileIdentifier(), requests.length + ' expired signature requests found for notification to the respective users.');
      requests.map((request, index) => {
        Firm.query()
        .findById(request.firmId)
        .asCallback((err, firm) => {
          if (err || !firm) {
            logger.error("Could not find firm");
          } else {
            try {
              //logger.debug(getFileIdentifier(), index, '. - [isExpiryEmailSent:', request.isExpiryEmailSent, ', Expire Date:', request.expireDate, ']');
              if(request.isExpiryEmailSent) return;

              request.signingLinks.forEach((link) => {
                // copy current values of the variables from the outer function
                // scope such that they can be used inside the callback function.
                let link2 = link; 
                let index2 = index;
                //logger.debug(getFileIdentifier(), index + '. - Sending email to ' + link2.signerName + ' at ' + link2.signatoryEmail);

                const subject = 'A signature request has expired';
                let signerName = 'Hi';
                if(!!link2.signerName) {
                  signerName = 'Hi ' + link2.signerName;
                }
                let message = `${signerName},<br/><br/>A signature request has expired.`;

                // send email to the signer
                if (firm.company_name === 'ImagineTime') {
                  sendEmail(request, link2, false, subject, message, (result) => {
                    let index3 = index2;
                    if(result.success) {
                      logger.debug(getFileIdentifier(), index3, '. - Success=True, Result:', result.message);
                    }
                    else {
                      logger.error(getFileIdentifier(), index3, '. - Success=False, Result:', result.message);
                    }
                  });
                } else {
                  sendEmail(request, link2, false, subject, message, (result) => {
                    let index3 = index2;
                    if(result.success) {
                      logger.debug(getFileIdentifier(), index3, '. - Success=True, Result:', result.message);
                    }
                    else {
                      logger.error(getFileIdentifier(), index3, '. - Success=False, Result:', result.message);
                    }
                  });
                }
              });

              QuickTask.query()
              .findById(request.quickTaskId)
              .skipUndefined()
              .update({
                isExpiryEmailSent : true
              })
              .asCallback((err, quickTask) => {
                if(err) {
                  logger.error(getFileIdentifier(), 'isExpiryEmailSent could not be updated in quickTask[id: ' + request.quickTaskId + ']. Error message is :', err);
                }
                else {
                  logger.debug(getFileIdentifier(), 'isExpiryEmailSent updated in quickTask[id: ' + request.quickTaskId + ']');
                }
              });
            } catch (e) {
              logger.error(getFileIdentifier(), e);
            }
          }
        });
      });
    });
  });
}

function getFileIdentifier() {
  return 'signatureRequestExpiry -';
}
