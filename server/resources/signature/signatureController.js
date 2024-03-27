/**
 * Sever-side controllers for ShareLink.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the ShareLink
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

 // libraries
const async = require('async')

// models
const ShareLink = require('../shareLink/ShareLinkModel');
const QuickTask = require('../quickTask/QuickTaskModel');
const Firm = require('../firm/FirmModel');
const Staff = require('../staff/StaffModel');

let logger = global.logger;

const assureSign = require('../../global/utils/assureSign')
const assureSignWrapper = require('../../global/utils/assureSignWrapper')

const CSVUtils = require('../../global/utils/CSVUtils');
const stringUtils = require('../../global/utils/stringUtils.js');
const emailUtil = require('../../global/utils/email');

let DateTime = require('luxon').DateTime;

const staffCtrl = require('../staff/staffController');

const { getSearchObject } = require('../searchUtil');
const signatureDAO = require('./signatureDAO');
const staffDAO = require('../staff/staffDAO');
const firmDAO = require('../firm/firmDAO');
const firmsController = require('../firm/firmsController');
const _ = require('lodash');

const PLACEHOLDER_SIGNERNAME = '{SignerName}';

exports.search = (req, res) => {
  logger.debug(getFileIdentifier(), 'requesting user id: ', req.user._id);
  logger.debug(getFileIdentifier(), 'request body: ', req.body);
  let isAcceptCSV = req.header('Accept') === 'text/csv';
  const searchObj = getSearchObject(req.body);
  logger.debug(getFileIdentifier(), 'firmId: ', searchObj.firmId);
  if(!searchObj.firmId) {
    res.send({success: false, message: 'firmId is required.'})
    return;
  }
  staffCtrl.utilGetLoggedInByFirm(req.user._id, searchObj.firmId, result => {
    if(!result.success) {
      logger.error(getFileIdentifier(), 'Error: ', 'Problem fetching logged in staff object. Unable to complete request.')
      res.send(result)
    } else {
      if(isAcceptCSV) {
        searchObj.includeCount = false;
        searchObj.orderBy = 'id';
        searchObj.sortOrderAscending = true;
      }
      signatureDAO.search(searchObj, isAcceptCSV)
      .then(result => {
        //logger.debug(getFileIdentifier(), 'signatureDAO.search result: ', result);
        result.list.forEach((item) => {
          item['createdBy'] = stringUtils.concatenate(item.createdByFirstName, item.createdByLastName, ' ', true);
          item['userName'] = stringUtils.concatenate(item.userFirstName, item.userLastName, ' ', true);
          
          if(isAcceptCSV) {
            if(!!item.createdDateTime) {
              item.createdDateTime = DateTime.fromMillis(item.createdDateTime.getTime()).toFormat('yyyy-LL-dd HH:mm:ss');
            }
            if(!!item.updatedDateTime) {
              item.updatedDateTime = DateTime.fromMillis(item.updatedDateTime.getTime()).toFormat('yyyy-LL-dd HH:mm:ss');
            }
  
            if(!!item.expireDate) {
              item.expireDate = DateTime.fromMillis(item.expireDate.getTime()).toFormat('yyyy-LL-dd');
            }
            if(!!item.responseDate) {
              item.responseDate = DateTime.fromMillis(item.responseDate.getTime()).toFormat('yyyy-LL-dd');
            }
  
            delete item.createdByFirstName;
            delete item.createdByLastName;
            delete item.userFirstName;
            delete item.userLastName;
            delete item.quickTaskId;
          }
        });
        if(isAcceptCSV) {
          CSVUtils.toCSV(result.list)
          .then(csv => {
              res.setHeader('Content-Type', 'text/csv');
              res.setHeader('Content-Disposition', 'attachment; filename=SignatureRequests.csv');
              res.send(csv);
          })
          .catch(err => {
              logger.error(getFileIdentifier(), 'Error: ', err);
              res.setHeader('Content-Type', 'text/csv');
              res.setHeader('Content-Disposition', 'attachment; filename=InternalError.csv');
              res.status(500).send(err);
          });
        }
        else {
          res.send({success: result.success, results:result.list, totalCount: result.totalCount});
        }
      });
    }
  });
}

exports.delete = (req, res) => {
  deleteSignature(req.params.id, req.user._id, result => {
    res.send(result);
  });
}

exports.bulkDelete = (req, res) => {
  const signatureIds = req.body;
  logger.debug(getFileIdentifier(), 'bulk delete shareLink ids=', signatureIds);

  async.map(signatureIds,
    (signatureId, callback) => {
      deleteSignature(signatureId, req.user._id, result => {
        if(result.success) {
          return callback(null, {id: signatureId, message: ''});
        }
        else {
          return callback(null, {id: signatureId, message: result.message});
        }
      });
    },
    (err, list) => {
      logger.debug(getFileIdentifier(), 'success signature bulk delete', err, list);
      if(err) {
        res.send({ success: false, message: err });
      }
      else {
        let errors = list.filter(item => {
          return (!!item.message);
        });
        res.send({ success: (!errors || errors.length < 1), data: list });
        return;
      }
    }
  );
}

const deleteSignature = (signatureId, loggedInUserId, callback) => {
  logger.debug(getFileIdentifier(), 'delete shareLink id=', signatureId);
  ShareLink.query()
  .where({_id: signatureId})
  .then(signatures => {
    if(signatures) {
      staffCtrl.utilGetLoggedInByFirm(loggedInUserId, signatures[0]._firm, staffResult => {
        if(!staffResult.success) {
          logger.error(getFileIdentifier(), 'Error: ', 'Permission issues: Logged in user[id: ' + loggedInUserId + '] is not from the same firm[id: ' + signatures[0]._firm + '].')
          return callback({success: false, message: 'You do not have permission to delete this signature.'})
        } else {
          signatureDAO.delete(signatures[0], async (deleteResult) => {
            const fromInfo = await firmsController.getEmailFromInfo(signatures[0]._firm, signatures[0]._createdBy);
            sendSignatureRequestDeletedEmail(deleteResult.data.quickTask, fromInfo, emailResult => {
              logger.debug(getFileIdentifier(), emailResult);
            });
            if(!signatures[0].expireDate || signatures[0].expireDate >= new Date()) {
              Firm.query()
              .findById(signatures[0]._firm)
              .returning(['contextIdentifier'])
              .then(firm => {
                if(firm) {
                    cancelEnvelopeInAssureSign(firm, staffResult.staff, deleteResult.data.quickTask.envelopeId, cancelEnvelopeResult => {
                    logger.debug(getFileIdentifier(), cancelEnvelopeResult);
                  });
                }
              });
            }
            else {
              logger.debug(getFileIdentifier(), 'Enveloped already expired. So no need to sent cancel request to AssureSign.');
            }
            return callback(deleteResult);
          });
        }
      });
    } else {
      return callback({success: false, message: 'Invalid signature'})
    }
  });

}

exports.sendReminder = async (req, res) => {
  logger.debug(getFileIdentifier(), 'received sendReminder request for signature [id:' + req.params.id + '].');
  let signature = null;
  try {
    signature = await signatureDAO.getSignature(parseInt(req.params.id));
  }
  catch(error) {
    logger.debug(getFileIdentifier(), 'Error - ', error);
    res.send({success: false, message: 'invalid signature request'});
    return;
  }
  if(await staffDAO.isStaff(parseInt(req.user._id), signature.firmId) === false) {
    res.send({success: false, message: 'Invalid request'});
  }

  logger.debug(getFileIdentifier(), ' Here - signature:', signature);

  const fromInfo = await firmsController.getEmailFromInfo(signature.firmId, req.user._id);

  logger.debug(getFileIdentifier(), ' Here - fromInfo:', fromInfo);

  sendSignatureReminderEmail(signature, fromInfo, data => {
    logger.debug(getFileIdentifier(), ' Here - email response:', data);
    res.send(data);
  });
}

exports.bulkUpdateExpiry = async (req, res) => {
  const {signatureIds, expireDate} = req.body;
  logger.debug(getFileIdentifier(), 'bulk update shareLink ids=', signatureIds);
  const socketId = req.user && req.user._id;
  let count = 1;

  req.io.to(socketId).emit('start_progress', 'In Progress');
  // use mapSeries when loop has an rest api to be procedural
  async.mapSeries(signatureIds, (signatureId, callback) => {
    req.io.to(socketId).emit('progress_status', parseInt((count / signatureIds.length) * 100));
    count++;
    try {
      updateSignatureExpiry(signatureId, expireDate, req.user._id, req.io, callbackResult => {
        callback(null, {id: signatureId, message: callbackResult.message});
      });
    }
    catch(error) {
      logger.error(getFileIdentifier(), 'Error: ', 'unexpected error:', error);
      callback(null, {id: signatureId, message: error.message});
    }
  }, (err, list) => {
    logger.debug(getFileIdentifier(), 'Signature bulk update result:', err, list);
    req.io.to(socketId).emit('finish_progress', 'Completed');
    if(err) {
      res.send({ success: false, message: err });
      return;
    }
    else {
      let errors = list.filter(item => {
        return (!!item.message);
      });
      res.send({ success: (!errors || errors.length < 1), data: list });
      return;
    }
  });
}

const updateSignatureExpiry = async (signatureId, expireDate, userId, io, callback) => {
  logger.debug(getFileIdentifier(), 'update shareLink id=', signatureId);
  let signature = null;
  let staff = null;
  try {
    signature = await ShareLink.query().findById(signatureId).returning('*');
  }
  catch(error) {
    callback({success: false, message:'Invalid signature.'});
    logger.error(getFileIdentifier(), 'Error: ', signatureId, '=>', 'Invalid signature');
    return;
  }
  try {
    staff = await Staff.query().where({_user: parseInt(userId), _firm: parseInt(signature._firm)}).first();
  }
  catch(error) {
    // does not have permission?
    callback({success: false, message:'You do not have permission to update this signature'});
    logger.error(getFileIdentifier(), 'Error: ', signatureId, '=>', 'You do not have permission to update this signature');
    return;
  }

  // ignore if signature request is already closed or in progress (quickTask.responseDate is not null)
  if(!signature._quickTask) {
    signature.expireDate = new Date(expireDate);
    signature.updated_at = new Date();
    try {
      let updatedSignature = await ShareLink.query().findById(signatureId).update(signature).returning('*');
      callback({success: true, message:''});
    }
    catch(error) {
      logger.error(getFileIdentifier(), 'Error: ', 'Error updating expiry date of the signature: ', error);
      callback({success: false, message:error.message});
    }
    // return after updating shareLinks object if _quickTask is null
    return;
  }


  let quickTask = null;
  let firm = null;
  try {
    quickTask = await QuickTask.query().findById(signature._quickTask).returning('*');
    // status is closed or in progress?
    if(quickTask.status === 'closed' || quickTask.responseDate != null) {
      logger.error(getFileIdentifier(), 'Error: ', signatureId, '=>', 'Invalid quickTask status [quickTaskId:', quickTask._id, ']');
      return callback({success: false, message:'Invalid status.'});
    }

    try {
      firm = await Firm.query().findById(signature._firm);
    }
    catch(error) {
      logger.error(getFileIdentifier(), 'Error: ', signatureId, '=>', 'Could not find firm [id: ' + signature._firm + ']');
      return callback({success: false, message: 'Could not find firm.'});
    }


    let oldExpireDate = signature.expireDate;
    signature.expireDate = new Date(expireDate);
    signature.updated_at = new Date();
    try {
      assureSign.getAuthToken(firm, staff, async (result) => {
        let authToken = result.token;
        logger.debug(getFileIdentifier(), signatureId, '=>', 'authToken', authToken);
        if(oldExpireDate && oldExpireDate > new Date() && quickTask.envelopeId) {
          logger.debug(getFileIdentifier(), signatureId, '=>', 'Cancel existing envelope', quickTask.envelopeId);
          // cancel existing assureSign envelope
          let cancelEnvelopeResult = await cancelEnvelope(firm, staff, quickTask.envelopeId, authToken);
          logger.debug(getFileIdentifier(), signatureId, '=>', signatureId, 'Existing envelope cancelled', cancelEnvelopeResult);
        }
        logger.debug(getFileIdentifier(), 'About to call submitEnvelopeAndSaveQuickTask', 'for signature id', signatureId);
        const fromInfo = await firmsController.getEmailFromInfo(signature._firm, userId);
        submitEnvelopeAndSaveQuickTask(staff, firm, io, userId, null, quickTask, authToken, fromInfo, async submitEnvelopeAndSaveQuickTaskResult2 => {
          logger.debug(getFileIdentifier(), signatureId, '=>', 'submitEnvelopeAndSaveQuickTask executed with result ', submitEnvelopeAndSaveQuickTaskResult2);
          if(submitEnvelopeAndSaveQuickTaskResult2.success) {
            let updatedSignature = await ShareLink.query().findById(signatureId).update(signature).returning('*');
            logger.debug(getFileIdentifier(), signatureId, '=>', 'Signature expiry date updated: ', updatedSignature);
            return callback({success: true, message:''});
          }
          else {
            //return callback({success: false, message:submitEnvelopeAndSaveQuickTaskResult2.message});
            return callback({success: false, message: 'An internal error occurred. Retrying won\'t resolve it.'});
          }
        });
      });
    }
    catch(error) {
      logger.error(getFileIdentifier(), 'Error: ', signatureId, '=>', 'Error updating expiry date of the signature: ', error);
      return callback({success:false, message:error.message});
    }
  }
  catch(error) {
    logger.error(getFileIdentifier(), 'Error: ', signatureId, '=>', 'Invalid quickTask [id:', signature._quickTask, ']');
    return callback({success: false, message:'Invalid task.'});
  }
}

function sendSignatureReminderEmail(quickTask, fromInfo, callback) {
  const subject = 'Signature request reminder';
  const message = `Hi ${PLACEHOLDER_SIGNERNAME},<br/><br/>Kindly sign the requested document at the earliest by clicking the link below.`;
  sendEmail(subject, message, quickTask, true, fromInfo, data => {
    callback(data);
  });
}

function sendExpireDateUpdatedEmail(quickTask, fromInfo, callback) {
  const subject = 'Signature request expiry date updated';
  const message = `Hi ${PLACEHOLDER_SIGNERNAME},<br/><br/>Expiry date for the following signature request has been updated.`;
  sendEmail(subject, message, quickTask, true, fromInfo, data => {
    callback(data);
  });
}

function cancelEnvelope(firm, staff, envelopeId, token) {
  return new Promise(resolve => {
    if(!envelopeId) {
      resolve({error: null, data: 'No task.'});
    }
    else {
      assureSign.cancelEnvelope(firm, staff, token, envelopeId, result => {
        resolve(result);
      });
    }
  });
}

function cancelEnvelopeInAssureSign(firm, staff, envelopeId, callback) {
  if(!envelopeId) {
    callback({success: true, data: 'No task.'});
  }
  else {
    assureSign.getAuthToken(firm, staff, result => {
      if(!result.success) {
        callback({success: false, result, message: 'Could not get assureSign auth token.'});
      } else {
        const token = result.token;
        assureSign.cancelEnvelope(firm, staff, token, envelopeId, cancelResult => {
          callback(cancelResult);
        });
      }
    });
  }
}

function sendSignatureRequestDeletedEmail(quickTask, fromInfo, callback) {
  const subject = 'Signature request canceled';
  const message = `Hi ${PLACEHOLDER_SIGNERNAME},<br/><br/>A signature request has been canceled.`;
  sendEmail(subject, message, quickTask, false, fromInfo, data => {
    callback(data);
  });
}

function sendEmail(subject, messageTemplate, quickTask, includeLink, fromInfo, callback) {
  if(!quickTask) {
    return callback({success: false, message: 'No QuickTask.'});
  }

  if(!quickTask.signingLinks || !_.isArray(quickTask.signingLinks) || quickTask.signingLinks.length < 1) {
    return callback({success: false, message: 'No signing links.'});
  }

  const template = 'notification-email';
  quickTask.signingLinks.forEach(signingLink => {
    if(signingLink.signatoryEmail) {
      const targets = [signingLink.signatoryEmail];
      logger.debug(getFileIdentifier(), 'Email to be sent to ', signingLink.signerName, signingLink.signatoryEmail);
      let message = _.replace(messageTemplate, PLACEHOLDER_SIGNERNAME, signingLink.signerName);
      const notifContent = `<h4 style='font-weight:500;font-size:1rem;line-height:135%'>${message}</h4><br/>`
      let link = '';
      let notifLink = ''
      if(includeLink && !!signingLink.url) {
        link = signingLink.url;
        notifLink = `<td style='padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;' class='mcnButtonBlockInner' valign='top' align='center'>
          <table class='mcnButtonContentContainer' style='border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;' cellspacing='0' cellpadding='0' border='0'>
              <tbody>
                  <tr>
                      <td class='mcnButtonContent' style='font-family: Helvetica; font-size: 18px; padding: 18px;' valign='middle' align='center'>
                        <a class='mcnButton ' title='View in ImagineShare' href=${link} target='_self' style='font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;'>Signature Request</a>
                      </td>
                  </tr>
              </tbody>
          </table>
        </td>`;
      }
  
      const content = [
        { name: 'notifLink', content: notifLink }
        , { name: 'notifContent', content: notifContent}
        , { name: 'firmLogo', content: '' }
      ]
      if(targets && targets.length > 0) {
        emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
          return callback(data);
        }); 
      }
    }
  });
}

const submitEnvelopeAndSaveQuickTask = async (loggedInStaff, firm, io, socketId, redirectUrl, quickTask, authToken, fromInfo, callback) => {
  logger.debug(getFileIdentifier(), 'in submitEnvelopeAndSaveQuickTask');

  let signers = quickTask.signingLinks.map(link => {
    let names = link.signerName.split(' ');
    let firstName = (names[0] ? names[0] : '');
    let lastName = names.length > 1 ? ' ' + (names[1] ? names[1] : '') : '';
    return {username: link.signatoryEmail, firstName, lastName};
  });

  if(!quickTask.assureSignTemplateId) {

    let customTemplate = quickTask.template;
    if(customTemplate && customTemplate.signers && customTemplate.signers.length > 0) {
      quickTask.assureSignTemplateId = 'custom';
    } else {
      try {
        let template = await assureSignWrapper.getTemplateByEnvelopeId(firm, loggedInStaff, quickTask.envelopeId, authToken);
        quickTask.assureSignTemplateId = template.template.templateID;
        logger.debug(getFileIdentifier(), '2. templateId (raed from assureSign): ', quickTask.assureSignTemplateId);
      }
      catch(error) {
        return callback(error);
      }
    }
  }
  let templateId = quickTask.assureSignTemplateId;
  assureSignWrapper.submitEnvelope(loggedInStaff, firm, io, socketId, redirectUrl, quickTask, signers, authToken, result => {
    //logger.debug(getFileIdentifier(), 'submitEnvelope result', result);
    if(!result.success) {
      return callback(result);
    }
    else {
      io.to(socketId).emit('signature_progress', {message: 'Notifying signers', percent: 90});
      // save the signingLink and envelopeId on the quickTask and return the quickTask to the front end.
      let signingLinks = result.signingLinks;
      signingLinks.forEach((link, i) => {
        // We'll need to save the signers names on each signing link so we can use it to display direct links
        // for each signer in the case that they are sharing an email address.
        // Add the signer's name so they know which link is theirs.
        const currentSigner = signers.filter(signer => signer.username === link.signatoryEmail)[0];
        logger.debug(getFileIdentifier(), 'currentSigner:', currentSigner, 'for email: ', link.signatoryEmail);
        link.signerName = currentSigner.firstName + ' ' + currentSigner.lastName;
      });

      QuickTask.query()
      .findById(quickTask._id)
      .patch({
        envelopeId: signingLinks[0].envelopeID
        , signingLinks: JSON.stringify(signingLinks)
        , status: 'open'
        , assureSignTemplateId: templateId
      })
      .returning('*')
      .asCallback(async (err, updatedQuickTask) => {
        logger.debug(getFileIdentifier(), 'QuickTask updated result', err, updatedQuickTask);
        if(err || !updatedQuickTask) {
          return callback({success: false, message: 'Unable to update quickTask. Please try again.', err});
        }
        else {
          logger.debug(getFileIdentifier(), 'QuickTask updated with new envelopID', updatedQuickTask.envelopeId);
          // TODO create new envelope in AssureSign and set the id in quickTask record
          logger.debug(getFileIdentifier(), 'About to send email(s)');
          sendExpireDateUpdatedEmail(updatedQuickTask, fromInfo, data => {
            logger.debug(getFileIdentifier(), data);
          });

          return callback({success: true, quickTask: updatedQuickTask});
        }
      });
    }
  });
}

function getSignerEmails(signingLinks) {
  return _.compact(_.map(signingLinks, _.property('signatoryEmail')));
}

function getFileIdentifier() {
  return 'signatureController -';
}