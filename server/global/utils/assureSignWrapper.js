/**
 * A set of wrapper utils to deal with the assureSign API.
 */

const assureSign = require('./assureSign')
const Promise = require('bluebird');
const appUrl = require('../../config')[process.env.NODE_ENV].appUrl;
let logger = global.logger;

const getAuthTokenWrapper = (firm, staff) => {
  return new Promise((resolve) => {
    assureSign.getAuthToken(firm, staff, (result) => {
      resolve(result);
    });
  });
}

exports.getTemplateByEnvelopeId = (firm, staff, envelopeId, authToken) => {
  return new Promise((resolve, reject) => {
    assureSign.getEnvelope(firm, staff, authToken, envelopeId, getEnvelopeResult => {
      if(!getEnvelopeResult.success) {
        reject(getEnvelopeResult)
      }
      else {
        //logger.debug('getEnvelopeResult:', getEnvelopeResult);
        const envelope = getEnvelopeResult.envelope;

        assureSign.getAllTemplates(firm, staff, authToken, getAllTemplatesResult => {
            //logger.debug('getAllTemplatesResult:', getAllTemplatesResult);
            if(!getAllTemplatesResult.success) {
            reject(getAllTemplatesResult)
          }
          else {
            const templates = getAllTemplatesResult.templates;
            let matchedTemplates = templates.filter((template) => {
              return template.name === envelope.name;
            });

            if(matchedTemplates && matchedTemplates.length > 0) {
              resolve({success: true, template: matchedTemplates[0] });
            }
            else {
              reject({success: false, message: 'Template not found.' });
            }
          }
        });
      }
    });
  });
}

exports.cancelEnvelope = async (firm, staff, authToken, envelopeId, callback) => {
  if(!envelopeId) {
    callback({success: true});
    return;
  }
  if(!authToken) {
    let authTokenObj = await getAuthTokenWrapper(firm, staff);
    if(!authTokenObj.success) {
      callback(authTokenObj.message, null);
      return;
    }
    authToken = authTokenObj.token;

    assureSign.cancelEnvelope = (firm, staff, authToken, envelopeId, (result) => {
      callback(authTokenObj.message, null);
    });
  }
}

exports.submitEnvelope = async (loggedInStaff, firm, io, socketId, redirectUrl, quickTask, signers, authToken, callback) => {
  let clientId = quickTask._client;
  let quickTaskId = quickTask._id;
  let customTemplate = quickTask.template;
  let templateId = quickTask.assureSignTemplateId;
  let signerSigningOrderType = quickTask.signerSigningOrderType ? quickTask.signerSigningOrderType : "sequential";

  io.to(socketId).emit('signature_progress', {message: 'Authorizing', percent: 15});
  if (!!templateId && templateId !== 'custom') {

    // with selected template 
    // Now fetch the blank template
    io.to(socketId).emit('signature_progress', {message: 'Setting up template', percent: 30});
    assureSign.getTemplateById(firm, loggedInStaff, authToken, templateId, getTemplateByIdResult => {
      if(!getTemplateByIdResult.success) {
        return callback(getTemplateByIdResult)
      } else {
        const template = getTemplateByIdResult.template;

        if (template && template.content && template.content.documents && template.content.documents[0] && template.content.documents[0].name) {
          template.content.documents[0].name = template.name;
        }

        if (template && template.content && template.content.envelope && template.content.envelope.name) {
          template.content.envelope.name = template.name;
        }
        
        // This method will attach the file (if one is present) and the signers to the template and return a prepared envelopeId.
        // We only allow one file to be uploaded to a signature request. So we'll pass quickTask._unsignedFiles[0].
        io.to(socketId).emit('signature_progress', {message: 'Preparing document', percent: 45});
        assureSign.prepareEnvelope(firm, loggedInStaff, authToken, quickTask._unsignedFiles[0], signers, template, prepareEnvelopeResult => {
          if(!prepareEnvelopeResult.success) {
            return callback(prepareEnvelopeResult)
          }
          else {
            // We could call prepareEnvelope again if we wanted to change anything.
            // Now that we are done building the envelope we have to submit it.
            const preparedEnvelopeId = prepareEnvelopeResult.preparedEnvelopeId

            io.to(socketId).emit('signature_progress', {message: 'Finalizing document', percent: 60});
            assureSign.submitPreparedEnvelope(firm, loggedInStaff, authToken, preparedEnvelopeId, submitPreparedEnvelopeResult => {
              // console.log("RESULT OF SUBMIT PREPARED ENVELOPE");
              // logger.info(submitPreparedEnvelopeResult)
              if(!submitPreparedEnvelopeResult.success) {
                return callback(submitPreparedEnvelopeResult)
              } else {
                const finalEnvelopeId = submitPreparedEnvelopeResult.finalEnvelopeId;
                // set custom url, if applicable
                let firmUrl = appUrl;

                if(firm && firm.domain) {
                  firmUrl = firm.domain;
                }
                // Pass the finalEnvelopeId and the redirect url. Returns same finalEnvelopeId and signingLinks.
                redirectUrl = redirectUrl ? encodeURI(redirectUrl) : encodeURI(`http://${firmUrl}/portal/${clientId}/quick-tasks/${quickTaskId}`)
                io.to(socketId).emit('signature_progress', {message: 'Generating links', percent: 75});
                assureSign.getSigningLinks(firm, loggedInStaff, authToken, finalEnvelopeId, redirectUrl, getSigningLinksResult => {
                  return callback(getSigningLinksResult)
                });
              }
            });
          }
        });
      }
    });
  } else if (customTemplate) {
    logger.debug('3. for custom template');

    const fileId = quickTask._unsignedFiles[0];
    io.to(socketId).emit('signature_progress', { message: 'Setting up template', percent: 60 });
    assureSign.SubmitCustomizeTemplate(firm, loggedInStaff, fileId, authToken, signers, customTemplate, signerSigningOrderType, submitresult => {

      if (!submitresult.success) {
        return callback(submitresult)
      } else {
        
        let firmUrl = appUrl;
        if(firm && firm.domain) {
          firmUrl = firm.domain;
        }

        const envelopeID = submitresult.envelopeID;
        redirectUrl = redirectUrl ? encodeURI(redirectUrl) : encodeURI(`http://${firmUrl}/portal/${clientId}/quick-tasks/${quickTaskId}`)
        io.to(socketId).emit('signature_progress', {message: 'Generating links', percent: 75});
        assureSign.getSigningLinks(firm, loggedInStaff, authToken, envelopeID, redirectUrl, linkresult => {
          return callback(linkresult);
        });
      }
    });
  }
  else {
    logger.debug('4. no template');
    return callback({success: false, message: 'No template'});
  }
}
