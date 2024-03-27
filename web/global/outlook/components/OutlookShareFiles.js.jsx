/* global Office:false */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

import OutlookLoading from './OutlookLoading.js.jsx';

import Binder from '../../components/Binder.js.jsx';
import {
  SelectFromArray
  , SelectFromObject
  , SingleDatePickerInput
  , TextInput
  , ToggleSwitchInput
} from '../../components/forms';

import * as shareLinkActions from '../../../resources/shareLink/shareLinkActions';
import * as clientUserActions from '../../../resources/clientUser/clientUserActions';
import * as userActions from '../../../resources/user/userActions'; 

import FileDeliveryListItem from '../../../resources/file/components/FileDeliveryListItem.js.jsx';

import { displayUtils } from '../../utils';
import brandingName from '../../enum/brandingName.js.jsx';

class OutlookShareFiles extends Binder {
  constructor(props) {
    super(props);

    this.state = {
      authType: 'none'
      , authTypes: [
        { display: 'Direct Link', val: 'none' }
        , { display: 'Question/Answer', val: 'secret-question' }
      ]
      , clientId: this.props.location.state.clientId || null
      , userId: null
      , copySuccess: false
      , errorMessage: null
      , expires: false
      , expireDate: DateTime.local().plus({ days: 30 }).toMillis()
      , fileIds: this.props.location.state.uploadedFileIds || []
      , password: ''
      , prompt: ''
      , selectedQuestion: 'dssn'
      , secretQuestions: {
        // dssn: { display: 'What are the last 4 numbers of your Social Security Number?', val: 'dssn', prompt: 'What are the last 4 numbers of your Social Security Number?'}
        // , dssn2: { display: 'What is your social security number, without the dashes?', val: 'dssn2', prompt: 'What is your social security number, without the dashes?'}
        // , dssn3: { display: `What are the last four numbers of the client's Social Security Number?`, val: 'dssn3', prompt: `What are the last four numbers of the client's Social Security Number?`}
        // , dphone: { display: 'What are the last 4 of your phone number?', val: 'dphone', prompt: 'What are the last 4 of your phone number?'}
        // , dzip: { display: 'What is your zip code?', val: 'dzip', prompt: 'What is your zip code?'}
        // , ftin: { display: 'What are the last four digits of your Federal Tax Identification Number?', val: 'ftin', prompt: 'What are the last four digits of your Federal Tax Identification Number?' }
      }
      , shareLinkUrl: null
      , showCopyPaste: false
      , submitting: false
      , updateLink: this.props.location.state.shareLink && this.props.location.state.shareLink._files ? this.props.location.state.shareLink._files : []
      , shareLink: this.props.location.state.shareLink || {}
      , sN_viewed: true
      , sN_downloaded: true
      , showTermsConditions: false
    };

    this._bind(
      '_checkAndSetEmailBody',
      '_copyToClipboard',
      '_handleClose',
      '_handleCreateShareLink',
      '_handleClientChange',
      '_handleFormChange',
      '_handleRemoveFile',
      '_handleUpdateShareLink'
    );
  }

  componentDidMount() {
    const { clientStore, selectedFirm } = this.props;
    const { clientId } = this.state;
    const selectedClient = clientStore.byId[clientId]

    this._handleClientChange(selectedClient)

    if(selectedFirm && selectedFirm._id) {
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
    }
  }

  componentDidUpdate(prevProps) {
    const { clientStore } = this.props;
    const { clientId } = this.props.location.state;
    if((!prevProps.location.state.clientId && clientId) || (prevProps.location.state.clientId != clientId)) {
      const selectedClient = clientStore.byId[clientId]
      this._handleClientChange(selectedClient)
    }
  }

  _handleClientChange(selectedClient) {
    
    const { dispatch, userStore } = this.props;
    let authTypes = [
      { display: 'Direct Link', val: 'none' }
      , { display: 'Question/Answer', val: 'secret-question' }
    ]
    if(selectedClient) {
      // If there is a client and that client has a secret question add that option to the list.
      if(selectedClient.sharedSecretPrompt) {
        authTypes.push({ display: `${selectedClient.name} - Secret Question`, val: 'shared-client-secret' })
      }
      dispatch(clientUserActions.fetchListIfNeeded('_client', selectedClient._id)).then(cuRes => {
        if(cuRes.success) {
          let userList = cuRes.list.map(cu => userStore.byId[cu._user]);
          let filteredUserList = userList && userList.filter(user => user.sharedSecretPrompt ? user : null);
          let userSecretQuestionList = filteredUserList ? filteredUserList.map(user => {
            return {
              display: `${user.firstname} ${user.lastname} - shared secret question`
              , val: user._id
            }
          })
          :
          []
          // Add an option to the authTypes list for client user secret quetions
          if(userSecretQuestionList && userSecretQuestionList.length > 0){
            authTypes.push({ display: 'Specific Contact\'s Secret Question', val: 'shared-contact-secret' })
          }
          this.setState({
            authTypes
            , clientId: selectedClient._id
            , userSecretQuestionList
          })
        } else {
          alert("There was a problem fetching client information. Please try again.")
        }
      })
    } else {
      this.setState({
        authTypes
        , clientId: null
        , userId: null
      })
    }
  }

  _handleCreateShareLink() {
    const {
      clientStore
      , userStore
      , dispatch
      , selectedFirm
      , isIframeInitialized
    } = this.props;
    const {
      authType
      , clientId 
      , userId
      , expires
      , expireDate
      , fileIds
      , password
      , prompt
      , sN_viewed
      , sN_downloaded
      , showTermsConditions
    } = this.state; 

    // console.log("pros", this.props);
    // console.log('Office.context.requirements.isSetSupported("Mailbox", "1.2")', Office.context.requirements.isSetSupported("Mailbox", "1.2"))
    // console.log("Office.context.requirements", Office.context.requirements)
    // console.log("authType", authType);

    if(authType == "secret-question") {
      console.log("this.state", this.state);

      const shareLinkSelectedQuestion = this.state.selectedQuestion
      const shareLinkPassword = password;

      if(!shareLinkSelectedQuestion || !shareLinkPassword) {
        console.log("shareLinkPrompt", shareLinkPrompt);
        console.log("shareLinkPassword", shareLinkPassword);
        alert('There was a problem creating the shareLink.');
        return;
      }
    }

    this.setState({
      submitting: true
    });

    const shareLinkPassword = (
      authType === 'shared-client-secret' ?
      clientStore.byId[clientId].sharedSecretAnswer
      :
      authType === 'shared-contact-secret' ?
      userStore.byId[userId].sharedSecretAnswer
      :
      password
    )

    const shareLinkPrompt = (
      authType === 'shared-client-secret' ?
      clientStore.byId[clientId].sharedSecretPrompt
      :
      authType === 'shared-contact-secret' ?
      userStore.byId[userId].sharedSecretPrompt
      :
      authType === 'secret-question' ?
      this.state.secretQuestions[this.state.selectedQuestion].prompt
      :
      prompt
    )

    let newShareLink = {
      _client: clientId
      , _firm: selectedFirm._id
      , _files: fileIds
      , authType
      , expireDate: expires ? new Date(expireDate) : null
      , password: shareLinkPassword
      , prompt: shareLinkPrompt
      , type: 'share'
      , showTermsConditions: showTermsConditions
    }

    if (!clientId) {
      newShareLink.sN_viewed = sN_viewed;
      newShareLink.sN_downloaded = sN_downloaded;
    }

    dispatch(
      shareLinkActions.sendCreateShareLink(newShareLink)
    ).then(response => {
      if (response.success) {
        // // for testing locally 
        if (isIframeInitialized) {
          this.setState({
            shareLinkUrl: response.item.url 
            , showCopyPaste: true
            , shareLink: response.item
            , updateLink: response.item._files
          })
        } else {
          this._checkAndSetEmailBody(response.item);
          dispatch(shareLinkActions.fetchSingleIfNeeded(response.item._id)).then(response => {
            if (response.success) {
              this.setState({ updateLink: response.item._files, submitting: false, shareLink: response.item });
            }
          })
        }
      } else {
        this.setState({
          errorMessage: 'Error code 505 - Unable to create share link. Please try again.',
        });
      }
    });
  }

  _copyToClipboard = e => {
    this.linkInput.select();
    document.execCommand('copy');
    this.setState({copySuccess: true});
  };

  _checkAndSetEmailBody(shareLink) {
    const {
      fileStore
      , selectedFirm
      , isIframeInitialized
    } = this.props;

    if (!isIframeInitialized) {
      Office.context.mailbox.item.body.getTypeAsync(result => {
        if(result.status == Office.AsyncResultStatus.Failed) {
          this.setState({
            errorMessage: 'Error code 506 - Something wrong with the Outlook client. Please try again or contact support for more assistance.',
          });
        } else {
          let uploadedFileNames = '';
          shareLink._files.forEach(id => {
            uploadedFileNames += `<span>${fileStore.byId[id].filename}<br/></span>`;
          });

          // check if outlook version can insert content 
          if (true) { // Office.context.requirements.isSetSupported("Mailbox", "1.2")) {
            /**
             * Insert the share link into the body of the email 
             * 
             * TODO: This is a big chunck of code. Consider pulling out into a util or something. 
             */
  
            // check if allows HTML
            if(result.value == Office.MailboxEnums.BodyType.Html) {
              /**
               * Email client allows HTML be inserted.  
               */
              let logoUrl = brandingName.image.logoWhite;
              if(selectedFirm.logoUrl) {
                const appUrl = !!window.location.host ? window.location.host : window.appUrl;
                let domain = selectedFirm.domain ? selectedFirm.domain : appUrl;
                logoUrl = `https://${domain}/api/firms/logo/${selectedFirm._id}/${selectedFirm.logoUrl}`;
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
                                                        <table align="right" border="0" cellpadding="0" cellspacing="0" class="m_-8914233093517515089mcnCaptionRightTextContentContainer" style="border-collapse:collapse" width="100%">
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
                                                                <span class="-imaginetime-files-list">${uploadedFileNames}</span>
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
                                            <tr>
                                              <td align="left" class="m_-8914233093517515089mcnButtonBlockInner" style="padding-top:0;padding-right:18px;padding-bottom:18px;padding-left:18px" valign="top">
                                                <table border="0" cellpadding="0" cellspacing="0" class="m_-8914233093517515089mcnButtonContentContainer" style="border-collapse:separate!important;border-radius:4px;background-color:#4ebac5">
                                                  <tbody>
                                                    <tr>
                                                      <td align="center" class="m_-8914233093517515089mcnButtonContent" style="font-family:&quot;Helvetica Neue&quot;,Helvetica,Arial,Verdana,sans-serif;font-size:12px;padding:20px" valign="middle">
                                                        <a class="m_-8914233093517515089mcnButton" href="${shareLink.url}" id="shareLink" style="font-weight:bold;letter-spacing:normal;line-height:100%;text-align:center;text-decoration:none;color:#ffffff;display:block" title="DOWNLOAD FILES">DOWNLOAD FILES</a>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </td>
                                            </tr>
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
                                                        <span id="senderName">${selectedFirm.name}</span> is using ${brandingName.title == 'ImagineTime' ? 'ImagineShare': 'LexShare'} to share documents securely. <a data-saferedirecturl="https://www.google.com/url?q=${brandingName.url}&amp;source=gmail&amp;ust=1565634960229000&amp;usg=AFQjCNH1fMpF2g3Sj-VEFVYugoC2OPvCvA" href="${brandingName.url}" style="color:#1b8f99;font-weight:normal;text-decoration:underline" target="_blank">Learn more</a>.
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
                    // this._handleClose()
                    // do nothing
                  } else {
                    this.setState({
                      errorMessage: 'Error code 507 - Unable to create share link. Please try again.',
                    });
                  }
                }
              );
            } else {
              /**
               * The email client does NOT allow HTML to be inserted (i.e. Outlook for the web, on mobile)
               * Insert plain text instead. 
               */ 
              Office.context.mailbox.item.body.setSelectedDataAsync(
                `Please click the following link to download files:\n ${shareLink.url}\n`,
                
                { coercionType: Office.CoercionType.Text },
                (asyncResult) => {
                  if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
                    // this._handleClose()
                    // do nothing
                  } else {
                    this.setState({
                      errorMessage: 'Error code 508 - Unable to create share link. Please try again.',
                    });
                  }
                }
              );
            }
          } else {
            /**
             * Must be an older version of outlook that doesn't support inserting content 
             * to body of email.  Give user the option to copy/paste the link from here instead 
             */
            this.setState({
              shareLinkUrl: shareLink.url 
              , showCopyPaste: true
            })
          }
        }
      });
    }
  }

  _handleUpdateShareLink() {
    const { dispatch, fileStore, isIframeInitialized } = this.props;
    const { updateLink, shareLink, fileIds } = this.state;
    if (updateLink && updateLink.length && shareLink && shareLink._id) {
      const newShareLink = _.cloneDeep(shareLink);
      newShareLink._files = fileIds;
      this.setState({ submitting: true });
      dispatch(shareLinkActions.sendUpdateShareFilesLink(newShareLink)).then(json => {
        if(json.success) {
          // this._checkAndSetEmailBody(json.item);
          dispatch(shareLinkActions.fetchSingleShareLinkById(json.item._id)).then(response => {
            if (response.success) {
              console.log("isIframeInitialized", isIframeInitialized, response)
              if (isIframeInitialized) {
                this.setState({
                  shareLinkUrl: response.item.url 
                  , showCopyPaste: true
                  , shareLink: response.item
                  , updateLink: response.item._files
                });
              } else {
                this._checkAndSetEmailBody(response.item);
                // Office.context.mailbox.item.body.getTypeAsync(result => {
                //   if(result.status == Office.AsyncResultStatus.Failed) {
                //     this.setState({
                //       errorMessage: 'Error code 506 - Something wrong with the Outlook client. Please try again or contact support for more assistance.',
                //     });
                //   } else if (result.value == Office.MailboxEnums.BodyType.Html) {
                //     Office.context.mailbox.item.body.getAsync(Office.CoercionType.Html, (result) => {
                //       if (result.status === Office.AsyncResultStatus.Succeeded) {
                //         let uploadedFileNames = '';
                //         response.item._files.forEach(id => {
                //           uploadedFileNames += `<span>${fileStore.byId[id].filename}<br/></span>`;
                //         });
                //         const bodyString = result.value;
                //         const firstStringIndex = bodyString.lastIndexOf(`<span class="x_-imaginetime-files-list">`); 
                //         const firstString = bodyString.substr(0, firstStringIndex);
                //         const temporary = bodyString.substr(firstStringIndex);
                //         const lastStringIndex = temporary.indexOf("</td>");
                //         const lastString = temporary.substr(lastStringIndex);
                //         const middleString = `<span class="-imaginetime-files-list">${uploadedFileNames}</span>`;
                //         const newHtml = firstString + middleString + lastString;
                //         Office.context.mailbox.item.body.setAsync(
                //           newHtml,
                //           {coercionType: Office.CoercionType.Html},
                //           (asyncResult) => {
                //             if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
                //               // this._checkAndSetEmailBody(json.item);
                //             } else {
                //               this.setState({
                //                 errorMessage: 'Error code 507 - UUnable to update share link. Please try again.',
                //               });
                //             }
                //           }
                //         );
                //       } else {
                //         this.setState({
                //           errorMessage: 'Error code 507 - UUnable to update share link. Please try again.',
                //         });
                //       }
                //     });
                //   }
                // });
                this.setState({ updateLink: response.item._files, submitting: false, shareLink: response.item });  
              }
            }
          });
        } else {
          alert('something went wrong');
        }
      })
    }
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    const newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleClose() {
    const { selectedFirm, dispatch, history, location: { state: { uploadedFileIds } } } = this.props;

    dispatch(shareLinkActions.invalidateSelected());

    const defaultAuth = selectedFirm.authDefault == "QA" ? 'secret-question' : 'none';
    console.log("defaultAuth", defaultAuth);

    this.setState({
      authType: defaultAuth
      , authTypes: [
        { display: 'Direct Link', val: 'none' }
        , { display: 'Question/Answer', val: 'secret-question' }
      ]
      , clientId: null
      , userId: null
      , copySuccess: false
      , errorMessage: null
      , expires: false
      , expireDate: DateTime.local().plus({ days: 30 }).toMillis()
      , fileIds: uploadedFileIds || []
      , password: ''
      , prompt: ''
      , shareLinkUrl: null
      , showCopyPaste: false
      , submitting: false
      , selectedQuestion: 'dssn'
      , shareLink: {}
      , updateLink: []
      , sN_viewed: true
      , sN_downloaded: true
    });
    // history.goBack();
    // for chrome store purposes history.replace("/actions");
    history.replace("/actions");
  }

  _handleRemoveFile(fileId) {
    const newFiles = this.state.fileIds;
    const index = newFiles.indexOf(fileId);
    newFiles.splice(index, 1);
    this.setState({ fileIds: newFiles });
  }

  render() {
    const { clientStore, fileStore, selectedFirm, shareLinkStore, history, location, isIframeInitialized } = this.props;
    const {
      authType
      , authTypes
      , clientId
      , errorMessage
      , expires
      , expireDate
      , fileIds
      , password
      , prompt
      , shareLinkUrl
      , showCopyPaste
      , submitting
      , updateLink
      , shareLink
      , sN_viewed
      , sN_downloaded
    } = this.state;
    
    const selectedClient = clientId ? clientStore.byId[clientId] : null;

    if (shareLinkStore.selected.isFetching) {
      return (<OutlookLoading />);
    }

    return (
      <div>
        <h4>{selectedClient ? `Share files associated with ${selectedClient.name}`: 'Share files'}</h4>
        <hr />
        <br />
        {errorMessage && (
          <div className="input-group">
            <div className="-error-message">{errorMessage}</div>
          </div>
        )}
       
        { showCopyPaste ? 
          <div>
            <div className="-share-link-configuration">
              <div className="-header">
                <i className="fal fa-copy" style={{ marginRight: '8px' }} /> Share link created
              </div>
              <div className="-body ">
                <p>
                  <strong>Who can view?</strong><br/>
                </p>
                <p>
                {displayUtils.getShareLinkViewParams(this.state.authType)}
                </p>
                <div className="-copyable-share-link -visible -outlook">
                  <input ref={(input) => this.linkInput = input} value={shareLinkUrl} readOnly={true}/> 
                </div>
                <div className="-copy-action -outlook">
                  <button type="button" className="yt-btn x-small block bordered info" onClick={this._copyToClipboard}>Copy link</button>
                </div>
                {isIframeInitialized ? null :
                  <div className="alert-message general -left -small">
                    <p><small><strong>FYI: </strong>If you are able to upgrade your Outlook, then next time we can insert this link for you! </small></p> 
                  </div>
                }
                {
                  isIframeInitialized && updateLink.length ?
                  <div className="-share-link-configuration">
                    <div className="-header">
                      <i className="fal fa-file-export" style={{ marginRight: '8px' }} /> Update files included from link
                    </div>
                    <div className="-body">
                      {fileIds.map((fileId, i) => (
                        <FileDeliveryListItem
                          key={`${fileId}_${i}`}
                          file={fileStore.byId[fileId]}
                          filePath={`/firm/${selectedFirm._id}/files/${fileId}`}
                          removeFile={this._handleRemoveFile}
                          allowRemove={!updateLink.includes(fileId)}
                        />
                      ))}
                      <button className="yt-btn small info link block" onClick={() => history.replace({
                          pathname: `/upload/share`,
                          state: location.state,
                        })}>
                        Upload more files to share
                      </button>
                    </div>
                  </div>
                  : null
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
                <i className="fal fa-file-export" style={{ marginRight: '8px' }} /> Files to include
              </div>
              <div className="-body">
                {fileIds.map((fileId, i) => (
                  <FileDeliveryListItem
                    key={`${fileId}_${i}`}
                    file={fileStore.byId[fileId]}
                    filePath={`/firm/${selectedFirm._id}/files/${fileId}`}
                    removeFile={this._handleRemoveFile}
                    allowRemove={!updateLink.includes(fileId)}
                  />
                ))}
                <button className="yt-btn small info link block" onClick={() => history.replace({
                    pathname: `/upload/share`,
                    state: location.state,
                  })}>
                  Upload more files to share
                </button>
              </div>
            </div>
            {
              updateLink.length ? null :
              <div className="-share-link-configuration">
                <div className="-header">
                  <i className="fas fa-eye" style={{ marginRight: '8px' }} /> Share link settings
                </div>
                <div className="-body">
                  <div className="-setting yt-row space-between">
                    <div className="-instructions yt-col full">
                      <p>
                        <strong>Who has access</strong>
                      </p>
                      <small>Control who can view the file with this link</small>
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
                      { authType === 'secret-question' ? (
                        <div>
                          <SelectFromObject
                            change={this._handleFormChange}
                            items={this.state.secretQuestions}
                            display="display"
                            displayStartCase={false}
                            name={"selectedQuestion"}
                            selected={this.state.selectedQuestion}
                            value="val"
                          />
                          {this.state.selectedQuestion === 'other' ?
                            <TextInput
                              change={this._handleFormChange}
                              name={`secretQuestions.${this.state.selectedQuestion}.prompt`}
                              placeholder="Custom secret question"
                              required
                              value={this.state.secretQuestions[this.state.selectedQuestion].prompt}
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
                      ) : null}
                      { authType === 'password' ? (
                        <TextInput
                          change={this._handleFormChange}
                          helpText="It's up to you to make sure they know this password"
                          name="password"
                          placeholder="Set Password"
                          required
                          value={password}
                        />
                      ) : null}
                      { authType === 'shared-contact-secret' ? (
                        <SelectFromObject
                          change={this._handleFormChange}
                          items={this.state.userSecretQuestionList}
                          display="display"
                          displayStartCase={false}
                          name={"userId"}
                          placeholder="Select a contact"
                          selected={this.state.userId}
                          value="val"
                        />
                      ) : null}
                      <div className="alert-message warning -left -small">
                        { authType === 'none' ? 
                          <p><small><strong>Note: </strong>Anyone with the link can access these files.</small></p> 
                          : 
                          authType === 'shared-client-secret' ? 
                          <p><small><strong>Note: </strong>Only those who know the answer to the client's security question can access this request.</small></p> 
                          :
                          authType === 'shared-contact-secret' ? 
                          <p><small><strong>Note: </strong>Only those who know the answer to this contact's security question can access this request.</small></p> 
                          :
                          <p><small><strong>Note: </strong>Only those who know the answer to the question can access these files.</small></p> 
                        }
                      </div>
                    </div>
                  </div>
                  {
                    clientId ? null : <hr/>
                  }
                  {
                    clientId ? null :
                    <div className="-setting yt-row space-between">
                      <div className="-instructions yt-col">
                        <p>Notify when viewed</p>
                      </div>
                      <div className="-inputs yt-col">
                        <ToggleSwitchInput
                          change={this._handleFormChange}
                          disabled={false}
                          inputClasses="-right"
                          name={'sN_viewed'}
                          required={false}
                          rounded={true}
                          value={sN_viewed}
                        />
                      </div>
                    </div>
                  }
                  {
                    clientId ? null : <hr/>
                  }
                  {
                    clientId ? null :
                    <div className="-setting yt-row space-between">
                      <div className="-instructions yt-col">
                        <p>Notify when downloaded</p>
                      </div>
                      <div className="-inputs yt-col">
                        <ToggleSwitchInput
                          change={this._handleFormChange}
                          disabled={false}
                          inputClasses="-right"
                          name={'sN_downloaded'}
                          required={false}
                          rounded={true}
                          value={sN_downloaded}
                        />
                      </div>
                    </div>
                  }
                  <hr />
                  {
                    selectedFirm.tcFileAccess ?
                    <div className="-setting yt-row space-between">
                      <div className="-instructions yt-col">
                        <p><strong>Show Terms and Conditions</strong></p>
                        <p>Terms and conditions will appear before accessing the files</p>
                      </div>
                      <div className="-inputs yt-col">
                        <ToggleSwitchInput
                          change={this._handleFormChange}
                          disabled={false}
                          inputClasses="-right"
                          name={'showTermsConditions'}
                          required={false}
                          rounded={true}
                          value={this.state.showTermsConditions}
                        />
                      </div>
                    </div> : null
                  }
                  {
                    selectedFirm.tcFileAccess ? <hr/> : null
                  }
                  <div className="-setting yt-row space-between">
                    <div className="-instructions yt-col">
                      <p><strong>Expiration</strong></p>
                      <p>Disable this link on a specific date</p>
                    </div>
                    <div className="-inputs yt-col ">
                      <ToggleSwitchInput
                        change={this._handleFormChange}
                        disabled={false}
                        inputClasses="-right"
                        name="expires"
                        required={false}
                        rounded
                        value={expires}
                      />
                      {expires ? (
                        <SingleDatePickerInput
                          anchorDirection="right" // This aligns the calendar drop down to the right side of the date-input. Default is to the left.
                          change={this._handleFormChange}
                          enableOutsideDays={false}
                          initialDate={expireDate} // epoch/unix time in milliseconds
                          inputClasses="-right"
                          minDate={DateTime.local().toMillis()}
                          name="expireDate"
                          numberOfMonths={1}
                          placeholder=""
                        />
                      ) : null}
                    </div>
                  </div>
                  <div className="alert-message general -left -small">
                    <p><small><strong>Note: </strong>You can manually disable this link anytime by visiting the link page while logged into your account. </small></p> 
                  </div>
                </div>
              </div>
            }
            <div className="yt-container">
              <div className="yt-row space-between">
                <button
                  type="button"
                  className="yt-btn info small link"
                  onClick={this._handleClose}
                >
                  done
                </button>
                <button
                  type="button"
                  className="yt-btn info small"
                  onClick={updateLink.length ? this._handleUpdateShareLink : this._handleCreateShareLink}
                  disabled={submitting || updateLink.length === fileIds.length}
                >
                  { updateLink.length ? "Update link" : "Create link" }
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    );
  }
}

OutlookShareFiles.propTypes = {
  dispatch: PropTypes.func.isRequired
  , selectedStaffId: PropTypes.number.isRequired
  , history: PropTypes.object.isRequired
};

const mapStoreToProps = (store, props) => {
  const { selectedStaffId } = props;
  const staffStore = store.staff;
  const firmStore = store.firm;
  const selectedStaff = staffStore.byId[selectedStaffId]
  const selectedFirm = selectedStaff && firmStore.byId[selectedStaff._firm];
  
  return {
    clientStore: store.client
    , clientUserStore: store.clientUser
    , fileStore: store.file
    , loggedInUser: store.user.loggedIn.user
    , selectedFirm
    , shareLinkStore: store.shareLink
    , userStore: store.user
  }
};

export default withRouter(connect(mapStoreToProps)(OutlookShareFiles));
