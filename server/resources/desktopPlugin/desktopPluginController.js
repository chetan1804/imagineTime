// model
const Client = require('../client/ClientModel');
const Firm = require('../firm/FirmModel');
const Staff = require('../staff/StaffModel');
const ShareLink = require('../shareLink/ShareLinkModel');
const QuickTask = require('../quickTask/QuickTaskModel');
const ClientUser = require('../clientUser/ClientUserModel');

// ctrls
const shareLinksController = require('../shareLink/shareLinksController');
const quickTasksController = require('../quickTask/quickTasksController');
const fileActivityController = require('../fileActivity/fileActivityController');

// device os
const os = require( 'os' );
const permissions = require('../../global/utils/permissions')
const async = require('async');
const emailUtil = require('../../global/utils/email');
const StaffClient = require('../staffClient/StaffClientModel');
const networkInterfaces = os.networkInterfaces();
const assureSign = require('../../global/utils/assureSign');

const appUrl = require('../../config')[process.env.NODE_ENV].appUrl;

exports.desktopFirms = (req, res) => {
    console.log("get firm list associated to active staff by req.user._id");

    Staff.query()
        .where({ _user: req.user._id, status: 'active' })
        .asCallback((err, staff) => {
            if(err || !staff) {
              res.send({success: false, message: "1. Error retrieving Staff by User"})
            } else {
              logger.info('staff found');
              console.log(staff);
              const firmIds = staff.map(s => s._firm);

              const commadInFields = [
                'f._id', 'f.created_at', 'f.updated_at', 'f.name', 'f.logoUrl', 'f._primaryAddress'
                , 'f._primaryPhone', 'f.document_vectors', 'f._subscription', 'f._file', 'f.domain'
                , 'f.eSigAccess', 'f.contextIdentifier', 'f.contextUsername', 'f.apiKey', 'f.apiUsername'
                , 'f.expireLinks', 'f.archiveFile', 'f.authDefault', 'f.secretQuestions'
              ];

              if (firmIds && firmIds.length) {
                Firm.query().from('firms as f')
                .leftJoin('subscriptions as s', 's._firm', 'f._id')
                .whereIn('f._id', firmIds)
                .whereNot({ 's.status': 'canceled' })
                .select(...commadInFields)
                .groupBy(['f._id'])
                .asCallback((err, firms) => {
                    if(err || !firms) {
                        res.send({success: false, message: err || "3. Error retrieving Firms by User"})
                    } else {
                        res.send({success: true, data: firms, firms });
                    }
                })
              } else {
                res.send({success: true, data: [], firms: [] });
              }
            }
          })
}


exports.desktopClients = (req, res) => {
    console.log("get client list associated to active staff by firmId");

    // check staff 
    Staff.query()
        .where({ _user: req.user._id, _firm: req.params.firmId, status: "active" })
        .first()
        .then(staff => {
            if (staff) {

                // check firm
                Firm.query()
                    .findById(req.params.firmId)
                    .then(firm => {
                        if(!firm) {
                            res.send({success: false, message: "Could not find matching Firm"})
                          } else {

                            // check user have an access to this firm
                            permissions.utilCheckFirmPermission(req.user, req.params.firmId, 'access', permission => {
                                if(!permission) {
                                    res.send({success: false, message: "You do not have permission to access this Firm"})
                                } else {
                                    
                                    const data = { selectedStaff: staff, firm, clients: [] };
                                    const commadInFields = [
                                        '_id', 'created_at', 'updated_at', 'name', 'website', 'accountType'
                                        , 'engagementTypes', 'onBoarded', '_firm', '_primaryContact', '_primaryAddress'
                                        , '_primaryPhone', 'logoPath', 'document_vectors', 'identifier', 'sharedSecretPrompt'
                                        , 'sharedSecretAnswer', 'sendNotifEmails', 'status'
                                    ];

                                    if (staff.owner) {
                                        // return all clients
                                        Client.query()
                                            .where({ _firm: req.params.firmId, status: "visible" })
                                            .select(...commadInFields)
                                            .then(clients => {
                                                data["clients"] = clients;
                                                res.send({ success: true, data });
                                            })
                                            .catch(err => {
                                                res.send({success: false, message: 'Internal server error'});
                                            })
                                    } else {
                                        StaffClient.query()
                                            .where({ _staff: staff._id })
                                            .then(staffClients => {
                                                const clientIds = staffClients ? staffClients.map(staffClient => staffClient._client) : [];
                                                if (clientIds && clientIds.length) {
                                                    Client.query()
                                                        .whereIn("_id", clientIds)
                                                        .where({ status: "visible"})
                                                        .select(...commadInFields)
                                                        .then(clients => {
                                                            data["clients"] = clients;
                                                            res.send({ success: true, data });
                                                        });
                                                } else {
                                                    res.send({ success: true, data });
                                                }
                                            })
                                            .catch(err => {
                                                res.send({success: false, message: 'Internal server error'});
                                            })
                                    }
                                }
                            })
                        }
                    })
                    .catch(err => {
                        res.send({success: false, message: 'Internal server error'});
                    })
            } else {
                res.send({ success: false, message: "Could not find matching Staff" })
            }
        })
        .catch(err => {
            res.send({success: false, message: 'Internal server error'});
        })
}

exports.createSignatureRequest = (req, res) => {
    const socketId = req.user._id;
    let responseData = {};
    exports.checkPermission(req, responseData, result => {
        if (!result.success) {
            req.io.to(socketId).emit('signature_progress_error', { message: result.message });
            res.send(result);
        } else {
            responseData = result.responseData;
            exports.createShareLink(req, responseData, result => {
                if (!result.success) {
                    req.io.to(socketId).emit('signature_progress_error', { message: result.message });
                    res.send(result);
                } else {
                    responseData = result.responseData;
                    exports.createQuickTask(req, responseData, result => {
                        if (!result.success) {
                            req.io.to(socketId).emit('signature_progress_error', { message: result.message });
                            res.send(result);
                        } else {
                            responseData = result.responseData;
                            exports.updateShareLink(req, responseData, result => {
                                if (!result.success) {
                                    req.io.to(socketId).emit('signature_progress_error', { message: result.message });
                                    res.send(result);
                                } else {
                                    const { shareLink, quickTask } = responseData;
                                    if (shareLink && quickTask) {
                                        const response = {
                                            success: true
                                            , genericUrl: shareLink.url
                                            , signingList: quickTask.signingLinks
                                        }
                                        req.io.to(socketId).emit('signature_progress_success', response);
                                        res.send(response);
                                    } else {
                                        req.io.to(socketId).emit('signature_progress_success', result);
                                        res.send(result);
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

exports.createSignature = (req, res) => {
    
    const socketId = req.user._id;
    delete req.body.viewingAs;
    let responseData = {};  

    exports.checkPermission(req, responseData, result => {
        if (!result.success) {
            res.send(result);
        } else {
            responseData = result.responseData;
            exports.createShareLink(req, responseData, result => {
                if (!result.success) {
                    res.send(result);
                } else {
                    responseData = result.responseData;
                    exports.createQuickTask(req, responseData, result => {
                        if (!result.success) {
                            res.send(result);
                        } else {
                            responseData = result.responseData;
                            exports.updateShareLink(req, responseData, result => {
                                if (!result.success) {
                                    res.send(result);
                                } else {
                                    const { shareLink, quickTask } = responseData;
                                    if (shareLink && quickTask) {
                                        quickTask.signingLinks[0].signatoryName = "REVIEW AND SIGN";
                                        quickTask.signingLinks[0].signerName = "REVIEW AND SIGN";
                                        quickTask.signingLinks[0].url = shareLink.url;
                                        const response = {
                                            success: true
                                            , genericUrl: shareLink.url
                                            , signingList: [quickTask.signingLinks[0]]
                                        }
                                        res.send(response);
                                    } else {
                                        res.send(result);
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

exports.createSignatureSocket = (req, res) => {
    
    const socketId = req.user._id;
    let responseData = {};

    res.send({ success: true });

    exports.checkPermission(req, responseData, result => {
        if (!result.success) {
            req.io.to(socketId).emit('signature_progress_error', { message: result.message });
        } else {
            responseData = result.responseData;
            exports.createShareLink(req, responseData, result => {
                if (!result.success) {
                    req.io.to(socketId).emit('signature_progress_error', { message: result.message });
                } else {
                    responseData = result.responseData;
                    exports.createQuickTask(req, responseData, result => {
                        if (!result.success) {
                            req.io.to(socketId).emit('signature_progress_error', { message: result.message });
                        } else {
                            responseData = result.responseData;
                            exports.updateShareLink(req, responseData, result => {
                                if (!result.success) {
                                    req.io.to(socketId).emit('signature_progress_error', { message: result.message });
                                } else {
                                    const { shareLink, quickTask } = responseData;
                                    if (shareLink && quickTask) {
                                        const response = {
                                            success: true
                                            , genericUrl: shareLink.url
                                            , signingList: quickTask.signingLinks
                                        }
                                        req.io.to(socketId).emit('signature_progress_success', response);
                                    } else {
                                        req.io.to(socketId).emit('signature_progress_success', result);
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

exports.updateShareLink = (req, responseData, cb) => {
    const shareLinkId = responseData.shareLink._id // has to be an int

    // We need an override for this when it is created from desktop.
    let sendEmails = false;
    if (req.body.viewingAs === "workspace") {
        sendEmails = true;
    }

    // staff and staffClients should be able to update everything.
    // Everyone else should only be able to update _files
    ShareLink.query()
    .findById(shareLinkId)
    .asCallback((err, oldShareLink) => {
      if(err || !oldShareLink) {
        logger.error('ERROR: ')
        logger.info(err || "Could not find ShareLink")
        res.send({ success: false, message: err || "Could not find ShareLink" })
      } else {

        if(req.user && req.user._id) {
  
          // For now we are only doing a firm level check here. Any staff of this firm can update every sharelink for this firm.
          // do firm "access" level permission check.
          permissions.utilCheckFirmPermission(req.user, oldShareLink._firm, "access", permission => {
            if(!permission) {
              // User doesn't have specific permission, only allow them to update the _files array.
              oldShareLink = { _files: oldShareLink._files }
            } else {
                oldShareLink._quickTask = responseData.quickTask._id;
            }
            logger.info(permission ? "Updating ShareLink with firm access permission" : "Updating ShareLink with restrictions.")
            // Update.
            shareLinksController.utilUpdate(req.user, shareLinkId, oldShareLink, sendEmails, result => {
              
              const { shareLink } = result;
              let actionText = ""; 
              let fileId = null;
  
              // file activity
              if (result.success && shareLink) {
                if (shareLink._quickTask && shareLink.type === "signature-request") {
                  QuickTask.query().findById(shareLink._quickTask)
                    .then(quickTask => {
                      if (quickTask) {

                        // requested signature 
                        if (!quickTask._returnedFiles.length && quickTask._unsignedFiles.length) {
                          actionText = `Request signature by %USER%`;
                          fileId = quickTask._unsignedFiles[0];
                        }

                        if (actionText && fileId) {
                          fileActivityController.utilCreateFromResource(
                            req
                            , fileId, shareLink._firm, shareLink._client, req.user ? req.user._id : null
                            , "", actionText
                            , "" // `/firm/${shareLink._firm}/workspaces/${shareLink._client}/files/${fileId}`
                            , "" // `/portal/${shareLink._client}/files/${fileId}`
                          );
                        }  
                      }
                    });
                } 
              }
              cb(result);
            })
          });
  
          // NOTE: If we want to further restrict this by staffClient, uncomment the code below.
          // if(oldShareLink._client) {
          //   // do client "access" level permission check.
          //   permissions.utilCheckClientPermission(req.user, oldShareLink._client, "access", permission => {
          //     if(!permission) {
          //       // User doesn't have specific permission, only allow them to update the _files array.
          //       shareLink = { _files: shareLink._files }
          //     }
          //     logger.info(permission ? "Updating ShareLink with client access permission" : "Updating ShareLink with restrictions.")
          //     // Update.
          //     exports.utilUpdate(req.user, shareLinkId, shareLink, result => {
          //       res.send(result)
          //     })
          //   });
          // } else {
          //   // do firm "access" level permission check.
          //   permissions.utilCheckFirmPermission(req.user, oldShareLink._firm, "access", permission => {
          //     if(!permission) {
          //       // User doesn't have specific permission, only allow them to update the _files array.
          //       shareLink = { _files: shareLink._files }
          //     }
          //     logger.info(permission ? "Updating ShareLink with firm access permission" : "Updating ShareLink with restrictions.")
          //     // Update.
          //     exports.utilUpdate(req.user, shareLinkId, shareLink, result => {
          //       res.send(result)
          //     })
          //   });
          // }
        } else {
          // User is not logged in, only allow updates to _files array.
          shareLink = { _files: shareLink._files }
          logger.info("Updating ShareLink with restrictions.")
          shareLinksController.utilUpdate(null, shareLinkId, shareLink, sendEmails, result => {
            res.send(result)
          });
        }
      }
    });
}

exports.createQuickTask = (req, responseData, cb) => {
    const { firm, shareLink, staff } = responseData;
    const socketId = req.user._id;
    const newQuickTask = {
        _client: req.body._client
        , _firm: req.body._firm
        , _unsignedFiles: req.body._unsignedFiles
        , type: req.body.typeq
        , prompt: req.body.promptq
        , _createdBy: req.user._id
    }
    const signers = req.body.signers;

    const customeTemplate = req.body.customeTemplate;
    const templateId = req.body.templateId;
    const signerSigningOrderType = req.body.signerSigningOrderType ? req.body.signerSigningOrderType : "sequential";

    if (customeTemplate && templateId === "custom") {
        newQuickTask.template = JSON.stringify(customeTemplate);
    }

    if (!signers || signers.length < 1) {
        cb({ success: false, message: "Missing required signer in request." });
    } else {
        QuickTask.query()
        .insert(newQuickTask)
        .returning("*")
        .asCallback((err, quickTask) => {
            if (!err && quickTask) {
                req.io.to(socketId).emit('signature_progress', {message: 'Authorizing', percent: 15});
                assureSign.getAuthToken(firm, staff, result => {
                    if (!result.success) {
                        cb(result);
                    } else {
                        logger.error("getAuthToken");
                        const authToken = result.token;

                        console.log("req", req.body)
                        console.log("customeTemplate", customeTemplate)
                        console.log("templateId", templateId)

                        if (templateId !== "custom") {

                            // with selected template 
                            // Now fetch the blank template, we'll fill it out with the rest of the info on req.body.
                            req.io.to(socketId).emit('signature_progress', {message: 'Setting up template', percent: 30});
                            assureSign.getTemplateById(firm, staff, authToken, templateId, result => {
                                if (!result.success) {
                                    cb(result);
                                } else {
                                    const template = result.template;
    
                                    if (template && template.content && template.content.documents && template.content.documents[0] && template.content.documents[0].name) {
                                        template.content.documents[0].name = template.name;
                                    }
        
                                    if (template && template.content && template.content.envelope && template.content.envelope.name) {
                                        template.content.envelope.name = template.name;
                                    }
    
                                    // This method will attach the file (if one is present) and the signers to the template and return a prepared envelopeId.
                                    // We only allow one file to be uploaded to a signature request. So we'll pass quickTask._unsignedFiles[0].
                                    req.io.to(socketId).emit('signature_progress', {message: 'Preparing document', percent: 45});
                                    assureSign.prepareEnvelope(firm, staff, authToken, null, quickTask._unsignedFiles[0], signers, template, result => {
                                    // assureSign.prepareEnvelope(authToken, quickTask._unsignedFiles[0], signers, template, req.io, socketId, result => { // for debugging
                                      if(!result.success) {
                                        cb(result);
                                      } else {
                                        // We could call prepareEnvelope again if we wanted to change anything.
                                        // Now that we are done building the envelope we have to submit it.
                                        const preparedEnvelopeId = result.preparedEnvelopeId;
                                        req.io.to(socketId).emit('signature_progress', {message: 'Finalizing document', percent: 60});
                                        assureSign.submitPreparedEnvelope(firm, staff, authToken, preparedEnvelopeId, result => {
                                          // console.log("RESULT OF SUBMIT PREPARED ENVELOPE");
                                          // logger.info(result)
                                          if(!result.success) {
                                            cb(result);
                                          } else {
                                            const finalEnvelopeId = result.finalEnvelopeId;
                                            // set custom url, if applicable
                                            let firmUrl = appUrl;
    
                                            if(firm && firm.domain) {
                                              firmUrl = firm.domain;
                                            }
                                            // Pass the finalEnvelopeId and the redirect url. Returns same finalEnvelopeId and signingLinks.
                                            let redirectUrl = shareLink.url ? encodeURI(shareLink.url) : encodeURI(`http://${firmUrl}/portal/${quickTask._client}/quick-tasks/${quickTask._id}`)
                                            req.io.to(socketId).emit('signature_progress', {message: 'Generating links', percent: 75});
                                            assureSign.getSigningLinks(firm, staff, authToken, finalEnvelopeId, redirectUrl, result => {
                                              if(!result.success) {
                                                cb(result);
                                              } else {
                                                req.io.to(socketId).emit('signature_progress', {message: 'Notifying signers', percent: 90});
                                                // save the signingLink and envelopeId on the quickTask and return the quickTask to the front end.
                                                // let signingLinks = result.signingLinks;
                                                // signingLinks.forEach((link, i) => {
                                                //   // We'll need to save the signers names on each signing link so we can use it to display direct links
                                                //   // for each signer in the case that they are sharing an email address.
                                                //   // Add the signer's name so they know which link is theirs.
                                                //   const currentSigner = signers.filter(signer => signer.username === link.signatoryEmail)[0];
                                                //   link.signerName = currentSigner.firstname + ' ' + currentSigner.lastname;
                                                // })
          
                                                let signingLinks = signers.map((signer, i) => {
                                                    const currentLink = result.signingLinks.filter(link => link.signatoryEmail === signer.username)[0];
                                                    currentLink.signerName = signer.firstname + ' ' + signer.lastname;
                                                    currentLink.auth = signer.auth;
                                                    return currentLink;
                                                })

                                                QuickTask.query()
                                                .findById(quickTask._id)
                                                .patch({
                                                  envelopeId: signingLinks[0].envelopeID
                                                  , signingLinks: JSON.stringify(signingLinks)
                                                  , status: 'open',
                                                  assureSignTemplateId: template.templateID
                                                })
                                                .returning('*')
                                                .asCallback((err, updatedQuickTask) => {
                                                  if(err || !updatedQuickTask) {
                                                    logger.error("ERROR: ")
                                                    logger.info(err || "Unable to update quickTask.", quickTask._id)
                                                    cb({success: false, message: `Unable to update quickTask. Please try again. ${err}`});
                                                  } else {
                                                    responseData["quickTask"] = updatedQuickTask;
                                                    // Pass false so we don't send client emails on this activity. Email notifications for signature requests are handled by the shareLink controller.
                                                    // Why? Because the emails need to be sent to the signers only and the activities controller has no idea what that means.
                                                    quickTasksController.utilCheckAndGenerateActivity(req.user, req.io, quickTask, updatedQuickTask, false);
                                                    cb({ success: true, responseData });
                                                  }
                                                });
                                              }
                                            });
                                          }
                                        });
                                      }
                                    });
                                }
                            });
                        } else if (customeTemplate) {

                            console.log("debug1");

                            const fileId = quickTask._unsignedFiles[0];
                            req.io.to(socketId).emit('signature_progress', { message: 'Setting up template', percent: 60 });
                            assureSign.SubmitCustomizeTemplate(firm, staff, fileId, authToken, signers, customeTemplate, signerSigningOrderType, submitresult => {
                                console.log("debug2");

                              if (!submitresult.success) {
                                cb(submitresult);
                              } else {
                                
                                console.log("debug3");
                                let firmUrl = appUrl;
                                if(firm && firm.domain) {
                                  firmUrl = firm.domain;
                                }
      
                                const envelopeID = submitresult.envelopeID;
                                const redirectUrl = shareLink.url ? encodeURI(shareLink.url) : encodeURI(`http://${firmUrl}/portal/${quickTask._client}/quick-tasks/${quickTask._id}`)
                                req.io.to(socketId).emit('signature_progress', {message: 'Generating links', percent: 75});
                                assureSign.getSigningLinks(firm, staff, authToken, envelopeID, redirectUrl, linkresult => {
      
                                  if (!linkresult.success) {
                                    cb(linkresult)
                                  } else {
      
                                    req.io.to(socketId).emit('signature_progress', { message: 'Notifying signers', percent: 90 });
      
                                    // save the signingLink and envelopeId on the quickTask and return the quickTask to the front end.

                                    let signingLinks = signers.map((signer, i) => {
                                        const currentLink = linkresult.signingLinks.filter(link => link.signatoryEmail === signer.username)[0];
                                        currentLink.signerName = signer.firstname + ' ' + signer.lastname;
                                        currentLink.auth = signer.auth;
                                        return currentLink;
                                    })
      
                                    QuickTask.query()
                                    .findById(quickTask._id)
                                    .patch({
                                      envelopeId: signingLinks[0].envelopeID
                                      , signingLinks: JSON.stringify(signingLinks)
                                      , status: 'open',
                                      assureSignTemplateId: 'custom'
                                    })
                                    .returning('*')
                                    .asCallback((err, updatedQuickTask) => {
                                      if(err || !updatedQuickTask) {
                                        logger.error("ERROR: ")
                                        logger.info(err || "Unable to update quickTask.", quickTask._id)
                                        cb({success: false, message: `Unable to update quickTask. Please try again. ${err}`});
                                      } else {
                                        responseData["quickTask"] = updatedQuickTask;
                                        // Pass false so we don't send client emails on this activity. Email notifications for signature requests are handled by the shareLink controller.
                                        // Why? Because the emails need to be sent to the signers only and the activities controller has no idea what that means.
                                        quickTasksController.utilCheckAndGenerateActivity(req.user, req.io, quickTask, updatedQuickTask, false)
                                        logger.info("Quick Task Updated! ", updatedQuickTask);
                                        cb({ success: true, responseData });
                                      }
                                    });                              
                                  }
                                });
                              }
                            });
                        }
                    }
                });
            } else {
                logger.error("err", err);
                cb({ success: false, message: "Could not create QuickTask." });
            }
        });
    }
}

exports.createShareLink = (req, responseData, cb) => {
    
    const { firm } = responseData;
    const firmUrl = firm && firm.domain ? firm.domain : appUrl;
    const emailMessage = req.body.emailMessage;
    const hex = Math.floor(Math.random()*16777215).toString(16)
    + Math.floor(Math.random()*16777215).toString(16) // we can make this bigger if needed?
    + Math.floor(Math.random()*16777215).toString(16) // we can make this bigger if needed?
    + Math.floor(Math.random()*16777215).toString(16); // we can make this bigger if needed?
    const url = `https://${firmUrl}/request/signature/${hex}`;

    const newShareLink = {
        authType: req.body.authType
        , sN_viewSignatureRequest: req.body.sN_viewSignatureRequest || false
        , sN_signingCompleted: req.body.sN_signingCompleted || false
        , showTermsConditions: req.body.showTermsConditions || false
        , sN_creatorAutoSignatureReminder: req.body.sN_creatorAutoSignatureReminder || false
        , password: req.body.password
        , prompt: req.body.prompt
        , type: req.body.type
        , _client: req.body._client
        , _firm: req.body._firm
        , _createdBy: req.user._id
        , sentTo: JSON.stringify(req.body.sentTo)
        , hex
        , url
        , showTermsConditions: req.body.showTermsConditions
        , sN_creatorAutoSignatureReminder: req.body.sN_creatorAutoSignatureReminder
    }

    if (!req.body._client && req.body._personal) {
        newShareLink._personal = req.body._personal;
    }

    ShareLink.query()
        .insert(newShareLink)
        .returning("*")
        .asCallback((err, shareLink) => {

            if (err && !shareLink) {
                cb({ success: false, message: "Could not save ShareLink" });
            } else {
                delete shareLink.integer;
                responseData["shareLink"] = shareLink;
                cb({ success: true, responseData });
            }
        });
}

exports.checkPermission = (req, responseData, cb) => {
    if (req.body._firm) {
        Firm.query().findById(req.body._firm)
            .then(firm => {
                if(!firm) {
                    cb({ success: false, message: "Could not find matching Firm" });
                } else {
                    responseData["firm"] = firm;
                    permissions.utilCheckFirmPermission(req.user, req.body._firm, 'access', permission => {
                        if(!permission) {
                            cb({success: false, message: "You do not have permission to access this Firm"})
                        } else {
                            Staff.query()
                                .where({ _firm: req.body._firm, _user: req.user._id })
                                .first()
                                .asCallback((err, staff) => {
                                    if (err && !staff) {
                                        cb({ success: false, message: "Staff not found" });
                                    } else if (staff && staff != "inactive") {
                                        responseData["staff"] = staff;
                                        cb({ success: true, responseData });
                                    } else {
                                        cb({ success: false, message: "Inactive user dont have permission to access this Firm" });
                                    }
                                });
                        }
                    })
                }
            })
            .catch(err => {
                cb({success: false, message: 'Internal server error'});
            })
    } else {
        cb({ success: false, message: "Firm not found" });
    }
}

exports.createRequestFiles = (req, res) => {
    let firmUrl = appUrl;
    const {
        _firm
        , _client
        , _personal
        , authType
        , expireDate
        , password
        , prompt
        , sentTo
        , signingLinks
        , emailMessage
        , promptq
    } = req.body;

    let sN_upload = req.body.sN_upload;

    Firm.query().findById(_firm).then(firm => {
        if (!firm) {
            res.send({ success: false, message: "firm not found" });
        } else {
            permissions.utilCheckFirmPermission(req.user, firm._id, 'access', permission => {
                if (!permission) {
                    res.send({success: false, message: "You do not have permission to access this Firm"});
                } else {
                    if (firm.domain) {
                        firmUrl = firm.domain;
                    }

                    // create quicktasks
                    const qtData = {
                        type: "file"
                        , _firm
                        , _client
                        , _createdBy: req.user._id
                        , status: "open"
                        , signingLinks
                        , prompt: promptq
                    }

                    QuickTask.query().insert(qtData).returning("*").asCallback((err, quickTask) => {
                        if (err && !quickTask) {
                            res.send({ success: false, message: "failed to create quicktask" });
                        } else {

                            quickTasksController.utilCheckAndGenerateActivity(req.user, req.io, {}, quickTask, false);

                            const hex = Math.floor(Math.random()*16777215).toString(16)
                                + Math.floor(Math.random()*16777215).toString(16) // we can make this bigger if needed?
                                + Math.floor(Math.random()*16777215).toString(16) // we can make this bigger if needed?
                                + Math.floor(Math.random()*16777215).toString(16); // we can make this bigger if needed?

                            // temporary 
                            if (_client) {
                                sN_upload = true;
                            }

                            const slData = {
                                type: "file-request"
                                , _client
                                , _personal
                                , _firm
                                , _quickTask: quickTask._id
                                , sN_upload
                                , sN_downloaded: true // notification setting default true 
                                , sN_viewed: true // notification setting default true 
                                , authType
                                , expireDate
                                , password
                                , prompt
                                , hex
                                , url: `https://${firmUrl}/request/file/${hex}`
                                , _createdBy: req.user._id
                                , sentTo: JSON.stringify(sentTo)
                            }

                            ShareLink.query().insert(slData).returning("*").asCallback((err, shareLink) => {
                        
                                shareLinksController.utilCheckAndSendEmails(req.user, null, shareLink, emailMessage, emailResults => {
                                    // console.log("oldShareLink", oldShareLink);
                                    // console.log("updatedShareLink", updatedShareLink)
                                    
                                    shareLink.emailResults = emailResults
                                    if(shareLink && shareLink.integer) delete shareLink.integer
                                
                                    if (err && !shareLink) {
                                        res.send({ success: false, message: "failed to create sharelink" });
                                    } else {
                                        res.send({ success: true, quickTask, shareLink });
                                    }
                                });
                            });
                        }
                    });
                }
            });
        }
    });
}

exports.createShareFiles = (req, res) => {
    let firmUrl = appUrl;
    const {
        _firm
        , _client
        , authType
        , expireDate
        , password
        , prompt
        , _files
        , sN_downloaded
        , sN_viewed
        , emailMessage
        , sentTo
        , showTermsConditions
    } = req.body;

    Firm.query().findById(_firm).then(firm => {
        if (!firm) {
            res.send({ success: false, message: "firm not found" });
        } else {
            permissions.utilCheckFirmPermission(req.user, firm._id, 'access', permission => {
                if (!permission) {
                    res.send({success: false, message: "You do not have permission to access this Firm"});
                } else {
                    if (firm.domain) {
                        firmUrl = firm.domain;
                    }
                    const hex = Math.floor(Math.random()*16777215).toString(16)
                        + Math.floor(Math.random()*16777215).toString(16) // we can make this bigger if needed?
                        + Math.floor(Math.random()*16777215).toString(16) // we can make this bigger if needed?
                        + Math.floor(Math.random()*16777215).toString(16); // we can make this bigger if needed?

                    const slData = {
                        type: "share"
                        , sN_upload: true // notification setting default true 
                        , sN_downloaded
                        , sN_viewed
                        , authType
                        , expireDate
                        , password
                        , prompt
                        , _client
                        , _firm
                        , hex
                        , _files
                        , url: `https://${firmUrl}/share/${hex}`
                        , _createdBy: req.user._id
                        , sentTo: JSON.stringify(sentTo)
                        , showTermsConditions
                    }

                    ShareLink.query().insert(slData).returning("*").asCallback((err, shareLink) => {
                        
                        // file activity shared
                        if (shareLink && shareLink._files && shareLink._files.length && shareLink.type === "share") {
                            async.each(shareLink._files, (fileId, callback) => {
                                // file activity
                                fileActivityController.utilCreateFromResource(
                                    req
                                    , fileId, shareLink._firm, shareLink._client, req.user ? req.user._id : null
                                    , "visible"
                                    , `Shared by %USER%`
                                    , "" // shareLink.url
                                    , "" // shareLink.url
                                );
                                callback(fileId);
                            })
                        }

                        shareLinksController.utilCheckAndSendEmails(req.user, null, shareLink, emailMessage, emailResults => {
                            // console.log("oldShareLink", oldShareLink);
                            // console.log("updatedShareLink", updatedShareLink)
                            
                            shareLink.emailResults = emailResults
                            if(shareLink && shareLink.integer) delete shareLink.integer
                        
                            if (err && !shareLink) {
                                res.send({ success: false, message: "failed to create sharelink" });
                            } else {
                                res.send({ success: true, shareLink });
                            }
                        });
                    });
                }
            });
        }
    });
}