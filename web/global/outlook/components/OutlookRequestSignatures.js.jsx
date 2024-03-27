/* global Office:false */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

import OutlookLoading from './OutlookLoading.js.jsx';

import Binder from '../../components/Binder.js.jsx';
import ProgressBar from '../../components/helpers/ProgressBar.js.jsx'
import {
  SelectFromObject
  , TextAreaInput
  , TextInput
  , ToggleSwitchInput
} from '../../components/forms';
import brandingName from '../../enum/brandingName.js.jsx';
import ISRichTextEditor from '../../components/forms/ISRichTextEditor.js.jsx';

// import utils
import { validationUtils, displayUtils } from'../../utils';
import sortUtils from '../../utils/sortUtils.js';

// import actions
import * as addressActions from '../../../resources/address/addressActions';
import * as clientActions from '../../../resources/client/clientActions';
import * as firmActions from '../../../resources/firm/firmActions';
import * as quickTaskActions from '../../../resources/quickTask/quickTaskActions';
import * as shareLinkActions from '../../../resources/shareLink/shareLinkActions';
import * as userActions from '../../../resources/user/userActions';
import * as staffClientActions from '../../../resources/staffClient/staffClientActions';

import FileDeliveryListItem from '../../../resources/file/components/FileDeliveryListItem.js.jsx';
import SignerInput from '../../../resources/quickTask/practice/components/SignerInput.js.jsx'

import moment from 'moment';
class OutlookRequestSignatures extends Binder {
  constructor(props) {
    super(props);

    this.state = {
      errorMessage: null
      // fetching is used to show a loading state while we fetch the template and generate the signer inputs.
      , fetching: false
      , formHelpers: _.cloneDeep(this.props.quickTaskStore.formHelpers)
      , fileId: this.props.location.state.uploadedFileIds[0] || null
      , kbaEnabled: false
      , progress: {
        message: 'Waiting'
        , percent: 0
      }
      , selectedClientId: this.props.location.state.clientId || null
      , selectedTemplate: null
      , shareLinkUrl: null 
      , showCopyPaste: false 
      , signers: [] // instead of an array of ids, we'll need an array of objects with signer.username (email), signer.firstname, and signer.lastname
                    // We are no longer requiring signers to be portal users and this way we won't be trying to fetch user info on the server.
      , submitting: false
      , templates: null
      , templateId: null
      , copySuccess: false
      , authType: 'none'
      , authTypes: [
        { display: 'Direct Link', val: 'none' }
        , { display: 'Question/Answer', val: 'secret-question' }
        , { display: 'Individual Authentication', val: 'individual-auth' }
      ]
      , password: ''
      , prompt: 'Please sign the attached document.'
      , selectedQuestion: 'dssn'
      , secretQuestions: {
        // dssn: { display: 'What are the last 4 numbers of your Social Security Number?', val: 'dssn', prompt: 'What are the last 4 numbers of your Social Security Number?'}
        // , dssn2: { display: 'What is your social security number, without the dashes?', val: 'dssn2', prompt: 'What is your social security number, without the dashes?'}
        // , dssn3: { display: `What are the last four numbers of the client's Social Security Number?`, val: 'dssn3', prompt: `What are the last four numbers of the client's Social Security Number?`}
        // , dphone: { display: 'What are the last 4 of your phone number?', val: 'dphone', prompt: 'What are the last 4 of your phone number?'}
        // , dzip: { display: 'What is your zip code?', val: 'dzip', prompt: 'What is your zip code?'}
        // , ftin: { display: 'What are the last four digits of your Federal Tax Identification Number?', val: 'ftin', prompt: 'What are the last four digits of your Federal Tax Identification Number?' }
      }
      , signingLinks: []
      , _personal: null
      , customeTemplate: { elements: [], signers: [] }
      , currentFile: {}
      , sN_viewSignatureRequest: true
      , sN_signingCompleted: true
      , sN_creatorAutoSignatureReminder: true
      , sN_clientAutoSignatureReminder: true
      , signerSigningOrderType: "sequential"
    };

    this._bind(
      '_checkAndSetEmailBody'
      , '_copyToClipboard'
      , '_getSignerList'
      , '_generateSignerInputs'
      , '_getTemplateById'
      , '_handleClose'
      , '_handleCreateSignatureRequest'
      , '_handleFormChange'
      , '_handleSignerChange'
      , '_handleTemplateChange'
      , '_validateSignerArray'
      , '_copyToClipboard'
      , '_handleCheckInputChange'
      , '_handleRTEChange'
    );

    this.linkInput = [];
    
    const { loggedInUser, socket } = this.props;

    socket.on('disconnect', reason => {
      // console.log('socket disconnected!!!');
      // console.log(reason);
      // We've been disconnected for some reason. Reconnect.
      socket.open();
    })

    // The connect event also fires on reconnect. That's when this will be hit since this component will not
    // yet be mounted when the socket first connects (when outlook.pug is loaded).
    socket.on('connect', () => {
      // console.log('Connected!');
      if(loggedInUser && loggedInUser._id) {
        // console.log('subscribing to userid');
        socket.emit('subscribe', loggedInUser._id);
      }
    })

    socket.on('signature_progress', progress => {
      // We don't send notification emails when an e-sig is generated from Outlook.
      // Change the message to make more sense.
      // console.log('progress', progress);
      if(progress.message == 'Notifying signers') {
        progress.message = 'Composing Email'
      }
      this.setState({ progress })
    });
  }

  componentDidMount() {
    const { dispatch, loggedInUser, selectedFirm, socket, isIframeInitialized, history } = this.props
    console.log('my history', history);

    if(socket && socket.disconnected) {
      socket.open();
    } else if(socket && socket.connected && loggedInUser && loggedInUser._id) {
      socket.emit('subscribe', loggedInUser._id);
    }
    if(selectedFirm && selectedFirm._id) {

      const currentFile = !!history.location.state.currentFile._id ? history.location.state.currentFile : {};

      this.setState({
        currentFile
      });

      const defaultAuth = selectedFirm.authDefault == "QA" ? 'secret-question' : 'none';
      console.log("defaultAuth", defaultAuth);
      this.setState({authType: defaultAuth});

      if(selectedFirm.secretQuestions) {
        const cusSecretQuestions = typeof(selectedFirm.secretQuestions) === "string" ? JSON.parse(selectedFirm.secretQuestions) : selectedFirm.secretQuestions;
  
        if(Object.entries(cusSecretQuestions).length > 0) {
          //set secret questions
          const {secretQuestions} = this.state;
          const other = {
            other: { display: 'Other', val: 'other', prompt: ''}
          }
          this.setState({secretQuestions: {...secretQuestions, ...cusSecretQuestions, ...other }});
        } else {
          const {secretQuestions} = this.state;
          const other = {
            other: { display: 'Other', val: 'other', prompt: ''}
          }
          this.setState({secretQuestions: {...secretQuestions, ...other }});
        }
      } else {
        const {secretQuestions} = this.state;
        const other = {
          other: { display: 'Other', val: 'other', prompt: ''}
        }
        this.setState({secretQuestions: {...secretQuestions, ...other }});
      }

      dispatch(clientActions.fetchListIfNeeded('_firm', selectedFirm._id))
      if(selectedFirm.eSigAccess) {
        // Fetch all assuresign templates available to this firm.
        dispatch(firmActions.sendGetTemplates(selectedFirm._id)).then(templateRes => {
          if(!templateRes.success) {
            // fail silently since they haven't actively triggered this action.
            let template = [];
            if (!isIframeInitialized) {
              template.unshift({ templateID: "custom", name: "Custom Template" });
            }
            this.setState({
              templates: template
            });
          } else {
            let template = [];
            if (templateRes.templates) {
              template = sortUtils._object(templateRes.templates, "name")  
            }
            if (!isIframeInitialized) {
              template.unshift({ templateID: "custom", name: "Custom Template" });
            }
            this.setState({
              templates: template
            });
          }
        });
      }
    }
  }

  componentDidUpdate(prevState) {
    const { dispatch } = this.props;
    if((!prevState.selectedClientId && this.state.selectedClientId) || (prevState.selectedClientId && this.state.selectedClientId && this.state.selectedClientId !== prevState.selectedClientId)) {
      dispatch(userActions.fetchListIfNeeded('_client', this.state.selectedClientId))
    }
  }

  componentWillUnmount() {
    const { socket } = this.props;
    socket.off('disconnect')
    socket.off('connect')
    socket.off('signature_progress')
  }

  _copyToClipboard = (i) => {
    this.linkInput[i].select();
    document.execCommand('copy');
    this.setState({copySuccess: true});
  };


  _handleCreateSignatureRequest(e) {
    // NOTE: This is a bit tricky. We need to create the sharelink before we create the quickTask
    // so we can use the sharelink url as the redirect url for assuresign. Then we have to save a reference
    // to the quicktask on the sharelink.
    const { dispatch, loggedInUser, selectedStaff, isIframeInitialized, history } = this.props;
        
    const { currentFile, authType, password, _personal, kbaEnabled, secretQuestions, selectedQuestion, sN_viewSignatureRequest
      , sN_signingCompleted, sN_creatorAutoSignatureReminder, sN_clientAutoSignatureReminder, signerSigningOrderType } = this.state;

    const shareLinkPassword = password;

    const shareLinkPrompt = secretQuestions[selectedQuestion] ? secretQuestions[selectedQuestion].prompt : "";

    if(e) {e.preventDefault()};
    this.setState({
      submitting: true
    })
    const newShareLink = {
      _firm: selectedStaff._firm
      , _client: this.state.selectedClientId
      , authType: authType // we are only checking for a matching email address. We may want to revisit to allow passwords etc...
      , _createdBy: loggedInUser._id
      , password: authType !== "none" ? shareLinkPassword : ""
      , prompt: authType !== "none" ? shareLinkPrompt : ""
      , type: 'signature-request'
      , sN_viewSignatureRequest
      , sN_signingCompleted
      , sN_creatorAutoSignatureReminder
      , sN_clientAutoSignatureReminder
    }

    if (_personal) {
      newShareLink._personal = _personal.replace("personal", "");
      newShareLink._client = null;
    }

    if(currentFile && currentFile._folder) {
      newShareLink._folder = currentFile._folder;
    }

    dispatch(shareLinkActions.sendCreateShareLink(newShareLink)).then(response => {
      if(response.success) {
        let shareLink = response.item
        // Put together a bit of a strange request body.

        let updatedSigners = [];

        updatedSigners = this.state.signers.map((signer) => {
          if(kbaEnabled) {
            const momentDOB = signer.kba.dob ? moment(signer.kba.dob) : '';

            if(momentDOB) {
              signer.kba.dobYear = momentDOB.year().toString();
              signer.kba.dobMonth = (momentDOB.month() + 1) + '';
              signer.kba.dobDay = momentDOB.date().toString();
            }
            signer.kba.ssn = signer.kba.ssn ? signer.kba.ssn.replace(/\D/g,'') : '';
            delete signer.kba.dob;
          }

          if (authType === "individual-auth" && signer.auth) {
            let selectedPrompt = "";
            if (signer.auth.selectedQuestions != "none") {
              selectedPrompt = secretQuestions[signer.auth.selectedQuestions] ? secretQuestions[signer.auth.selectedQuestions].prompt : null 
            }
            signer.auth.selectedPrompt = selectedPrompt;
          }
          return signer;
        })

        const eSigRequest = {
          _client: this.state.selectedClientId
          , _firm: selectedStaff._firm
          , type: 'signature'
          , _unsignedFiles: [this.state.fileId]
          , prompt: this.state.prompt
          , redirectUrl: shareLink.url
          , signers: updatedSigners
          , templateId: this.state.templateId
        }

        if (_personal) {
          eSigRequest._client = null;
        }

        if (this.state.templateId === "custom") {
          eSigRequest.customeTemplate = this.state.customeTemplate;
          eSigRequest.signerSigningOrderType = signerSigningOrderType;
        }

        dispatch(quickTaskActions.sendCreateQuickTask(eSigRequest)).then(taskRes => {
          if(taskRes.success) {
            // Now update the sharelink with the quickTask id.
            shareLink._quickTask = taskRes.item._id
            console.log("taskres quick task", taskRes);

            if(taskRes && taskRes.item && taskRes.item.signingLinks && taskRes.item.signingLinks.length > 0) {
              const links = taskRes.item.signingLinks;
              this.setState({
                signingLinks: links
              })
            }

            // We need a way to tell the server not to send an email when this is generated from outlook.
            shareLink.fromOutlook = !isIframeInitialized; // true
            dispatch(shareLinkActions.sendUpdateShareLinkWithPermission(shareLink)).then(shareLinkRes => {
              console.log("eyy", isIframeInitialized, shareLinkRes)
              if(shareLinkRes.success) {
                // // for testing locally 
                // this.setState({
                //   showCopyPaste: true
                //   , submitting: false
                //   , shareLinkUrl: shareLinkRes.item.url
                // })
                if (isIframeInitialized) {
                  this.setState({
                    shareLinkUrl: shareLinkRes.item.url 
                    , showCopyPaste: true
                    , submitting: false
                  });
                } else {
                  this._checkAndSetEmailBody(shareLinkRes.item, taskRes.item);
                }
              } else {
                this.setState({
                  errorMessage: 'Error code 602 - Unable to create signature request. Please try again.'
                });
              }
            })
          } else {
            this.setState({
              errorMessage: 'Error code 603 - Unable to create signature request. Please try again.'
            });
          }
        })
      } else {
        this.setState({
          errorMessage: 'Error code 604 - Unable to create signature request. Please try again.'
        });
      }
    })
  }

  _checkAndSetEmailBody(shareLink, quickTask) {
    const {
      dispatch
      , fileStore
      , firm
      , history
      , loggedInUser
      , selectedFirm
      , selectedStaff
      , isIframeInitialized
    } = this.props;
    Office.context.mailbox.item.body.getTypeAsync(result => {
      if(result.status == Office.AsyncResultStatus.Failed) {
        this.setState({
          errorMessage: 'Error code 605 - Unable to create signature request. Please try again.'
        });
      } else {
        // check if outlook version can insert content
        if (true) { // Office.context.requirements.isSetSupported("Mailbox", "1.2")) {
          /**
           * Insert the share link into the body of the email 
           * 
           * TODO: This is a big chunck of code. Consider pulling out into a util or something. 
           */

          // If the signers are sharing an email address, the sharelink will not be able to give them their individual links.
          // We'll need to add the direct signing link for each one.
          // We can tell if a request has a shared email address by checking for the presence of "(" which indicates an email comment.

          // Check all signatory emails for a (comment).
          let sharedEmail = false;
          quickTask.signingLinks.forEach(signer => {
            if(signer.signatoryEmail.includes('(')) {
              sharedEmail = true
            };
          })
          
          let uploadedFileNames = '';
          quickTask._unsignedFiles.forEach(id => {
            uploadedFileNames += `<span>${fileStore.byId[id].filename}<br/></span>`;
          });
          // check if allows HTML
          if(result.value == Office.MailboxEnums.BodyType.Html) {
            // allows HTML.
            let clientLink = ''

            // Create a single link to the shareLink.
            clientLink = `<tr>
              <td align="left" class="m_-8914233093517515089mcnButtonBlockInner" style="padding-top:0;padding-right:18px;padding-bottom:18px;padding-left:18px" valign="top">
                <table border="0" cellpadding="0" cellspacing="0" class="m_-8914233093517515089mcnButtonContentContainer" style="border-collapse:separate!important;border-radius:4px;background-color:#4ebac5">
                  <tbody>
                    <tr>
                      <td align="center" class="m_-8914233093517515089mcnButtonContent" style="font-family:&quot;Helvetica Neue&quot;,Helvetica,Arial,Verdana,sans-serif;font-size:12px;padding:20px" valign="middle">
                        <a class="m_-8914233093517515089mcnButton" href="${shareLink.url}" id="shareLink" style="font-weight:bold;letter-spacing:normal;line-height:100%;text-align:center;text-decoration:none;color:#ffffff;display:block" title="REVIEW AND SIGN">REVIEW AND SIGN</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>`

            let logoUrl = brandingName.image.logoWhite;
            if(selectedFirm.logoUrl) {
              const appUrl = !!window.location.host ? window.location.host : window.appUrl;
              let domain = selectedFirm.domain ? selectedFirm.domain : appUrl;
              logoUrl = `https://${domain}/api/firms/logo/${selectedStaff._firm}/${selectedFirm.logoUrl}`;
            }

            /**
             * NOTE: Removing the logo image from the insert of the email because outlook desktop is a hot pile of garbage
             * preserving here in case we want to try to debug & fix it later 
             * <td align="left" class="m_-8914233093517515089mcnCaptionRightImageContent" valign="top"><img alt="" class="m_-8914233093517515089mcnImage CToWUd" src="${logoUrl}" style="width:1.3645in;height:.2541in;max-width:200px;border:0;height:auto;outline:none;text-decoration:none;vertical-align:bottom" width="200"></td>
             */
            Office.context.mailbox.item.body.setSelectedDataAsync(
              `<br>
              <table border="0" cellpadding="0" cellspacing="0" id="m_-8914233093517515089templateContainer" style="border-collapse:collapse;border:1px solid #ddddd9" width="520">
                <tbody>
                  <tr>
                    <td align="center" valign="top">
                      <table border="0" cellpadding="0" cellspacing="0" id="m_-8914233093517515089templateHeaderOuter" style="border-collapse:collapse;background-color:#ffffff" width="100%">
                        <tbody>
                          <tr>
                            <td align="center" style="padding-bottom:1px" valign="top">
                              <table border="0" cellpadding="0" cellspacing="0" id="m_-8914233093517515089templateHeaderInner" style="border-collapse:collapse;border-top:0;border-bottom:1px solid #ddddd9" width="100%">
                                <tbody>
                                  <tr>
                                    <td class="m_-8914233093517515089headerContainer" style="padding-top:9px;padding-bottom:9px" valign="top">
                                      <table border="0" cellpadding="0" cellspacing="0" class="m_-8914233093517515089mcnCaptionBlock" style="border-collapse:collapse" width="100%">
                                        <tbody class="m_-8914233093517515089mcnCaptionBlockOuter">
                                          <tr>
                                            <td class="m_-8914233093517515089mcnCaptionBlockInner" style="padding:9px" valign="top">
                                              <table border="0" cellpadding="0" cellspacing="0" class="m_-8914233093517515089mcnCaptionRightContentOuter" style="border-collapse:collapse" width="100%">
                                                <tbody>
                                                  <tr>
                                                    <td class="m_-8914233093517515089mcnCaptionRightContentInner" style="padding:0 9px" valign="top">
                                                      <table align="left" border="0" cellpadding="0" cellspacing="0" class="m_-8914233093517515089mcnCaptionRightImageContentContainer" style="border-collapse:collapse" width="200">
                                                        <tbody>
                                                          <tr>
                                                          </tr>
                                                        </tbody>
                                                      </table>
                                                      <table align="right" border="0" cellpadding="0" cellspacing="0" class="m_-8914233093517515089mcnCaptionRightTextContentContainer" style="border-collapse:collapse" width="180">
                                                        <tbody>
                                                          <tr>
                                                            <td class="m_-8914233093517515089mcnTextContent" style="font-family:&quot;Helvetica Neue&quot;,Helvetica,Arial,Verdana,sans-serif;font-size:16px;font-style:normal;font-weight:bold;word-break:break-word;color:#000000;line-height:150%;text-align:left" valign="top">
                                                              <div style="text-align:right">
                                                                ${selectedFirm && selectedFirm.name}
                                                              </div>
                                                            </td>
                                                          </tr>
                                                        </tbody>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" valign="top">
                      <table border="0" cellpadding="0" cellspacing="0" id="m_-8914233093517515089templateColumnsOuter" style="border-collapse:collapse;background-color:#f5f5f5" width="100%">
                        <tbody>
                          <tr>
                            <td align="center" style="padding-top:1px;padding-bottom:1px" valign="top">
                              <table border="0" cellpadding="0" cellspacing="0" id="m_-8914233093517515089templateColumnsInner" style="border-collapse:collapse;border-top:1px dashed #ddddd9;border-bottom:1px dashed #ddddd9" width="100%">
                                <tbody>
                                  <tr>
                                    <td align="left" class="m_-8914233093517515089columnsContainer" valign="top" width="80%">
                                      <table align="left" border="0" cellpadding="0" cellspacing="0" class="m_-8914233093517515089templateColumn" style="border-collapse:collapse" width="100%">
                                        <tbody>
                                          <tr>
                                            <td class="m_-8914233093517515089leftColumnContainer" style="padding-top:9px;padding-bottom:9px" valign="top">
                                              <table border="0" cellpadding="0" cellspacing="0" class="m_-8914233093517515089mcnTextBlock" style="min-width:100%;border-collapse:collapse" width="100%">
                                                <tbody class="m_-8914233093517515089mcnTextBlockOuter">
                                                  <tr>
                                                    <td class="m_-8914233093517515089mcnTextBlockInner" style="padding-top:9px" valign="top">
                                                      <table align="left" border="0" cellpadding="0" cellspacing="0" class="m_-8914233093517515089mcnTextContentContainer" style="max-width:100%;min-width:100%;border-collapse:collapse" width="100%">
                                                        <tbody>
                                                          <tr>
                                                            <td class="m_-8914233093517515089mcnTextContent" style="padding:0px 18px 9px;font-family:&quot;Helvetica Neue&quot;,Helvetica,Arial,Verdana,sans-serif;font-size:14px;font-style:normal;font-weight:bold;word-break:break-word;color:#67696b;line-height:150%;text-align:left" valign="top">
                                                              <span>${uploadedFileNames}</span>
                                                            </td>
                                                          </tr>
                                                        </tbody>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" valign="top">
                      <table border="0" cellpadding="0" cellspacing="0" id="m_-8914233093517515089templateBodyOuter" style="border-collapse:collapse;background-color:#ebebeb" width="100%">
                        <tbody>
                          <tr>
                            <td align="center" style="padding-top:1px" valign="top">
                              <table border="0" cellpadding="0" cellspacing="0" id="m_-8914233093517515089templateBodyInner" style="border-collapse:collapse;border-top:1px solid #ddddd9;border-bottom:1px solid #ddddd9" width="100%">
                                <tbody>
                                  <tr>
                                    <td class="m_-8914233093517515089bodyContainer" style="padding-top:9px;padding-bottom:9px" valign="top">
                                      <table border="0" cellpadding="0" cellspacing="0" class="m_-8914233093517515089mcnButtonBlock" style="min-width:100%;border-collapse:collapse" width="100%">
                                        <tbody class="m_-8914233093517515089mcnButtonBlockOuter">
                                        ${clientLink}
                                        </tbody>
                                      </table>
                                      <table border="0" cellpadding="0" cellspacing="0" class="m_-8914233093517515089mcnTextBlock" style="min-width:100%;border-collapse:collapse" width="100%">
                                        <tbody class="m_-8914233093517515089mcnTextBlockOuter">
                                          <tr>
                                            <td class="m_-8914233093517515089mcnTextBlockInner" style="padding-top:9px" valign="top">
                                              <table align="left" border="0" cellpadding="0" cellspacing="0" class="m_-8914233093517515089mcnTextContentContainer" style="max-width:100%;min-width:100%;border-collapse:collapse" width="100%">
                                                <tbody>
                                                  <tr>
                                                    <td class="m_-8914233093517515089mcnTextContent" style="padding-top:0;padding-right:18px;padding-bottom:9px;padding-left:18px;word-break:break-word;color:#434547;font-family:'Helvetica Neue',Helvetica,Arial,Verdana,sans-serif;font-size:12px;line-height:150%;text-align:left" valign="top">
                                                      <span id="senderName">${selectedFirm.name}</span> is using ${brandingName.title} to request your signature securely. <a data-saferedirecturl="https://www.google.com/url?q=${brandingName.url}&amp;source=gmail&amp;ust=1565634960229000&amp;usg=AFQjCNH1fMpF2g3Sj-VEFVYugoC2OPvCvA" href="${brandingName.url}" style="color:#1b8f99;font-weight:normal;text-decoration:underline" target="_blank">Learn more</a>.
                                                    </td>
                                                  </tr>
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table><br>`,
              { coercionType: Office.CoercionType.Html },
              (asyncResult) => {
                if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
                  this._handleClose()
                } else {
                  this.setState({
                    errorMessage: 'Error code 600 - Unable to create signature request. Please try again.'
                    , submitting: false
                  });
                }
              }
            );
          } else {
            // does NOT allow HTML.
            let clientLink = ''
            if(sharedEmail) {
              // Create a direct signing link for each signer.
              quickTask.signingLinks.forEach((link, i) => {
                // NOTE: Added double newline characters here because apparently outlook sometimes ignores it if there's just one.
                clientLink += `${link.signerName} - ${link.url}\n\n`
              })
            } else {
              clientLink = `${shareLink.url}\n\n`
            }
            Office.context.mailbox.item.body.setSelectedDataAsync(
              `Please click the following link to sign the document:\n\n${clientLink}`,
              
              { coercionType: Office.CoercionType.Text },
              (asyncResult) => {
                if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
                  this._handleClose()
                } else {
                  this.setState({
                    errorMessage: 'Error code 601 - Unable to create signature request. Please try again.',
                  });
                }
              }
            );
          }
        } else {
          /**
           * Must be an older version of outlook that doesn't support inserting content 
           * to body of email.  Give user the option to copy/paste the link from here instead 
           * 
           * NOTE: Note this block should never run since we don't load the plugin unless outlook version is 1.2 or higher.
           */
          this.setState({
            shareLinkUrl: shareLink.url 
            , showCopyPaste: true
          });
        }
      } 
    });
  }

  _handleFormChange(e) {
    const { dispatch } = this.props;
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    const isCustom = this.state.templateId === "custom";

    if (e.target.name.indexOf('signers') > -1 && e.target.name.indexOf('selectedQuestions') > -1) {
      let newName = e.target.name.replace('[selectedQuestions]', '');
      let newValue = { selectedQuestions: e.target.value } 
      newState = _.update(_.cloneDeep(this.state), newName, (signer) => {
        if (e.target.value != "none" && signer && !signer.hasOwnProperty('password')) {
          newValue.password = '';
        }
        return newValue;
      });
    } else if (e.target.name === 'authType' && e.target.value === 'individual-auth' && newState.signers && newState.signers.length) {
      newState.signers.forEach(signer => {
        signer.auth = {
          selectedQuestions: 'dssn'
          , password: '' 
        }
      });
    }

    if(e.target.name.includes('username')) {
      // Check for duplicate emails in the signers array.
      // duplicateEmail will be set to true if any matching email addresses are found.
      newState.duplicateEmail = false;
      // signerEmails is used to store and compare all signer email addresses
      let signerEmails = ''
      newState.signers.forEach(signer => {
        // Check for a match.
        if(signer.username && signerEmails.includes(signer.username)) {
          // Setting this.state.duplicateEmail to true so we can disable confirm.
          newState.duplicateEmail = true
          // Adding sharedEmail: true to the signer tells the SignerInput to display the helpText
          // We don't allow shared emails on templates with more than 2 signers.
          if(newState.signers.length === 2) {
            signer.sharedEmail = true
          }
        } else {
          // Email is not a duplicate, delete the sharedEmail property from this signer object.
          delete signer.sharedEmail
        }
        // add the current email and go to the next one.
        signerEmails += signer.username
      });
      if(newState.duplicateEmail === true && newState.signers.length != 2) {
        newState.errorMessage = 'Shared email addresses are only supported for templates with 2 signers. Please enter a unique email address for each signer.'
      } else {
        newState.errorMessage = ''
      }
    }
    if(e.target.name === 'selectedClientId') {
      // Reset signers array when the client changes.
      const val = e.target.value ? e.target.value.toString() : "";
      const _personal = val.includes("personal") ? val : null;
      const selectedClientId = val.includes("personal") ? null : val ? val : null;
      newState.selectedClientId = selectedClientId;
      newState._personal = _personal;

      if (selectedClientId) {
        dispatch(staffClientActions.fetchListIfNeeded('_client', selectedClientId, '~staff.status', 'active'));
      }
      this.setState(newState, () => {
        if (!isCustom) {
          this._generateSignerInputs();
        }
      });
    } else {
      this.setState(newState);
    }
  }

  _handleSignerChange(e) {
    const { addressStore, userStore } = this.props;
    const { kbaEnabled } = this.state;
    let newState = _.update(_.cloneDeep(this.state), e.target.name, (signer) => {
      const user = userStore.byId[e.target.value];
      const userAddress = addressStore.byId[user && user._primaryAddress];
      let res = {};
      if(kbaEnabled) {
        res["username"] = user.username;
        res["firstname"] = user.firstname;
        res["lastname"] = user.lastname;
        res["_id"] = user._id;
        res["kba"] = {
          // auto-fill kba fields from user._primaryAddress (if it exists).
          // the staff member can still change it if they want.
          city: userAddress ? userAddress.city : ''
          , zip: userAddress ? userAddress.postal : ''
          , state: userAddress ? userAddress.state : ''
          , address: userAddress ? userAddress.street1 : ''
          , ssn: ''
          , dob: ''
        }
      } else {
        res["username"] = user.username;
        res["firstname"] = user.firstname;
        res["lastname"] = user.lastname;
        res["_id"] = user._id;
      }

      if (this.state.authType === "individual-auth") {
        res.auth = signer.auth;
      }
      return res;
    });
    this.setState(newState)
  }

  _handleClose() {
    const { selectedFirm, history, location: { state: { uploadedFileIds } } } = this.props;

    const defaultAuth = selectedFirm.authDefault == "QA" ? 'secret-question' : 'none';
    console.log("defaultAuth", defaultAuth);

    this.setState({
      authType: defaultAuth
      , authTypes: [
        { display: 'Direct Link', val: 'none' }
        , { display: 'Question/Answer', val: 'secret-question' }
        , { display: 'Individual Authentication', val: 'individual-auth' }
      ]
      , fileId: uploadedFileIds[0] || []
      , progress: {
        message: 'Waiting'
        , percent: 0
      }
      , prompt: 'Please sign the attached document.'
      , selectedClientId: null
      , selectedTemplate: null
      , shareLinkUrl: null 
      , showCopyPaste: false
      , signers: []
      , submitting: false
      , templateId: null
      , password: ''
      , prompt: ''
      , selectedQuestion: 'dssn'
      , _personal: null
      , customeTemplate: { elements: [], signers: [] }
      , sN_viewSignatureRequest: true
      , sN_signingCompleted: true
      , sN_creatorAutoSignatureReminder: true
      , sN_clientAutoSignatureReminder: true
    });

    history.replace('/'); // go all the way back to actions
  }

  _handleTemplateChange(e) {
    const { fileId } = this.state;
    const { fileStore, history, selectedFirm } = this.props;

    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    newState.fetching = true;


    if (e.target.name === "templateId" && e.target.value === "custom" && fileStore && fileStore.byId && fileStore.byId[fileId]) {

      const appUrl = !!window.location.host ? window.location.host : window.appUrl;
      const domain = appUrl;
      const tmpthis = this;

      let dialog = Office.dialog;

      console.log("debug1", dialog);

      // save dialog close and submit function
      function processMessage(arg) {
        const messageFromDialog = JSON.parse(arg.message);
        const { messageText, signers, customeTemplate } = messageFromDialog;
        if (messageText === "dialogClosed") {
          console.log("parent: received message");
          newState.signers = signers.map(signer => {
            if (tmpthis.state.authType === "individual-auth") {
              signer.auth = {
                selectedQuestions: 'dssn'
                , password: '' 
              } 
            }
            return signer;
          });
          newState.customeTemplate = customeTemplate;
          newState.fetching = false;
          tmpthis.setState(newState, () => dialog.close());
        }
      }

      Office.context.ui.displayDialogAsync(`https://${domain}/outlook/#/custom-template`, 
      { height: 85, width: 85, displayInIframe: true }, function(result) {

              
        console.log('domain', domain);
        console.log('dialog result', result);
        console.log(Office.AsyncResultStatus)

        if (result.status === Office.AsyncResultStatus.Failed) {
          console.log(result.error.code + ": " + result.error.message)
          // alert("Outlook client not supported");
        } else {
          dialog = result.value;
          // passing file to custom template
          localStorage.setItem("selectedFile", JSON.stringify(fileStore.byId[fileId]));
  
          dialog.addEventHandler(Office.EventType.DialogMessageReceived, processMessage);
        }
      });
    } else {
      // Fetch the actual template here so we can see how many signers the template is expecting.
      this.setState(newState, () => this._getTemplateById());
    }
  }

  // We need to fetch the actual template so we can generate the correct number of singer inputs.
  _getTemplateById() {
    const { dispatch, selectedFirm, match } = this.props;
    const { templateId } = this.state;
    // console.log('Fetching template by id', templateId);
    dispatch(quickTaskActions.sendGetTemplateById(selectedFirm._id, templateId)).then(templateRes => {
      if(!templateRes.success) {
        this.setState({
          errorMessage: 'An error occured while fetching this template. Please refresh the page and try again.'
        });
      } else {
        let selectedTemplate = templateRes.item.content
        this.setState({
          // Check if this template has kba enabled. We'll only check the first signer
          // and assume that if one has kba, they all have kba. May want to revisit if
          // we want to allow one template to have kba and non-kba signers.
          kbaEnabled: selectedTemplate.signers[0].enableKba
          , selectedTemplate: selectedTemplate
          // Reset signers array when the template changes.
        }, () => this._generateSignerInputs())
      }
    })
  }

  _getSignerList(userListItems) {
    let signerList = [];
    userListItems.forEach(user => {
      /**
       * NOTE: We'll need all user addresses to be in the map. This isn't a great way to do it
       * but without new list fetch overrides it's the only way to go.
       */
      this.props.dispatch(addressActions.fetchListIfNeeded('_user', user._id))
      let signerObject = {
        displayName: `${user.firstname} ${user.lastname}`
        , _id: user._id
        , signer: {
          username: user.username
          , firstname: user.firstname
          , lastname: user.lastname
        }
      }
      signerList.push(signerObject)
    })
    return signerList
  }

  // This has to happen dynamically and is based on the signerCount of the template being used.
  // The output is mapped to generate a SignerInput component for each.
  _generateSignerInputs() {
    const signerCount = this.state.selectedTemplate ? this.state.selectedTemplate.signers.length : 0;
    const { kbaEnabled } = this.state;
    let signers = [];
    for(let i = 0; i < signerCount; i++) {
      let signer;
      if(kbaEnabled) {
        signer = {
          firstname: ''
          , lastname: ''
          , username: ''
          , kba: {
            city: ''
            , zip: ''
            , state: ''
            , address: ''
            , ssn: ''
            , dob: ''
          }
        }
      } else {
        signer = {
          firstname: ''
          , lastname: ''
          , username: ''
        }
      }
      if (this.state.authType === "individual-auth") {
        signer.auth = {
          selectedQuestions: 'dssn'
          , password: '' 
        } 
      }
      signers.push(signer);
    }
    this.setState({
      fetching: false
      , signers: signers
    })
  }

  // Make sure we don't allow form submission until we have all required signer info.
  _validateSignerArray() {
    const { signers, kbaEnabled, authType } = this.state;

    let newSigners = [];
  
    //remove optional fields

    const cloneSigners = [...signers];

    for(const signer of cloneSigners) {

      let cloneSigner;

      if(kbaEnabled) {
        cloneSigner = {
          firstname: signer.firstname,
          lastname: signer.lastname,
          username: signer.username,
          kba: {
            address: signer.kba.address,
            city: signer.kba.city,
            state: signer.kba.state,
            zip: signer.kba.zip
          }
        };
      } else {
        cloneSigner = signer;
      }
      if (authType === 'individual-auth') {
        cloneSigner.auth = signer.auth;
      }
      newSigners.push(cloneSigner);
    }
    
    return validationUtils.checkObjectHasValues(newSigners);
  }

  // TODO: File request methods go below.
  _copyToClipboard = (i) => {
    this.linkInput[i].select();
    document.execCommand('copy');
    this.setState({copySuccess: true});
  };

  _handleCheckInputChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.checked;
    });

    if (e.target.name === "kbaEnabled" && newState.signers) {
      newState.signers = newState.signers.map(signer => {
        if (e.target.checked) {
          signer.kba = {
            address: signer && signer.kba && signer.kba.address ? signer.kba.address : "",
            city: signer && signer.kba && signer.kba.city ? signer.kba.city : "",
            state: signer && signer.kba && signer.kba.state ? signer.kba.state : "",
            zip: signer && signer.kba && signer.kba.zip ? signer.kba.zip : ""
          }
        } else {
          delete signer.kba
        }
        return signer;
      });
    }

    this.setState(newState);
  }

  _handleRTEChange(value) {
    console.log('tcContents', value);
    this.setState({prompt: value});
  }

  render() {
    const {
      fileStore
      , selectedStaff
      , userStore
      , workspaceList
      , isIframeInitialized
      , staffClientStore
      , loggedInUser
    } = this.props;
    const {
      errorMessage
      , fileId
      , formHelpers
      , progress
      , prompt
      , selectedClientId
      , selectedTemplate
      , shareLinkUrl
      , showCopyPaste
      , signers
      , submitting
      , templates
      , templateId
      , authTypes
      , authType
      , secretQuestions
      , selectedQuestion
      , password
      , signingLinks
      , _personal
      , customeTemplate
      , kbaEnabled
      , sN_viewSignatureRequest
      , sN_signingCompleted
      , sN_creatorAutoSignatureReminder
      , sN_clientAutoSignatureReminder
      , signerSigningOrderType
    } = this.state;
    const userListItems = selectedClientId ? userStore.util.getList('_client', selectedClientId) : null;
    const signerListItems = userListItems ? this._getSignerList(userListItems) : null;
    const disabled = (!selectedTemplate && templateId != "custom") || this.state.duplicateEmail || this.state.submitting || !this._validateSignerArray() || this.state.errorMessage;
    const staffClientsListItems = staffClientStore.util.getList('_client', selectedClientId, '~staff.status', 'active');
    const staffClientInfo = staffClientStore.util.getSelectedStore('_client', selectedClientId, '~staff.status', 'active');
    const selectedStaffClient = staffClientsListItems ? staffClientsListItems.filter(item => item._user === loggedInUser._id) : [];

    if (!workspaceList) {
      return (<OutlookLoading />);
    }

    let signersId = [];
    if (signers) {
      signersId = signers.filter(a => a._id).map(a => a._id);
      signersId = signersId.length ? signersId : null;
    }

    const selectedClient = selectedClientId && workspaceList ? workspaceList.filter(client => client._id == selectedClientId ? client : null) : null;    
    const individualQA = { individualQA: { display: 'Individual Question/Answer', val: 'individualQA', prompt: 'Individual Question/Answer' } };
    const directLink = { none: { display: 'Direct Link', val: 'none' } }
  
    if(brandingName.title == 'ImagineTime') {
      brandingName.title == 'ImagineShare';
    }

    return (
      <div style={{opacity: this.state.submitting || this.state.fetching ? 0.5 : 1}}>
        <h4>Request signatures</h4>
        <hr />
        { submitting ?
          <ProgressBar
            progress={progress}
          />
          :
          null
        }
        <br />
        {errorMessage && (
          // Add a new class so this isn't out of view at the top of the task pane.
          <div className="error-container">
            <div className="-error-message">{errorMessage}</div>
          </div>
        )}
        { showCopyPaste ?
        // Note: showCopyPaste should never be true since we don't load the plugin unless outlook version is 1.2 or higher.
          <div>
            <div className="-share-link-configuration">
              <div className="-header">
                <i className="fal fa-copy" style={{ marginRight: '8px' }} /> Signature request link created
              </div>
              <div className="-body ">
                <p>
                  <strong>Who can view?</strong><br/>
                </p>
                <p>
                {displayUtils.getShareLinkViewParams(this.state.authType)}
                </p>
                {
                  signingLinks.length > 1 ?
                  signingLinks.map((signingLink, index) => 
                    <div key={signingLink.envelopeID}>
                      <p>{signingLink.signerName}</p>
                      <div className="-copyable-share-link -visible -outlook">
                        <input ref={(input) => this.linkInput[index] = input} value={signingLink.url} readOnly={true}/> 
                      </div>
                      <div className="-copy-action -outlook">
                        <button type="button" className="yt-btn x-small block bordered info" onClick={(e) => {this._copyToClipboard(index)}}>Copy link</button>
                      </div>
                    </div>
                  ) : 
                  <div>
                    <div className="-copyable-share-link -visible -outlook">
                      <input ref={(input) => this.linkInput[0] = input} value={shareLinkUrl} readOnly={true}/> 
                    </div>
                    <div className="-copy-action -outlook">
                      <button type="button" className="yt-btn x-small block bordered info" onClick={(e) => {this._copyToClipboard(0)}}>Copy link</button>
                    </div>
                  </div>
                }
                {isIframeInitialized ? null :
                  <div className="alert-message general -left -small">
                    <p><small><strong>FYI: </strong>If you are able to upgrade your Outlook, then next time we can insert this link for you! </small></p> 
                  </div>
                }
              </div>
            </div>
            <div className="yt-container">
              <div className="yt-row right">
                <button
                  type="button"
                  className="yt-btn info small"
                  onClick={this._handleClose}
                >
                  All done
                </button>
              </div>
            </div>
          </div>
          : 
          <div>
            <div className="-share-link-configuration">
              <div className="-header">
                <i className="fal fa-file-export" style={{marginRight: '8px'}}  /> File to sign
              </div>
              <div className="-body">
              { fileId ?
                <FileDeliveryListItem
                  key={`${fileId}_file`}
                  file={fileStore.byId[fileId]}
                  filePath={`/firm/${selectedStaff._firm}/files/${fileId}`}
                  allowRemove={false}
                />
                :
                null
              }
              </div>
            </div>
            <div className="-share-link-configuration">
              <div className="-header">
                <i className="fas fa-file-signature" style={{marginRight: '8px'}} /> Signature request details
              </div>
              <div className="-body">
                <div className="-setting yt-row space-between">
                  <div className="-instructions yt-col full">
                    <p><strong>Who has access</strong></p>
                    <small>Control who can view this request link</small>
                  </div>
                  <div className="-inputs yt-col full">
                    <SelectFromObject 
                      change={this._handleFormChange}
                      items={authTypes}
                      display="display"
                      displayStartCase={false}
                      name="authType"
                      selected={authType}
                      value="val"
                    />
                    { authType === 'secret-question' ?
                      <div>
                        <SelectFromObject
                          change={this._handleFormChange}
                          items={{ ...individualQA, ...secretQuestions}}
                          display="display"
                          displayStartCase={false}
                          name="selectedQuestion"
                          selected={selectedQuestion}
                          value="val"
                        />
                        { selectedQuestion === 'other' ?
                          <TextInput
                            change={this._handleFormChange}
                            name={`secretQuestions.${selectedQuestion}.prompt`}
                            placeholder="Custom secret question"
                            required
                            value={secretQuestions[selectedQuestion].prompt}
                          />
                          :
                          null
                        }
                        <TextInput
                          change={this._handleFormChange}
                          helpText="Make sure the answer is something you both know"
                          name="password"
                          placeholder="Shared answer"
                          required
                          value={password}
                        />
                      </div>
                      :
                      null
                    }
                  </div>
                </div>
                <hr/>
                <div className="-setting yt-row space-between">
                  <div className="-instructions yt-col">
                    <p>Notify when viewed</p>
                  </div>
                  <div className="-inputs yt-col">
                    <ToggleSwitchInput
                      change={this._handleFormChange}
                      disabled={false}
                      inputClasses="-right"
                      name="sN_viewSignatureRequest"
                      required={false}
                      rounded={true}
                      value={sN_viewSignatureRequest}
                    />
                  </div>
                </div>
                <hr/>
                <div className="-setting yt-row space-between">
                  <div className="-instructions yt-col">
                    <p>Notify when completed</p>
                  </div>
                  <div className="-inputs yt-col">
                    <ToggleSwitchInput
                      change={this._handleFormChange}
                      disabled={false}
                      inputClasses="-right"
                      name="sN_signingCompleted"
                      required={false}
                      rounded={true}
                      value={sN_signingCompleted}
                    />
                  </div>
                </div>
                { (staffClientInfo && staffClientInfo.isFetching) || (selectedStaffClient && selectedStaffClient.length) ? null : <hr/> }
                { (staffClientInfo && staffClientInfo.isFetching) || (selectedStaffClient && selectedStaffClient.length) ? null : 
                  <div className="-setting yt-row space-between">
                    <div className="-instructions yt-col">
                      <p>Your weekly reminder for incomplete signature requests</p>
                    </div>
                    <div className="-inputs yt-col">
                      <ToggleSwitchInput
                        change={this._handleFormChange}
                        disabled={false}
                        inputClasses="-right"
                        name="sN_creatorAutoSignatureReminder"
                        required={false}
                        rounded={true}
                        value={sN_creatorAutoSignatureReminder}
                      />
                    </div>
                  </div>
                }
                { selectedClient && selectedClient[0] && selectedClient[0]._id ? null : <hr/> }
                { selectedClient && selectedClient[0] && selectedClient[0]._id ? null :
                  <div className="-setting yt-row space-between">
                    <div className="-instructions yt-col">
                      <p>Signer's weekly reminder for incomplete signature requests</p>
                    </div>
                    <div className="-inputs yt-col">
                      <ToggleSwitchInput
                        change={this._handleFormChange}
                        disabled={false}
                        inputClasses="-right"
                        name="sN_clientAutoSignatureReminder"
                        required={false}
                        rounded={true}
                        value={sN_clientAutoSignatureReminder}
                      />
                    </div>
                  </div>
                }
                <hr/>
                <div className="-setting yt-row space-between">
                  <div className="-inputs yt-col full">
                    <SelectFromObject
                      change={this._handleTemplateChange}
                      display="name"
                      filterable={true}
                      label="Template"
                      helpText="Choose a template to match your file"
                      name="templateId"
                      value="templateID"
                      items={templates || []}
                      required={true}
                      selected={templateId}
                      displayStartCase={false}
                    />
                  </div>
                </div>
                <div className="-setting yt-row space-between">
                  <div className="-inputs yt-col full">
                    <SelectFromObject
                      change={this._handleFormChange}
                      display="name"
                      filterable={true}
                      label="Client"
                      helpText="Choose a template to match your file"
                      name="selectedClientId"
                      value="_id"
                      items={workspaceList}
                      selected={selectedClientId ? selectedClientId : _personal}
                      isClearable={true}
                    />
                  </div>
                </div>
                { signers && signers.length ? <hr/> : null }
                {
                  signers && signers.length ?
                  <div className="-setting yt-row space-between">
                    <div className="-inputs yt-col full">
                      {
                        templateId === "custom" && brandingName.title != 'LexShare'?
                        <div className="input-group" style={{ marginBottom: "5px" }}>
                          <input
                            checked={kbaEnabled}
                            disabled={false}
                            name="kbaEnabled"
                            onChange={this._handleCheckInputChange}
                            type="checkbox"
                            value={kbaEnabled}
                          />
                          <small className="help-text" style={{ fontWeight: 600, position: "relative", bottom: "1px" }}><em>Enable KBA</em></small>
                        </div>
                        : null
                      }
                      {
                        templateId === "custom" && signers && signers.length > 1 ?
                        <SelectFromObject
                          change={this._handleFormChange}
                          display="name"
                          filterable={true}
                          label="Signers can sign..."
                          name="signerSigningOrderType"
                          value="value"
                          items={[{ name: "In any order", value: "parallel" }, { name: "In the displayed order", value: "sequential" }]}
                          required={true}
                          selected={signerSigningOrderType}
                          displayStartCase={false}
                        />
                        : null
                      }
                      { this.state.fetching ?
                          <div className="loading -small"/>
                          :  
                          signers ?
                          signers.map((signer, i) => 
                            <SignerInput
                              allowSharedEmail={this.state.signers && this.state.signers.length === 2}
                              change={this._handleFormChange}
                              handleSignerChange={this._handleSignerChange}
                              currentIndex={i}
                              key={'signer' + '_' + i}
                              signerListItems={sortUtils._object(signerListItems, "displayName") || []}
                              signer={signer}
                              signersId={signersId}
                              selectedClient={selectedClient ? selectedClient[0] : null}
                              selectedQuestion={selectedQuestion}
                              secretQuestions={{ ...directLink, ...secretQuestions }}
                              signers={signers}
                              authType={authType}
                            />
                          )
                          :
                          null
                        }
                    </div>
                  </div>
                  : null
                }
                <hr/>
                <div className="setting yt-row space-between">
                  <TextAreaInput
                    change={this._handleFormChange}
                    label="Instructions"
                    name="prompt"
                    rows='2'
                    value={prompt}
                  />
                </div>
              </div>
            </div>
            <div className="yt-container">
              <div className="yt-row space-between">
                <button
                  type="button"
                  className="yt-btn info small link"
                  onClick={this._handleClose}
                >
                  cancel
                </button>
                <button
                  type="button"
                  className="yt-btn info small"
                  onClick={this._handleCreateSignatureRequest}
                  disabled={disabled}
                >
                  Create link
                </button>
              </div>
            </div>
          </div>
        } 
      </div>
    );
  }
}

OutlookRequestSignatures.propTypes = {
  dispatch: PropTypes.func.isRequired
  , history: PropTypes.object.isRequired
  , selectedStaffId: PropTypes.number.isRequired
};

const mapStoreToProps = (store, props) => {
  const { selectedStaffId } = props;
  const staffStore = store.staff;
  const firmStore = store.firm;
  const selectedStaff = staffStore.byId[selectedStaffId]
  const selectedFirm = selectedStaff && firmStore.byId[selectedStaff._firm];
  const loggedInUser = store.user.loggedIn.user;
  const staffClientStore = store.staffClient;

  const isStaffOwner = selectedStaff && selectedStaff.owner // permissions.isStaffOwner(selectedStaff, loggedInUser, selectedFirm._id);

  const staffClientListItems = staffClientStore.util.getList('_firm', selectedStaff._firm, '_user', loggedInUser._id, '~staff.status', 'active')
  const staffOnlyClientList = staffClientListItems ? staffClientListItems.map((item => item._client)) : [];

  const clientList = store.client.lists && store.client.lists._firm && store.client.lists._firm[selectedStaff._firm] && !store.client.lists._firm[selectedStaff._firm].isFetching? store.client.lists._firm[selectedStaff._firm].items : [];

  let workspaceList = [];
  if(isStaffOwner) {
    workspaceList = clientList.map(clientId => store.client.byId[clientId])
  } else {
    workspaceList = staffOnlyClientList.map(clientId => store.client.byId[clientId])
  }

  workspaceList = workspaceList.filter(client => client ? client.status === "visible" : null);
  workspaceList = sortUtils._object(workspaceList, "name") || [];

  if (workspaceList && loggedInUser && selectedFirm) {
    workspaceList.unshift({
      _id: `personal${loggedInUser._id}`
      , name: "Your Staff Files"
      , _firm: selectedFirm._id
      , _staff: loggedInUser._id
    });
  }

  return {
    addressStore: store.address
    , clientStore: store.client
    , fileStore: store.file
    , loggedInUser: store.user.loggedIn.user
    , quickTaskStore: store.quickTask
    , selectedFirm
    , selectedStaff
    , socket: store.user.socket
    , staffStore: store.staff
    , userStore: store.user
    , workspaceList
    , staffClientStore: store.staffClient
  }
};

export default withRouter(connect(mapStoreToProps)(OutlookRequestSignatures));
