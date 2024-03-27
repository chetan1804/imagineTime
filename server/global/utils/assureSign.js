/**
 * A set of utils to deal with the assureSign API. Documentation is pretty sparse on v3.5.
 * Details on these endpoints at:
 * https://account.assuresign.net/api/v3.5/account
 * https://account.assuresign.net/api/v3.5/documentnow
 * 
 */

const assureSignRoot = require('../../config')[process.env.NODE_ENV].assureSignRoot;
const fetch = require('isomorphic-fetch');
const filesCtrl = require('../../resources/file/filesController');
const brandingName = require('../brandingName.js').brandingName;

exports.getAuthToken = (firm, staff, callback) => {
  if(!firm || !firm.eSigAccess) {
    // Do this check here since it happens before any other assuresign API calls.
    logger.error("ERROR: This firm does not have e-signature access.")
    logger.info(firm)
    callback({ success: false, message: `This firm does not have e-signature access. Please contact ${brandingName.title} support to add this feature.`})
  } else if(!staff || !staff.eSigAccess) {
    logger.error("ERROR: This staff does not have e-signature access.")
    logger.info(firm)
    callback({ success: false, message: "This staff member does not have e-signature access."})
  } else {
    console.log("Firing AssureSign getAuthToken");
    // console.log("POST https://account.assuresign.net/api/v3.5/authentication/apiUser");
    const requestBody = {
      request: {
        apiUsername: staff.apiUsername
        , key: staff.apiKey
        , contextUsername: staff.contextUsername
        , sessionLengthInMinutes: 60
      }
    }
    const options = {
      method: 'POST'
      , body: JSON.stringify(requestBody)
      , headers: {
        'Content-Type': 'application/json'
        ,'Accept': 'application/json'
        , 'X-AS-UserContext': `${staff.contextUsername}: ${firm.contextIdentifier}`
      }
    };
    // console.log('Options', options);
    // This authentication call is hardcoded because it uses a unique endpoint across environments.
    fetch('https://account.assuresign.net/api/v3.5/authentication/apiUser', options)
    .then(response => {
      response.json().then(result => {
        // console.log('RESPONSE', result);
        if(result.token) {
          logger.info("Assuresign authentication successful.")
          callback({ success: true, token: result.token })
        } else {
          logger.error("ERROR: ", result.summary)
          callback({ success: false, message: result.summary })
        }
      })
    })
  }
}

exports.createApiUserCredentials = (firm, user, staff, authToken, callback) => {
  console.log("Firing AssureSign createApiUserCredentials");
  // console.log("POST https://account.assuresign.net/api/v3.5/apiUsers");

  let baseUsername = user.firstname + '_' + user.lastname;
  baseUsername = baseUsername.replace(/ /g,'');

  const requestBody = {
    request: {
      baseUsername: baseUsername
      , specificUsername: user.username
      , scope: 'specificUser'
    }
  }

  const options = {
    method: 'POST'
    , body: JSON.stringify(requestBody)
    , headers: {
      'Content-Type': 'application/json'
      ,'Accept': 'application/json'
      , 'Authorization': `Bearer ${authToken}`
      , 'X-AS-UserContext': `${staff.contextUsername}: ${firm.contextIdentifier}`
    }
  };
  // console.log('Options', options);
  // This api call is hardcoded because it uses a unique endpoint across environments.
  fetch('https://account.assuresign.net/api/v3.5/apiUsers', options)
  .then(response => {
    response.json().then(parsedRes => {
      if(parsedRes.errorCode) {
        let errorMessage
        if(parsedRes.errorCode === "NOT_FOUND") {
          // The staff owner has not yet entered this user on assuresign.net
          errorMessage = "This user could not be found in AssureSign. Please make sure that you've entered this user in AssureSign and try again."
        }
        logger.error("ERROR: ", parsedRes)
        callback({ success: false, message: errorMessage || parsedRes.summary })
      } else {
        logger.info("Assuresign authentication successful.")
        callback({ success: true, credentials: parsedRes.result })
      }
    })
  })
}

exports.getAllTemplates = (firm, staff, authToken, callback) => {
  console.log("Firing AssureSign getAllTemplates");
  if(!authToken) {
    callback({ success: false, message: "ERROR: Missing required authToken in request." })
  } else if(!firm) {
    callback({ success: false, message: "ERROR: Missing required firm in request." })
  } else {
    const options = {
      method: 'GET'
      , headers: {
        'Content-Type': 'application/json'
        ,'Accept': 'application/json'
        , 'Authorization': `Bearer ${authToken}`
        , 'X-AS-UserContext': `${staff.contextUsername}: ${firm.contextIdentifier}`
      }
    }
    // console.log('Options', options);
  
    fetch(`${firm.assureSign_url ? firm.assureSign_url : assureSignRoot}/templates`, options)
    .then(response => {
      response.json().then(parsedRes => {
        // console.log('RESPONSE', parsedRes);
        if(parsedRes.errorCode) {
          // something went wrong.
          logger.error("ERROR: ", parsedRes.summary)
          callback({ success: false, message: parsedRes.summary })
        } else {
          const templates = parsedRes.result.templates
          callback({ success: true, templates })
        }
      })
      .catch(err => {
        callback({ success: false, templates: []})
      })
    })
    .catch(err => {
      callback({ success: false, templates: []})
    })
  }
}

exports.getTemplateById = (firm, staff, authToken, templateId, callback) => {
  console.log("Firing AssureSign getTemplateById");
  // console.log(`GET ${assureSignRoot}/templates/${templateId}`)
 if(!authToken) {
    callback({ success: false, message: "ERROR: Missing required authToken in request." })
  } else if(!templateId) {
    callback({ success: false, message: "ERROR: Missing required templateId in request." })
  }

  const options = {
    method: 'GET'
    , headers: {
      'Content-Type': 'application/json'
      ,'Accept': 'application/json'
      , 'Authorization': `Bearer ${authToken}`
      , 'X-AS-UserContext': `${staff.contextUsername}: ${firm.contextIdentifier}`
    }
  }
  // console.log('Options', options);

  fetch(`${firm.assureSign_url ? firm.assureSign_url : assureSignRoot}/templates/${templateId}`, options)
  .then(response => {
    response.json().then(parsedRes => {
      // console.log('RESPONSE', parsedRes);
      if(parsedRes.errorCode) {
        // something went wrong.
        logger.error("ERROR: ", parsedRes.summary)
        callback({ success: false, message: parsedRes.summary })
      } else {
        const template = parsedRes.result
        /**
         * NOTE: AssureSign allows parent accounts to share templates with sub-accounts, BUT the template comes back with these two
         * fields populated. These two fields must be deleted for sub-accounts to use templates created on the main account. Apparently
         * the presence of these two fields supersede our user auth headers and the misidentification causes assureSign's server to freak
         * out because neither ID matches the sub-account.
         */
        delete template.userAccountID
        delete template.accountID
        callback({ success: true, template })
      }
    });
  });
}

exports.prepareEnvelope = (firm, staff, authToken, unsignedFileModelName, fileId = null, signers = [], template = null, callback) => {
  unsignedFileModelName = unsignedFileModelName ? "template" : 'file';

  // exports.prepareEnvelope = (authToken, fileId = null, signers = [], template = null, io, socketId, callback) => { // for debugging
  console.log("Firing AssureSign prepareEnvelope");
  // console.log(`POST ${assureSignRoot}/submit/prepare`)
  if(!authToken) {
    return callback({ success: false, message: "ERROR: Missing required authToken in request." })
  } else if(signers.length === 0) {
    return callback({ success: false, message: "ERROR: You must include at least one signer."})
  } else if(!template) {
    return callback({ success: false, message: "ERROR: You must include a template ID."})
  }

  let options = {
    method: 'POST'
    , headers: {
      'Content-Type': 'application/json'
      ,'Accept': 'application/json'
      , 'Authorization': `Bearer ${authToken}`
      , 'X-AS-UserContext': `${staff.contextUsername}: ${firm.contextIdentifier}`
    }
  }
  
  const requestBody = {}
  requestBody.request = template;
  /* Check for fileId. If it's there, we need to convert it to base64 and add it to requestBody.request.content.documents[0].file
     "file": {
        "fileToUpload": {
          "data": "[File data must be converted to Base64]"
          , "fileName": "Example.pdf"
        }
        , "extension": "pdf"
      }
    */
  
  console.log("template", template);
  if(fileId) {
    // Fetch the file and add it to the request body.
    filesCtrl.utilGetPDFBase64String(unsignedFileModelName, parseInt(fileId), result => {
      if(!result.success) {
        return callback(result)
      } else {
        
        const fileName = result.file.filename ? result.file.filename.replace(/.pdf/ig, ".pdf") : result.file.filename;
        let signerComboName = "";
        if (signers && signers.length) {
          signers.map((signer, i) => {
            let fullname = `${signer.firstname} ${signer.lastname}`;
            fullname = fullname.trim();
            fullname = fullname.split(" ").map(name => {
              return name.charAt(0).toUpperCase() + name.toLowerCase().slice(1)
            }).join(" ");
            signerComboName += i === 0 ? `${fullname}` : ` & ${fullname}`;
            return signer;
          });
        }

        signerComboName = `(${signerComboName}) ${fileName} - ${template.name}`;
        signerComboName = signerComboName.substring(0, 128);

        if (signerComboName) {
          template.content.documents[0].name = template.name;
        } else if (template && template.content && template.content.documents && template.content.documents[0] && template.content.documents[0].name) {
          template.content.documents[0].name = signerComboName;
        }

        if (signerComboName) {
          template.content.envelope.name = signerComboName;
        } else if (template && template.content && template.content.envelope && template.content.envelope.name) {
          template.content.envelope.name = template.name;
        }
        
        const fileToInsert = {
          data: result.file.data
          , fileName: fileName
        }
        requestBody.request.content.documents[0].file.fileToUpload = fileToInsert;
        // Now add the signer info.
        for(let i = 0; i < signers.length; i++) {
          const signer = signers[i];
          requestBody.request.content.signers[i].email = signer.username
          requestBody.request.content.signers[i].name = `${signer.firstname} ${signer.lastname}`
          /**
           * Check if signer.enableKba === true, populate signer.kba fields.
           */
          if(signer.kba) {
            requestBody.request.content.signers[i].kba = signer.kba
            requestBody.request.content.signers[i].kba.firstName = signer.firstname
            requestBody.request.content.signers[i].kba.lastName = signer.lastname
            if(!signer.kba.firstName || !signer.kba.lastName || !signer.kba.address || !signer.kba.city || !signer.kba.zip || !signer.kba.state) {
              return callback({ success: false, message: 'Missing required KBA information in request. Please try again.'})
            }
          }
        }
        // FUTURE: requestBody.request.content.documents[0].fields is an array of jotblock objects. We can add or modify them at this step.
        options.body = JSON.stringify(requestBody)
        // console.log('Options', options);
        // io.to(socketId).emit('debug', requestBody); // uncomment for debugging.
        // Prepare new envelope
        fetch(`${firm.assureSign_url ? firm.assureSign_url : assureSignRoot}/submit/prepare`, options)
        .then(response => {
          response.json().then(parsedRes => {
            // console.log('RESPONSE', parsedRes);

            console.log("response", response, parsedRes.summary);
            if(parsedRes.errorCode) {
              // something went wrong.
              logger.error("ERROR: ", parsedRes.summary)
              return callback({ success: false, message: parsedRes.summary })
            } else {
              const preparedEnvelopeId = parsedRes.result.preparedEnvelopeID;
              return callback({ success: true, preparedEnvelopeId })
            }
          });
        });
      }
    });
  } else {
    // NOTE: Currently making it mandatory to upload or attach a file on e-signature tasks. Reason being, when we download the
    // signed document we use all of the information from the original file to create the new one. So without an original
    // file we don't know the filename or tags or anything else.
    return callback({ success: false, message: "ERROR: You must attach a file to be signed." })
    // for(let i = 0; i < signers.length; i++) {
    //   const signer = signers[i];
    //   requestBody.request.content.signers[i].email = signer.username
    //   requestBody.request.content.signers[i].name = `${signer.firstname} ${signer.lastname}`
    // }
    // options.body = JSON.stringify(requestBody)
    // // Prepare new envelope
    // fetch(`https://sb.assuresign.net/api/documentnow/v3.5/submit/prepare`, options)
    // .then(response => {
    //   response.json().then(parsedRes => {
    //     if(parsedRes.errorCode) {
    //       logger.error("ERROR: ", parsedRes.summary)
    //       callback({ success: false, message: parsedRes.summary })
    //     } else {
    //       const preparedEnvelopeId = parsedRes.result.preparedEnvelopeID;
    //       callback({ success: true, preparedEnvelopeId })
    //     }
    //   });
    // });
  }
}

exports.submitPreparedEnvelope = (firm, staff, authToken, preparedEnvelopeId, callback) => {
  console.log("Firing AssureSign submitPreparedEnvelope");
  // console.log(`POST ${assureSignRoot}/submit/${preparedEnvelopeId}`)
  if(!authToken) {
    callback({ success: false, message: "ERROR: Missing required authToken in request." })
    return;
  } else if(!preparedEnvelopeId) {
    callback({ success: false, message: "ERROR: Missing required preparedEnvelopeId in request." })
    return;
  }
  const options = {
    method: 'POST'
    , headers: {
      'Content-Type': 'application/json'
      ,'Accept': 'application/json'
      , 'Authorization': `Bearer ${authToken}`
      , 'X-AS-UserContext': `${staff.contextUsername}: ${firm.contextIdentifier}`
    }
  }
  // console.log('Options', options);

  fetch(`${firm.assureSign_url ? firm.assureSign_url : assureSignRoot}/submit/${preparedEnvelopeId}`, options)
  .then(response => {    
    response.json().then(parsedRes => {
      // console.log("RESPONSE", parsedRes);
      if(parsedRes.errorCode) {
        // something went wrong.
        logger.error("ERROR ", parsedRes);
        logger.error("ERROR: ", parsedRes.summary)
        callback({ success: false, message: parsedRes.summary })
        return;
      } else {
        const finalEnvelopeId = parsedRes.result.envelopeID
        callback({ success: true, finalEnvelopeId });
        return;
      }
    })
  })
}

exports.getSigningLinks = (firm, staff, authToken, finalEnvelopeId, redirectUrl, callback) => {
  console.log("Firing AssureSign getSigningLinks");
  // console.log(`GET ${assureSignRoot}/envelope/${finalEnvelopeId}/signingLinks`)
  if(!authToken) {
    callback({ success: false, message: "ERROR: Missing required authToken in request." })
    return;
  } else if(!finalEnvelopeId) {
    callback({ success: false, message: "ERROR: Missing required finalEnvelopeId in request." })
    return;
  } else if(!redirectUrl) {
    callback({ success: false, message: "ERROR: Missing required redirectUrl in request." })
    return;
  }
  const options = {
    method: 'GET'
    , headers: {
      'Content-Type': 'application/json'
      ,'Accept': 'application/json'
      , 'Authorization': `Bearer ${authToken}`
      , 'X-AS-UserContext': `${staff.contextUsername}: ${firm.contextIdentifier}`
    }
  }
  // console.log('Options', options);

  fetch(`${firm.assureSign_url ? firm.assureSign_url : assureSignRoot}/envelope/${finalEnvelopeId}/signingLinks?redirectUrl=${redirectUrl}`, options)
  .then(response => {
    response.json().then(parsedRes => {
      // console.log("RESPONSE", parsedRes);
      if(parsedRes.errorCode) {
        // something went wrong.
        logger.error('ERROR: ', parsedRes.summary)
        callback({ success: false, message: parsedRes.summary })
        return;
      } else {
        /* This call will return the same envelopeId as the last call. We'll also get the signingLinks.
         * We need to save the signingLinks and envelopeId on the clientTask and then return the clientTask to the frontend.
         *
         * The response looks like this:
         * 
         * "result": {
            "signingLinks": [
              {
                "envelopeID": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
                , "signatoryEmail": "signer1@example.com"
                , "signatoryMobilePhone": "string"
                , "url": "string"
                , "expirationDate": "2019-10-29T15:17:56.091Z"
              }
              , {
                "envelopeID": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
                , "signatoryEmail": "signer2@example.com"
                , "signatoryMobilePhone": "string"
                , "url": "string"
                , "expirationDate": "2019-10-29T15:17:56.091Z"
              }
            ]
          }
         */
        const signingLinks = parsedRes.result.signingLinks;
        callback({ success: true, signingLinks });
        return;
      }
    });
  });
}

exports.getSignedDocument = (firm, staff, authToken, envelopePassword, envelopeId, callback) => {
  console.log("Firing AssureSign getSignedDocument");

  const requestBody = {
    request: {
      envelopePassword: envelopePassword || "n/a" //  we aren't setting passwords, but we could.
    }
  }

  const options = {
    method: 'POST'
    , body: JSON.stringify(requestBody)
    , headers: {
      'Content-Type': 'application/json'
      ,'Accept': 'application/json'
      , 'Authorization': `Bearer ${authToken}`
      , 'X-AS-UserContext': `${staff.contextUsername}: ${firm.contextIdentifier}`
    }
  };

  fetch(`${firm.assureSign_url ? firm.assureSign_url : assureSignRoot}/envelopes/${envelopeId}/download`, options)
  .then(response => {
    response.json().then(parsedRes => {
      if(parsedRes.errorCode) {
        logger.error("ERROR: ", parsedRes.summary)
        callback({ success: false, message: parsedRes.summary });
        return;
        // The response will be an object, the signed version of our file will be at response.documents[0].completedDocument
      } else if(parsedRes.result && parsedRes.result.documents && parsedRes.result.documents[0] && parsedRes.result.documents[0].completedDocument) {
        callback({ success: true, signedDocument: parsedRes.result.documents[0].completedDocument});
        return;
      } else {
        callback({ success: false, message: "An unknown error occured. Could not fetch signed document."});
        return;
      }
    })
  })
}

exports.cancelActiveEnvelope = (firm, staff, authToken, envelopeId, callback) => {
  console.log("Firing AssureSign cancelActiveEnvelope");

  const requestBody = {
    request: {
      remarks: `Cancelling envelope ${envelopeId}`
    }
  }

  const options = {
    method: 'PUT'
    , body: JSON.stringify(requestBody)
    , headers: {
      'Content-Type': 'application/json'
      ,'Accept': 'application/json'
      , 'Authorization': `Bearer ${authToken}`
      , 'X-AS-UserContext': `${staff.contextUsername}: ${firm.contextIdentifier}`
    }
  };

  fetch(`${firm.assureSign_url ? firm.assureSign_url : assureSignRoot}/envelopes/${envelopeId}/cancel`, options)
  .then(response => {
    response.json().then(parsedRes => {
      if(parsedRes.errorCode) {
        logger.error("ERROR: ", parsedRes.summary)
        callback({ success: false, message: parsedRes.summary })
        // The response will be an object, the signed version of our file will be at response.documents[0].completedDocument
      } else if(parsedRes.result && parsedRes.result.success) {
        callback({ success: true, message: "Envelope successfully cancelled"});
      } else {
        callback({ success: false, message: "An unknown error occured. Could not fetch signed document."})
      }
    })
  })
  .catch(err => {
    logger.error('cancelActiveEnvelope error', err);
    callback({ success: false, message: "Internal server error"})
  })

}

exports.SubmitCustomizeTemplate = (firm, staff, fileId, authToken, signers, customeTemplate, signerSigningOrderType, callback) => {

  if (fileId) {
    filesCtrl.utilGetPDFBase64String('file', parseInt(fileId), result => {
      if(!result.success) {
        return callback(result)
      } else {

        const fileName = result.file.filename ? result.file.filename.replace(/.pdf/ig, ".pdf") : result.file.filename;
        let signerComboName = "";
        const fileToUpload = {
          data: result.file.data
          , fileName: fileName
        }
        const newSigners = signers.map((signer, i) => {

          let newSigner = {};
          newSigner.email = signer.username;
          newSigner.label = customeTemplate.signers[i].label;
          newSigner.name = `${signer.firstname} ${signer.lastname}`;
          newSigner.password = "";
          newSigner.signatureStyle = customeTemplate.signers[i].signatureStyle;
          if(signer.kba) {
            newSigner.enableKba = true;
            newSigner.kba = signer.kba;
            newSigner.kba.firstName = signer.firstname;
            newSigner.kba.lastName = signer.lastname;
            if(!signer.kba.firstName || !signer.kba.lastName || !signer.kba.address || !signer.kba.city || !signer.kba.zip || !signer.kba.state) {
              return callback({ success: false, message: 'Missing required KBA information in request. Please try again.'})
            }
          }

          let fullname = `${signer.firstname} ${signer.lastname}`;
          fullname = fullname.trim();
          fullname = fullname.split(" ").map(name => {
            return name.charAt(0).toUpperCase() + name.toLowerCase().slice(1)
          }).join(" ");
          signerComboName += i === 0 ? `${fullname}` : ` & ${fullname}`;
          return newSigner;
        });
        
        signerComboName = `(${signerComboName}) ${fileName} - custom template`;
        signerComboName = signerComboName.substring(0, 128);

        const requestBody = {
          request: {
            content: {
              documents: [{
                attachments: customeTemplate.attachments
                , file: { fileToUpload }
                , fields: customeTemplate.elements
                , name: `${signerComboName}`
              }]
              , signers: newSigners
              , envelope: {
                cultureType: "en-US",
                declineBehaviorType: "decline_All",
                name: `${signerComboName}`,
                signingDeviceEnabled: false,
                incrementalSigning: false,
                viewBehaviorType: "view_All",
                workflowType: signerSigningOrderType && newSigners && newSigners.length > 1 ? signerSigningOrderType : "parallel",
                notificationSettings: {
                  addCustomRecipientsToEnvelopeComplete: false
                  , enableNotifications: false
                }
              }
            }, 
            isLegacyNotifications: false
          } 
        };

        const options = {
          method: 'POST'
          , body: JSON.stringify(requestBody)
          , headers: {
            'Content-Type': 'application/json'
            , 'Accept': 'application/json'
            , 'Authorization': `Bearer ${authToken}`
            , 'X-AS-UserContext': `${staff.contextUsername}: ${firm.contextIdentifier}`
          }
        };

        fetch(`${firm.assureSign_url ? firm.assureSign_url : assureSignRoot}/submit`, options)
          .then(response => {
            response.json().then(parsedRes => {      
              if(parsedRes.errorCode) {
                // something went wrong.
                logger.error("parase", parsedRes)
                let message = parsedRes.summary;
                if (parsedRes.details) {
                  parsedRes.details.map(detail => {
                    const erroMsg = detail.split(":");
                    if (erroMsg[1]) {
                      message += `\n ${erroMsg[1]}`;
                    } else {
                      message += `\n ${erroMsg[0]}`;
                    }
                    return detail;
                  });
                }
                return callback({ success: false, message  })
              } else {
                const envelopeID = parsedRes.result.envelopeID;
                return callback({ success: true, envelopeID })
              }
            });
        }); 
      }
    });
  } else {
    return callback({ success: false, message: "File not found" });
  }
}

exports.getCurrentSigner = (firm, staff, authToken, finalEnvelopeId, callback) => {
  console.log("Firing AssureSign getSigningLinks");
  // console.log(`GET ${assureSignRoot}/envelope/${finalEnvelopeId}/signingLinks`)
  if(!authToken) {
    callback({ success: false, message: "ERROR: Missing required authToken in request." })
  } else if(!finalEnvelopeId) {
    callback({ success: false, message: "ERROR: Missing required finalEnvelopeId in request." })
  }
  const options = {
    method: 'GET'
    , headers: {
      'Content-Type': 'application/json'
      ,'Accept': 'application/json'
      , 'Authorization': `Bearer ${authToken}`
      , 'X-AS-UserContext': `${staff.contextUsername}: ${firm.contextIdentifier}`
    }
  }
  // console.log('Options', options);

  fetch(`${firm.assureSign_url ? firm.assureSign_url : assureSignRoot}/envelope/${finalEnvelopeId}/signingLinks?includeOnlyCurrentSigners=${true}`, options)
  .then(response => {
    response.json().then(parsedRes => {
      // console.log("RESPONSE", parsedRes);
      if(parsedRes.errorCode) {
        // something went wrong.
        logger.error('ERROR: ', parsedRes.summary)
        callback({ success: false, message: parsedRes.summary })
      } else {
        const signingLinks = parsedRes.result && parsedRes.result.signingLinks;
        callback({ success: true, signingLinks })
      }
    });
  });
}

exports.cancelEnvelope = (firm, staff, authToken, envelopeId, callback) => {
  console.log("Firing AssureSign cancelEnvelope");
  // console.log(`PUT ${assureSignRoot}/envelopes/{envelopeId}`)
  if(!authToken) {
    callback({ success: false, message: "ERROR: Missing required authToken in request." })
  } else if(!envelopeId) {
    callback({ success: false, message: "ERROR: Missing required envelopeId in request." })
  }
  let requestBody = {
    "request": {
      "remarks": "Signature no longer needed."
    }
  };
  const options = {
    method: 'PUT'
    , body: JSON.stringify(requestBody)
    , headers: {
      'Content-Type': 'application/json'
      ,'Accept': 'application/json'
      , 'Authorization': `Bearer ${authToken}`
      , 'X-AS-UserContext': `${staff.contextUsername}: ${firm.contextIdentifier}`
    }
  }
  // console.log('Options', options);
  
  fetch(`${firm.assureSign_url ? firm.assureSign_url : assureSignRoot}/envelopes/${envelopeId}/cancel`, options)
  .then(result => {
    result.json().then(response => {
      console.log("RESPONSE", response);
      if(response.errorCode) {
        // something went wrong.
        logger.error("ERROR ", response);
        logger.error("ERROR: ", response.summary)
        callback({ success: false, message: response.summary })
      } else {
        callback({ success: true });
      }
    })
  })
}

exports.getEnvelope = (firm, staff, authToken, envelopeId, callback) => {
  console.log("Firing AssureSign getEnvelope");
  // console.log(`GET ${assureSignRoot}/envelopes/{envelopeId}`)
  if(!authToken) {
    return callback({ success: false, message: "ERROR: Missing required authToken in request." })
  } else if(!envelopeId) {
    return callback({ success: false, message: "ERROR: Missing required envelopeId in request." })
  }
  const options = {
    method: 'GET'
    , headers: {
      'Content-Type': 'application/json'
      ,'Accept': 'application/json'
      , 'Authorization': `Bearer ${authToken}`
      , 'X-AS-UserContext': `${staff.contextUsername}: ${firm.contextIdentifier}`
    }
  }
  fetch(`${firm.assureSign_url ? firm.assureSign_url : assureSignRoot}/envelopes/${envelopeId}`, options)
  .then(result => {
    result.json().then(response => {
      //console.log("RESPONSE", response);
      if(response.errorCode) {
        // something went wrong.
        logger.error("ERROR ", response);
        //logger.error("ERROR: ", response.summary)
        return callback({ success: false, message: response.summary })
      } else {
        return callback({ success: true, envelope: response.result.envelope });
      }
    })
  })
}

exports.getStatus = (firm, staff, authToken, finalEnvelopeId, callback) => {
  // console.log("Firing AssureSign getSigningLinks");
  // console.log(`GET ${assureSignRoot}/envelope/${finalEnvelopeId}/signingLinks`)
  if(!authToken) {
    callback({ success: false, message: "ERROR: Missing required authToken in request." })
  } else if(!finalEnvelopeId) {
    callback({ success: false, message: "ERROR: Missing required finalEnvelopeId in request." })
  }
  const options = {
    method: 'GET'
    , headers: {
      'Content-Type': 'application/json'
      ,'Accept': 'application/json'
      , 'Authorization': `Bearer ${authToken}`
      , 'X-AS-UserContext': `${staff.contextUsername}: ${firm.contextIdentifier}`
    }
  }

  fetch(`${firm.assureSign_url ? firm.assureSign_url : assureSignRoot}/envelopes/${finalEnvelopeId}/status`, options)
  .then(response => {
    response.json().then(parsedRes => {
      // console.log("RESPONSE", parsedRes);
      if(parsedRes.errorCode) {
        // something went wrong.
        logger.error('ERROR: ', parsedRes.summary)
        callback({ success: false, message: parsedRes.summary })
      } else {
        callback({ success: true, result: parsedRes.result })
      }
    });
  });
}
