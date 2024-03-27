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
  SelectFromObject, SingleDatePickerInput, TextInput, ToggleSwitchInput,
} from '../../components/forms';

import * as clientActions from '../../../resources/client/clientActions';
import * as clientUserActions from '../../../resources/clientUser/clientUserActions';
import * as quickTaskActions from '../../../resources/quickTask/quickTaskActions';
import * as shareLinkActions from '../../../resources/shareLink/shareLinkActions';
import * as staffClientActions from '../../../resources/staffClient/staffClientActions';
import * as userActions from '../../../resources/user/userActions';
import * as staffActions from '../../../resources/staff/staffActions';
import * as firmActions from '../../../resources/firm/firmActions';
import * as fileActions from '../../../resources/file/fileActions';

import { displayUtils } from '../../utils';

class OutlookRequestFiles extends Binder {
  constructor(props) {
    super(props);

    this.state = {
      authType: 'none'
      , authTypes: [
        { display: 'Direct Link', val: 'none' }
        , { display: 'Question/Answer', val: 'secret-question' }
      ]
      , clientId: null
      , userId: null
      , errorMessage: null
      , expires: false
      , expireDate: DateTime.local().plus({ days: 30 }).toMillis()
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
        // , spouse: { display: "What is your spouse's name?", val: 'spouse', prompt: "What is your spouse's name?"}
        // , dog: { display: "What is your dog's name?", val: 'dog', prompt: "What is your dog's name?"}
        other: { display: 'Other', val: 'other', prompt: ''}
      }
      , shareLinkUrl: null
      , showCopyPaste: false
      , submitting: false
      , selectedStaff: ''
      , currentFirm: {}
      , _personal: null
      , folders: []
      , selectedFolder: {}
      , sN_upload: true
    };

    this._bind(
      '_checkAndSetEmailBody'
      , '_copyToClipboard'
      , '_handleClientChange'
      , '_handleClose'
      , '_handleCreateShareLink'
      , '_handleFormChange'
      , '_handleStaffChange'
      , '_handleFolderChange'
      , '_handleShowFolderTree'
    );
  }

  componentDidMount() {
    const { dispatch, selectedFirm, loggedInUser } = this.props;

    console.log('selectedFirm', selectedFirm);
    
    this.setState({currentFirm: selectedFirm});
    // fetch client info for this staff member 
    dispatch(clientActions.fetchListIfNeeded('_firm', selectedFirm._id));
    dispatch(staffActions.fetchListIfNeeded('_firm', selectedFirm._id));

    dispatch(userActions.fetchListIfNeeded('_firmStaff', selectedFirm._id));
    dispatch(userActions.fetchListIfNeeded('_firm', selectedFirm._id));

    dispatch(firmActions.fetchSingleIfNeeded(selectedFirm._id));
    dispatch(staffClientActions.fetchListIfNeeded('_firm', selectedFirm._id, '_user', loggedInUser._id, '~staff.status', 'active'));
    
    const defaultAuth = selectedFirm.authDefault == "QA" ? 'secret-question' : 'none';
    console.log("defaultAuth", defaultAuth);
    this.setState({authType: defaultAuth});

    if(selectedFirm.secretQuestions) {
      const cusSecretQuestions = typeof(selectedFirm.secretQuestions) === "string" ? JSON.parse(selectedFirm.secretQuestions) : selectedFirm.secretQuestions;

      if(Object.entries(cusSecretQuestions).length > 0) {
        //set secret questions
        const defaultSQ = this.state.secretQuestions;
        this.setState({secretQuestions: {...cusSecretQuestions, ...defaultSQ}});
      }
    }

    if(selectedFirm && selectedFirm._id) {
      dispatch(fileActions.fetchListIfNeeded('~firm', selectedFirm._id, 'category', "folder")).then(folderRes => {
        console.log("folderRes", folderRes);

        if(folderRes && folderRes.list && folderRes.list.length > 0) {
          this.setState({folders: folderRes.list});
        }
      });
    }
  }

  _handleClose() {
    const { dispatch, history, selectedFirm } = this.props;

    dispatch(shareLinkActions.invalidateSelected());

    const defaultAuth = selectedFirm.authDefault == "QA" ? 'secret-question' : 'none';
    console.log("defaultAuth", defaultAuth);
    this.setState({authType: defaultAuth});

    this.setState({
      authType: defaultAuth
      , authTypes: [
        { display: 'Direct Link', val: 'none' }
        , { display: 'Question/Answer', val: 'secret-question' }
      ]
      , clientId: null
      , userId: null
      , errorMessage: null
      , expires: false
      , expireDate: DateTime.local().plus({ days: 30 }).toMillis()
      , password: ''
      , prompt: ''
      , shareLinkUrl: null
      , showCopyPaste: false 
      , submitting: false
      , selectedQuestion: 'dssn'
      , selectedStaff: ''
      , _personal: null
      , sN_upload: true
    });

    // history.goBack();
    // for chrome store purposes history.replace("/actions");
    history.replace("/actions");
  }

  _copyToClipboard = e => {
    this.linkInput.select();
    document.execCommand('copy');
    this.setState({copySuccess: true});
  };

  _handleCreateShareLink() {
    const { clientStore, userStore, dispatch, selectedFirm, isIframeInitialized } = this.props;
    const {
      authType
      , clientId 
      , userId
      , expires
      , expireDate
      , password
      , prompt
      , _personal
      , selectedFolder
      , sN_upload
      , secretQuestions
      , selectedQuestion
    } = this.state;

    this.setState({
      submitting: true
    });

    const shareLinkPassword = (
      authType === 'shared-client-secret' ?
      clientStore.byId[clientId] ? clientStore.byId[clientId].sharedSecretAnswer : ""
      :
      authType === 'shared-contact-secret' ?
      userStore.byId[userId] ? userStore.byId[userId].sharedSecretAnswer : ""
      :
      password
    )

    const shareLinkPrompt = (
      authType === 'shared-client-secret' ?
      clientStore.byId[clientId] ? clientStore.byId[clientId].sharedSecretPrompt : ""
      :
      authType === 'shared-contact-secret' ?
      userStore.byId[userId] ? userStore.byId[userId].sharedSecretPrompt : ""
      :
      authType === 'secret-question' ?
      secretQuestions[selectedQuestion] ? secretQuestions[selectedQuestion].prompt : ""
      :
      prompt
    )

    let newShareLink = {
      _client: clientId
      , _firm: selectedFirm._id
      , authType
      , expireDate: expires ? new Date(expireDate) : null
      , password: shareLinkPassword
      , prompt: shareLinkPrompt
      , type: 'file-request'
      , sN_upload: sN_upload
    }

    if (_personal) {
      newShareLink._personal = _personal.replace("personal", "");
      newShareLink._client = null;
    }
    
    if(selectedFolder && selectedFolder._id) {
      newShareLink._folder = selectedFolder._id;
    }

    dispatch(
      shareLinkActions.sendCreateShareLink(newShareLink)
    ).then(response => {
      let shareLink = response.item
      if(response.success) {
        // create a quickTask here. Then update the shareLink with _quickTask
        const quickTask = {
          _client: clientId
          , _firm: selectedFirm._id
          , type: 'file'
          , selectedStaff: this.state.selectedStaff
        }
        dispatch(quickTaskActions.sendCreateQuickTask(quickTask)).then(taskRes => {
          if(taskRes.success) {
            // console.log('successfully created quickTask!', taskRes);
            // Now update the sharelink with the quickTask id.
            shareLink._quickTask = taskRes.item._id
            dispatch(shareLinkActions.sendUpdateShareLinkWithPermission(shareLink)).then(shareLinkRes => {
              this.setState({
                submitting: false
              });
              if(shareLinkRes.success) {
                // console.log('successfully updated shareLink!', shareLinkRes);

                if (isIframeInitialized) {
                  this.setState({
                    shareLinkUrl: shareLink.url 
                    , showCopyPaste: true
                  });
                } else {
                  this._checkAndSetEmailBody(shareLinkRes.item);
                }

                // // for testing locally 

              } else {
                this.setState({
                  errorMessage: 'Error code 510 - Unable to create share link. Please try again.',
                });
              }
            })
          } else {
            this.setState({
              errorMessage: 'Error code 509 - Unable to create share link. Please try again.'
              , submitting: false
            });
          }
        })
      } else if(response.success) {
        this.setState({
          submitting: false
        })
        // no quickTask required. 
        // console.log('successfully created shareLink!', response);

        if (isIframeInitialized) {
          this.setState({
            shareLinkUrl: shareLink.url
            , showCopyPaste: true
          })
        } else {
          this._checkAndSetEmailBody(shareLink);
        }

        // // for testing locally 
        // this.setState({
        //   shareLinkUrl: response.item.url 
        //   , showCopyPaste: true
        // })
      } else {
        this.setState({
          errorMessage: 'Error code 505 - Unable to create share link. Please try again.'
          , submitting: false
        });
      }
    });
  }

  _checkAndSetEmailBody(shareLink) {
    const { history } = this.props;
    Office.context.mailbox.item.body.getTypeAsync(result => {
      if(result.status == Office.AsyncResultStatus.Failed) {
        this.setState({
          errorMessage: 'Error code 506 - Something wrong with the outlook client. Please contact support for more information.',
        });
      } else {
        // check if outlook version can insert content 
        if (true) { // Office.context.requirements.isSetSupported("Mailbox", "1.2") || Office.context.requirements.isSetSupported("Mailbox", "1.1")) {
          /**
           * Insert the share link into the body of the email 
           */
        
          // check if allows HTML 
          if(result.value == Office.MailboxEnums.BodyType.Html) {
            // allows HTML.
            Office.context.mailbox.item.body.setSelectedDataAsync(
              `<a href='${shareLink.url}'>Click here</a> to upload files.`,
              { coercionType: Office.CoercionType.Html },
              (asyncResult) => {
                if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
                  this._handleClose()
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
              `Please click the following link to upload files:\n ${shareLink.url}\n`,
              
              { coercionType: Office.CoercionType.Text },
              (asyncResult) => {
                if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
                  this._handleClose()
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
    })
  }

  _handleFolderChange(e) {
    const val = e.target.value ? e.target.value.toString() : "";
    this.setState({selectedFolder: val});
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

  _handleStaffChange(e) {    
    const staffUserId = e.target.value;
    this.setState({ selectedStaff: staffUserId });
  }

  _handleClientChange(e) {
    const { clientStore, dispatch, userStore } = this.props
    // const clientId = e.target.value;
    const val = e.target.value ? e.target.value.toString() : "";
    const _personal = val.includes("personal") ? val : null;
    const clientId = val.includes("personal") ? null : val ? val : null;
    let newState = _.cloneDeep(this.state)
    // Reset authTypes to the basic ones. We'll add more as needed below.
    newState.authTypes = [
      { display: 'Direct Link', val: 'none' }
      , { display: 'Question/Answer', val: 'secret-question' }
    ]
    newState.clientId = clientId;
    newState._personal = _personal;
    newState.userId = null
    newState.selectedQuestion = ''
    newState.authType = 'none'
    newState.userSecretQuestionList = null
    newState.selectedFolder = {}
    const selectedClient = clientStore.byId[clientId]
    // Check for client's secret question. If it's there, add that option to authTypes in state.
    if(selectedClient) {
      if(selectedClient.sharedSecretPrompt) {
        // This client has a secret question. Add an option to authTypes
        newState.authTypes.push({ display: `${selectedClient.name} - Secret Question`, val: 'shared-client-secret' })
      }
      // Also need to check all clientUsers for this client. If any have a secret question
      // we'll have to add an option for that to the list
      dispatch(clientUserActions.fetchListIfNeeded('_client', clientId)).then(cuRes => {
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
            newState.authTypes.push({ display: 'Specific Contact\'s Secret Question', val: 'shared-contact-secret' })
          }
          newState.userSecretQuestionList = userSecretQuestionList
          this.setState(newState);
        }
      })
    } else {
      this.setState(newState);
    }
  }

  _handleShowFolderTree() {    
    const { selectedFirm } = this.props;

    const appUrl = !!window.location.host ? window.location.host : window.appUrl;
    const domain = appUrl.includes('localhost') ? 'localhost:9191' : appUrl;
    const tmpthis = this;
    let dialog = Office.dialog;

    console.log('selectedFirm', selectedFirm);

    const firmId = selectedFirm._id;
    const clientId = this.state.clientId ? this.state.clientId : null;

    const url = !!clientId ? `https://${domain}/outlook/#/select-folder/${firmId}/${clientId}`
    : `https://${domain}/outlook/#/select-folder/${firmId}/public/${!!this.state._personal ? this.state._personal.replace("personal", "") : 'general'}`

    function processMessage(arg) {
      const messageFromDialog = JSON.parse(arg.message);

      const { messageText, selectedFolder } = messageFromDialog;

      console.log('received message', messageFromDialog);

      if(messageText == "dialogClosed") {
        tmpthis.setState({
          selectedFolder
        }, () => dialog.close());
      }
    }

    Office.context.ui.displayDialogAsync(url, 
    { height: 85, width: 60, displayInIframe: true }, function(result) {

            
      console.log('domain', domain);
      console.log('dialog result', result);
      console.log(Office.AsyncResultStatus)


      if (result.status === Office.AsyncResultStatus.Failed) {
        console.log(result.error.code + ": " + result.error.message)
        // alert("Outlook client not supported");
      } else {
        dialog = result.value;
        // passing file to custom template

        dialog.addEventHandler(Office.EventType.DialogMessageReceived, processMessage);
      }

    });
  }

  render() {
    const {
      clientStore
      , quickTaskStore
      , shareLinkStore
      , workspaceList
      , isIframeInitialized
      , staffStore
      , userStore
      , selectedFirm
    } = this.props;

    const {
      authType
      , authTypes
      , clientId
      , errorMessage
      , expires
      , expireDate
      , password
      , prompt
      , shareLinkUrl
      , showCopyPaste
      , submitting
      , currentFirm
      , folders
      , selectedFolder
    } = this.state;

    // if(shareLinkStore.selected.isFetching || quickTaskStore.selected.isFetching) {
    //   return (<OutlookLoading />);
    // }
    if(shareLinkStore.selected.isFetching || quickTaskStore.selected.isFetching || staffStore.selected.isFetching || userStore.selected.isFetching) {
      return (<OutlookLoading />);
    }

    const staffListItems = staffStore.util.getList('_firm', currentFirm._id);
    const availableStaff = !staffListItems ? [] : staffListItems.filter(staff => {
      if (staff.status === 'active') {
        let item = staff;
        let fullName = userStore.byId[staff._user] ? `${userStore.byId[staff._user].firstname} ${userStore.byId[staff._user].lastname}` : '';
        let userName = userStore.byId[staff._user] ? userStore.byId[staff._user].username : '';
        item.displayName = `${fullName} | ${userName}`;
        item.email = userName;
        return item;
      }
    });

    let filterFolders = [];

    if(this.state.clientId) {
      filterFolders = folders.filter((folder) => {
        return folder._client == this.state.clientId
      })
    } else {
      if(this.state._personal) {
        filterFolders = folders.filter((folder) => {
          return !folder._client && folder._personal == this.props.selectedStaffId;
        });
      } else {
        filterFolders = folders.filter((folder) => {
          return !folder._client && !folder._personal;
        });
      }
    }

    return (
      <div>
        <h4>Request files</h4>
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
                <i className="fal fa-copy" style={{ marginRight: '8px' }} /> File request link created
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
                <i className="fas fa-eye" style={{ marginRight: '8px' }} /> Request link settings
              </div>
              <div className="-body">
                <div className="-setting yt-row space-between">
                  <div className="-instructions yt-col full">
                    <p>
                      <strong>Upload location</strong>
                    </p>
                    <small>Any files uploaded via this link can live in a specific workspace or the general files list</small>
                  </div>
                  { workspaceList && workspaceList.length > 0 ?
                    <div style={{
                      width: "100%"
                    }}>
                      <SelectFromObject
                        change={this._handleClientChange}
                        isClearable={true}
                        display="name"
                        displayStartCase={false}
                        filterable={true}
                        items={workspaceList}
                        name="clientId"
                        placeholder="Upload to general files"
                        selected={this.state.clientId || this.state._personal}
                        value="_id"
                      />
                      
                      {
                        !isIframeInitialized ? 
                        <div style={{
                            "color": "#4ebac5",
                            "cursor": "pointer",
                            "padding": "2px 8px",
                            "marginBottom": "16px"
                          }}
                          onClick={() => this._handleShowFolderTree()}
                        >
                          {
                            selectedFolder && selectedFolder._id ?
                            `Folder - ${selectedFolder.filename}`
                            :
                            'Select a folder'
                          }
                        </div>
                        :
                        null
                      }
                    </div>
                    :
                    <div className="alert-message general -left -small">
                      <p><small><strong>Note: </strong> You do not have any client workspaces available. Files will upload to General Files.</small></p>
                    </div>
                  }
                  {/* <div className="-instructions yt-col full">
                    <p>
                      <strong>File location</strong>
                    </p>
                  </div>
                  {
                    workspaceList && workspaceList.length > 0 ?
                    <SelectFromObject
                      change={this._handleFolderChange}
                      items={filterFolders}
                      disabled={false}
                      display='filename'
                      displayStartCase={false}
                      filterable={true}
                      isClearable={true}
                      name='folderId'
                      placeholder='Upload to root folder'
                      selected={this.state.selectedFolder}
                      value='_id'
                    />
                    :
                    ''
                  } */}
                  <div className="alert-message general -left -small">
                    { !this.state.clientId ? 
                      <p><small><strong>Note: </strong>Only you will be notified when someone uploads a file with this link.</small></p> 
                      : 
                      <p><small><strong>Note: </strong>You and all staff members assigned to this client will be notified when someone uploads a file with this link.</small></p> 
                    }
                  </div>
                </div>
                <hr/>
                <div className="-setting yt-row space-between">
                  <div className="-instructions yt-col full">
                    <p>
                      <strong>Who has access</strong>
                    </p>
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
                      :
                      null
                    }
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
                        <p><small><strong>Important Note: </strong>Anyone with the link can access this request.</small></p> 
                        :
                        authType === 'shared-client-secret' ? 
                        <p><small><strong>Important Note: </strong>Only those who know the answer to the client's security question can access this request.</small></p> 
                        :
                        authType === 'shared-contact-secret' ? 
                        <p><small><strong>Important Note: </strong>Only those who know the answer to this contact's security question can access this request.</small></p> 
                        :
                        <p><small><strong>Important Note: </strong>Only those who know the answer to the question can access this request.</small></p> 
                      }
                    </div>
                  </div>
                </div>
                {/* <hr/>
                <div className="-setting yt-row space-between">
                  <div className="-instructions yt-col full">
                    <p>
                      <strong>Choose who's staff will be notified</strong>
                    </p>
                  </div>
                  <div className="-inputs yt-col">
                    <SelectFromObject
                      change={this._handleStaffChange}
                      items={availableStaff}
                      display="displayName"
                      displayStartCase={false}
                      filterable={true}
                      isClearable={true}
                      name="staffId"
                      placeholder="Choose a staff member"
                      selected={this.state.selectedStaff }
                      value="_user"
                    />
                  </div>
                </div> */}
                <hr/>
                <div className="-setting yt-row space-between">
                  <div className="-instructions yt-col">
                    <p>Notify when uploaded</p>
                  </div>
                  <div className="-inputs yt-col">
                    <ToggleSwitchInput
                      change={this._handleFormChange}
                      disabled={false}
                      inputClasses="-right"
                      name={'sN_upload'}
                      required={false}
                      rounded={true}
                      value={this.state.sN_upload}
                    />
                  </div>
                </div>
                <hr />
                <div className="-setting yt-row space-between">
                  <div className="-instructions yt-col full">
                    <p>
                      <strong>Expiration</strong>
                    </p>
                    <small>Disable this link on a specific date</small>
                  </div>
                  <div className="-inputs yt-col">
                    <ToggleSwitchInput
                      change={this._handleFormChange}
                      disabled={false}
                      name="expires"
                      required={false}
                      rounded
                      value={expires}
                    />
                  </div>
                  <div className="-inputs yt-col">
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
                  <div className="alert-message general -left -small">
                    <p><small><strong>Note: </strong>You can manually disable this link anytime by visiting the link page while logged into your account. </small></p> 
                  </div>
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
                  onClick={this._handleCreateShareLink}
                  disabled={submitting}
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

OutlookRequestFiles.propTypes = {
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

  const clientList = store.client.lists && store.client.lists._firm && store.client.lists._firm[selectedStaff._firm] && !store.client.lists._firm[selectedStaff._firm].isFetching ? store.client.lists._firm[selectedStaff._firm].items : [];

  let workspaceList = [];
  if(isStaffOwner) {
    workspaceList = clientList.map(clientId => store.client.byId[clientId])
  } else {
    workspaceList = staffOnlyClientList.map(clientId => store.client.byId[clientId])
  }

  workspaceList = workspaceList.filter(client => client ? client.status === "visible" : null);
  workspaceList.sort((a, b) => {
    if(a.name.toLowerCase() < b.name.toLowerCase()) {
      return -1
    } else {
      return 1
    }
  });

  if (selectedFirm && workspaceList && loggedInUser) {
    workspaceList.unshift({
      _id: `personal${loggedInUser._id}`
      , name: "Your Staff Files"
      , _firm: selectedFirm._id
      , _staff: loggedInUser._id
    });
  }

  return {
    clientStore: store.client
    , loggedInUser
    , quickTaskStore: store.quickTask
    , selectedFirm
    , selectedStaff
    , shareLinkStore: store.shareLink
    , userStore: store.user
    , workspaceList
    , staffStore: store.staff
  }
};

export default withRouter(connect(mapStoreToProps)(OutlookRequestFiles));
