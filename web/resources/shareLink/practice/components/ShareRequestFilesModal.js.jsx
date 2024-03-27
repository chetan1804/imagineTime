/**
 * Modal component for creating and editing share links 
 *
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import { DateTime } from 'luxon';

// import actions
import * as shareLinkActions from '../../shareLinkActions';
import * as quickTaskActions from '../../../quickTask/quickTaskActions';
import * as userActions from '../../../user/userActions';
import * as clientActions from '../../../client/clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as fileActions from '../../../file/fileActions';

// import global components
import Binder from "../../../../global/components/Binder.js.jsx";
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import { 
  RadioInput
  , SelectFromObject
  , SingleDatePickerInput
  , TextAreaInput
  , TextInput 
  , ToggleSwitchInput
} from '../../../../global/components/forms';
import ISReactDraftEditor from '../../../../global/components/forms/ISReactDraftEditor.js.jsx';

// import other components
import RecipientInput from '../../../quickTask/practice/components/RecipientInput.js.jsx';
import FileLocation from '../../../file/components/FileLocation.js.jsx';

import { displayUtils, routeUtils, fileUtils } from '../../../../global/utils';
import sortUtils from '../../../../global/utils/sortUtils.js';

import user from '../../../user/userReducers';

class ShareRequestFilesModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      addInstructions: false
      , authType: 'none'
      , authTypes: [
        { display: 'Direct Link', val: 'none' }
        , { display: 'Question/Answer', val: 'secret-question' }
      ]
      , copySuccess: false
      , emailMessage: ''
      , expires: false
      , expireDate: DateTime.local().plus({days: 30}).toMillis()
      , instructions: '' // this will be saved on quickTask.prompt
      , password: ''
      , prompt: ''
      , selectedQuestion: 'dssn'
      , secretQuestions: {
      //   dssn: { display: 'What are the last 4 numbers of your Social Security Number?', val: 'dssn', prompt: 'What are the last 4 numbers of your Social Security Number?'}
      //   , dssn2: { display: 'What is your social security number, without the dashes?', val: 'dssn2', prompt: 'What is your social security number, without the dashes?'}
      //   , dssn3: { display: `What are the last four numbers of the client's Social Security Number?`, val: 'dssn3', prompt: `What are the last four numbers of the client's Social Security Number?`}
      //   , dphone: { display: 'What are the last 4 of your phone number?', val: 'dphone', prompt: 'What are the last 4 of your phone number?'}
      //   , dzip: { display: 'What is your zip code?', val: 'dzip', prompt: 'What is your zip code?'}
      //   , ftin: { display: 'What are the last four digits of your Federal Tax Identification Number?', val: 'ftin', prompt: 'What are the last four digits of your Federal Tax Identification Number?' }
      }
      , sendEmails: false
      , recipients: [] // an array of objects containing email addresses that will be notified when this shareLink is created.
      , submitting: false 
      , clientId: this.props.client ? this.props.client._id : null
      , userSecretQuestionList: null
      , receiveEmails: false
      , receivers: []
      , selectedStaff: ''
      , match: props.match
      , _personal: props.match.params.userId ? `personal${props.match.params.userId}` : null
      , sN_upload: true
      , selectedFolder: { 
        _client: props.match.params.clientId ? props.match.params.clientId : null
        , _personal: props.match.params.userId ? props.match.params.userId : "" 
        , _id: props.match.params.folderId ? props.match.params.folderId : ""
      }
    }
    this._bind(
      '_addRecipient'
      , '_copyToClipboard'
      , '_getRecipientList'
      , '_handleClientChange'
      , '_handleCreateShareLink'
      , '_handleClose'
      , '_handleFormChange'
      , '_removeRecipient'
      , '_getAllRecipientList'
      , '_handleStaffChange'
      , '_handleRTEChange'
      , '_handleLocationChange'
    )
  }

  componentDidMount() {
    const { client, dispatch, firm } = this.props;
    if(client) {
      const e = {
        target: {
          value: client._id
        }
      }
      this._handleClientChange(e);
    } else {
      // setTimeout(() => {
      //   this._getClientFolders("");
      // }, 500) 
    }
    if(firm) {
      const defaultAuth = firm.authDefault == "QA" ? 'secret-question' : 'none';
      console.log("defaultAuth", defaultAuth);
      this.setState({authType: defaultAuth});

      console.log("firm, firm", firm);

      if(firm.secretQuestions) {
        const cusSecretQuestions = typeof(firm.secretQuestions) === "string" ? JSON.parse(firm.secretQuestions) : firm.secretQuestions;
        console.log("cusSecretQuestions", typeof(firm.secretQuestions) === "string" , cusSecretQuestions)

        if(Object.entries(cusSecretQuestions).length > 0) {
          //set secret questions\
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

  componentDidUpdate(prevProps, prevState) {
    const { client } = this.props;
    if((!prevProps.client && client) || client && prevProps.client._id != client._id) {
      const e = {
        target: {
          value: client._id
        }
      }
      this._handleClientChange(e);
    }
  }

  _copyToClipboard = e => {
    this.linkInput.select();
    document.execCommand('copy');
    this.setState({copySuccess: true});
  };

  _handleClose() {
    const { firm, match } = this.props;
    const defaultAuth = firm.authDefault == "QA" ? 'secret-question' : 'none';

    this.props.dispatch(shareLinkActions.invalidateSelected());
    this.setState({
      addInstructions: false
      , authType: defaultAuth
      , authTypes: [
        { display: 'Direct Link', val: 'none' }
        , { display: 'Question/Answer', val: 'secret-question' }
      ]
      , copySuccess: false
      , clientId: this.props.client && this.props.client._id
      , userId: null
      , userSecretQuestionList: null
      , emailMessage: ''
      , expires: false 
      , expireDate: DateTime.local().plus({days: 30}).toMillis()
      , instructions: ''
      , password: ''
      , prompt: ''
      , sendEmails: false
      , recipients: []
      , submitting: false
      , receiveEmails: false
      , receivers: []
      , selectedQuestion: 'dssn'
      , selecteedStaff: ''
      , _personal: match.params.userId ? `personal${match.params.userId}` : null
      , sN_upload: true
      , selectedFolder: { 
        _client: match.params.clientId ? match.params.clientId : null
        , _personal: match.params.userId ? match.params.userId : "" 
        , _id: match.params.folderId ? match.params.folderId : ""
      }
    })
    this.props.close();
  }

  _handleCreateShareLink() {
    const {
      clientStore
      , clientUserStore
      , userStore
      , dispatch
      , firm
      , match
      , location
    } = this.props;
    const {
      authType
      , clientId
      , userId
      , expires
      , expireDate
      , password
      , prompt
      , _personal
      , sN_upload
      , emailMessage
      , secretQuestions
      , selectedQuestion
      , selectedFolder
    } = this.state;

    console.log("authType", authType);

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

    this.setState({submitting: true});
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
      secretQuestions[selectedQuestion].prompt
      :
      prompt
    )

    const newShareLink = {
      _client: clientId
      , _firm: firm._id
      , emailMessage: emailMessage
      // filter out any undefined entries that resulted from the user adding and removing recipients willy-nilly.
      , sentTo: this.state.recipients.filter(user => !!user)
      , authType
      , expireDate: expires ? new Date(expireDate) : null
      , password: shareLinkPassword
      , prompt: shareLinkPrompt
      , type: 'file-request'
      , sN_upload: sN_upload
    } 

    if (_personal) {
      newShareLink._personal = _personal.replace("personal", "");
    }
    //newShareLink._folder = match && match.params && match.params.fileId ? isNaN(match.params.fileId) ? "" : match.params.fileId : "";

    let mangoSubFolder = null;

    let rootFolder;

    if(selectedFolder && selectedFolder._id) {
      newShareLink._folder = selectedFolder._id;
    }

    newShareLink.ParentID = mangoSubFolder && mangoSubFolder.DMSParentID ? mangoSubFolder.DMSParentID : null;
    newShareLink.YellowParentID = mangoSubFolder && mangoSubFolder.DMSParentID ? mangoSubFolder.DMSParentID : null;

    dispatch(shareLinkActions.sendCreateShareLink(newShareLink)).then(slRes => {

      // If there is a _client, we'll need to create a quickTask here.
      let shareLink = slRes.item;
      if(slRes.success) {
        // save shareLink.emailResults to state. Otherwise when there is a
        // clientTask created, the updated shareLink will not have email results and they won't be displayed.
        this.setState({
          [shareLink._id + '_emailResults']: shareLink.emailResults
        });

        // create a quickTask here. Then update the shareLink with _quickTask
        const quickTask = {
          _client: clientId
          , _firm: firm._id
          , type: 'file'
          , prompt: this.state.instructions
          , selectedStaff: this.state.selectedStaff
        }
        if (this.state.receiveEmails) {
          quickTask["signingLinks"] = { 
            action: "request"
            , sentTo: this.state.receivers.filter(email => email)
          };
        }
        dispatch(quickTaskActions.sendCreateQuickTask(quickTask)).then(taskRes => {
        
          let newReceivers = _.cloneDeep(this.state.receivers);
          let receivers = [];
          if (newReceivers.length && taskRes.item.signingLinks) {
            if (taskRes.item.signingLinks.action === "request") {
              receivers = taskRes.item.signingLinks.sentTo;
            }
          }

          if(taskRes.success) {
            // Now update the sharelink with the quickTask id.
            shareLink._quickTask = taskRes.item._id
            dispatch(shareLinkActions.sendUpdateShareLinkWithPermission(shareLink)).then(shareLinkRes => {

              console.log('third ', shareLinkRes);

              this.setState({
                authType: 'none'
                , password: ''
                , prompt: ''
                , submitting: false 
                , receivers
                , selectedQuestion: 'dssn'
                , selectedStaff: ''
              })
              if(shareLinkRes.success) {
                // console.log('successfully updated shareLink!', shareLinkRes);
                
              } else {
                alert('There was a problem updating the shareLink.');
              }
            })
          } else {
            alert('There was a problem creating the quickTask.');
          }
        })
      } else {
        alert('There was a problem creating the shareLink.');
      }
    })
  }

  _handleLocationChange(folder) {
    this.setState({ selectedFolder: folder });
  }

  _handleFormChange(e, action) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let name;
    let value;
    
    if (e === "receiver") {
      name = action.target.name.replace("recipients", "receivers");
      value = action.target.value;
    } else {
      name = e.target.name;
      value = e.target.value;
    }

    let newState = _.update(_.cloneDeep(this.state), name, () => {
      return value;
    });
    if(name === 'sendEmails') {
      // user just turned sendEmails on. Initialize the array with one entry.
      if(value && this.state.recipients.length === 0) {
        newState.recipients = [{
          email: ''
        }]
        // user just turned sendEmails off. Clear the array.
      } else if(!value) {
        newState.recipients = [];
        newState.emailMessage = ''
      }
    } else if (name === "receiveEmails") {
      // user just turned sendEmails on. Initialize the array with one entry.
      if(value && this.state.receivers.length === 0) {
        newState.receivers = [{
          email: ''
        }]
        // user just turned sendEmails off. Clear the array.
      } else if(!value) {
        newState.receivers = [];
      }
    }
    
    this.setState(newState);
  }


  _getRecipientList() {
    const { client, userStore } = this.props;
    const { clientId } = this.state;
    // The clientId in state overrides the client in props since client can be changed
    // on this component.
    const userListItems = userStore.util.getList('_client', clientId || client._id)
    const recipientList = userListItems ? userListItems.map(user => {
      return {
        displayName: `${user.firstname} ${user.lastname}`
        , email: user.username
       }
    })
    :
    []
    return recipientList
  }

  _getAllRecipientList() {
    const { userStore } = this.props;

    const idLists = Object.keys(userStore.byId);
    const recipientList = idLists ? idLists.map(id => {
      const user = userStore.byId[id];
      return {
        displayName: `${user.firstname} ${user.lastname}`
        , email: user.username
      }
    }) : [];
    return recipientList;
  }

  _addRecipient(action) {
    if (action === "receiver") {
      let receivers = _.cloneDeep(this.state.receivers);
      const emailLists = {
        email: ''
      }
      receivers.push(emailLists); 
      this.setState({ receivers }); 
    } else {
      let recipients = _.cloneDeep(this.state.recipients);
      const emailLists = {
        email: ''
      }
      recipients.push(emailLists);
      this.setState({ recipients })
    }
  }

  _removeRecipient(index, action) {
    /**
     * NOTE: The user can add as many recipients to the recipients array as they want.
     * If they want to remove a recipient, we'll have to remove it from the array while
     * preserving the index of the remaining recipients. Normally we wouldn't have to preserve
     * the original index, but because we must preserve the type of recipient (existing or new)
     * changing the index on the array causes it to unmount, rerender, and lose its local state.
     * This is why we delete it rather than filter it out. This will leave undefined entries in the
     * array, but will preserve the index of all entries. We'll filter out the undefined entries right
     * before we create the shareLink (above, on the _handleCreateShareLink method).
     * 
     * There must be a way cleaner way to do this, but this works. -Wes
     */
    if (action && action === "receiver") {
      let newReceivers = _.cloneDeep(this.state.receivers);
      if (newReceivers && newReceivers.length > 1) {
        delete newReceivers[index]
        newReceivers = newReceivers.filter(item => _.has(item, 'email'));
        this.setState({ receivers: newReceivers });  
      }
    } else {
      let newRecipients = _.cloneDeep(this.state.recipients);
      if (newRecipients && newRecipients.length > 1) {
        delete newRecipients[index];
        newRecipients = newRecipients.filter(item => _.has(item, 'email'));
        this.setState({ recipients: newRecipients });  
      }
    }
  }

  _handleStaffChange(e) {
    
    const staffUserId = e.target.value;
    this.setState({ selectedStaff: staffUserId });
  }


  _handleClientChange(e) {

    console.log("ey", e.target)

    const { clientStore, dispatch, userStore, match, firm } = this.props
    let newState = _.cloneDeep(this.state)
    const val = e.target.value ? e.target.value.toString() : "";
    const _personal = val.includes("personal") ? val : null;
    const clientId = val.includes("personal") ? null : val ? val : null;
    //const clientId = e.target.value
    
    if (clientId) {
      // We need this client's users so we can build the recipients dropdown.
      dispatch(userActions.fetchListIfNeeded('_client', clientId))
      // Reset authTypes to the basic ones. We'll add more as needed below.
    }

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
    // Reset the recipients array. If emails are on, set one blank entry, otherwise clear the array.
    newState.recipients = this.state.sendEmails ? [{ email: '' }] : [];

    const selectedClient = clientStore.byId[clientId];

    if (e.target.name === 'clientId') {
      newState.selectedFolder = {
        _id: "rootfolder"
        , filename: "Root Folder"
      };
      if (val.includes("personal")) {
        newState.selectedFolder["_client"] = null;
        newState.selectedFolder["_personal"] = val.replace("personal", "");
        newState.selectedFolder["_id"] = "";
      } else if (val === "public") {
        newState.selectedFolder["_client"] = "";
        newState.selectedFolder["_personal"] = "";
        newState.selectedFolder["_id"] = "";
      } else {
        newState.selectedFolder["_client"] = val;
        newState.selectedFolder["_personal"] = "";
        newState.selectedFolder["_id"] = "";
      }
    }
    
    //this._getClientFolders(selectedClient);
    if(selectedClient) {

      // Check for client's secret question. If it's there, add that option to authTypes in state.
      if(selectedClient.sharedSecretPrompt) {
        newState.authTypes.push({ display: `${selectedClient.name} - Secret Question`, val: 'shared-client-secret' })
      }
      this.setState(newState);

      // Also need to check all clientUsers for this client. If any have a secret question
      // we'll have to add an option for that to the list

      dispatch(clientUserActions.fetchListIfNeeded('_client', clientId)).then(cuRes => {
        if(cuRes.success) {

          // let userIds = cuRes.list.map(cu =>)
          let { authTypes } = this.state;
          let userList = cuRes.list.map(cu => userStore.byId[cu._user]);
          let filteredUserList = userList && userList.filter(user => user && user.sharedSecretPrompt ? user : null); 
          
          let userSecretQuestionList = filteredUserList ? filteredUserList.map(user => {
            return {
              display: `${user.firstname} ${user.lastname} - shared secret question`
              , val: user._id
            }
          })
          : []; 

          if(userSecretQuestionList && userSecretQuestionList.length > 0) {
            authTypes.push({ display: 'Specific Contact\'s Secret Question', val: 'shared-contact-secret'});
          }

          this.setState({ authTypes, userSecretQuestionList });
        }
      })
    } else {
      this.setState(newState);
    }
  }

  _handleRTEChange(value) {
    console.log('tcContents', value);
    this.setState({instructions: value});
  }

  render() {
    const { 
      client
      , clientStore
      , firm
      , isOpen
      , shareLinkStore 
      , workspaceList
      , userStore
      , staffStore
      , match
      , fileFolderLocation = []
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
      , submitting
      , selectedFolder
      , _personal
    } = this.state;

    // If we have a client in props, this.state.clientId will be set when this component mounts
    // We'll pull from the map so everything still works if the user chooses a new client.


    const selectedClient = clientId ? clientStore.byId[clientId] : null
    const selectedShareLink = shareLinkStore.selected.getItem();

    let recipientListItems = selectedClient ? this._getRecipientList() : this._getAllRecipientList();
    recipientListItems = sortUtils._object(recipientListItems, "displayName"); 

    const linkEmpty = (
      !selectedShareLink
      || !selectedShareLink._id
      || shareLinkStore.selected.didInvalidate
    );

    const linkFetching = (
      shareLinkStore.selected.isFetching
    )

    const linkClass = classNames(
      "-copyable-share-link" 
      , { '-visible': this.state.copySuccess }
    )

    const promptClass = classNames(
      "-prompt" 
      , { '-hidden': this.state.copySuccess }
    )

    const staffListItems = staffStore.util.getList('_firm', match.params.firmId);
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
    
    return (
      <Modal
        cardSize="large"
        closeAction={this._handleClose}
        closeText="Cancel"
        confirmAction={this._handleCreateShareLink}
        confirmText={submitting ? "Creating..." : "Create request files link" }
        disableConfirm={submitting}
        isOpen={isOpen}
        modalHeader={selectedClient ? `Request files from ${selectedClient.name}`: 'Request files'}
        showButtons={linkEmpty}
      > 
        { linkEmpty ?
          (linkFetching ?
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            :
            <div>
              <div className="-share-link-configuration">
                <div className="-header">
                  <i className="fas fa-eye"/> Link settings 
                </div>
                <div className="-body">
                  <div className="-setting yt-row space-between">
                    <div className="-instructions yt-col">
                      <p><strong>Workspace</strong></p>
                      <p>Select workspace to request from</p>
                    </div>
                    { workspaceList ? 
                      <div className="-inputs yt-col">
                        <SelectFromObject
                          change={this._handleClientChange}
                          items={workspaceList}
                          disabled={!!this.props.client}
                          display="name"
                          displayStartCase={false}
                          filterable={true}
                          isClearable={true}
                          name="clientId"
                          placeholder="Upload to general files"
                          selected={clientId || _personal}
                          //selected={this.state.clientId}
                          value="_id"
                        />
                        <div>
                          <FileLocation 
                            selectedClient={selectedClient}
                            handleLocationChange={this._handleLocationChange}
                            listArgs={this.props.listArgs}
                            allowCreateFolder={true} // (firm.allowCreateFolder && viewingAs === "portal") || (viewingAs !== "portal")}
                            handleSetInvalidList={this.props.handleSetInvalidList}
                            selectedFolder={selectedFolder}
                            personalId={_personal ? _personal.replace("personal", "") : null}
                            getDetail={{ type: clientId && "workspace" || _personal && "personal" || "general", id: clientId || _personal, firmId: match.params.firmId }}
                          />
                        </div>
                      </div>
                      :
                      <p><small><strong>Note: </strong> You do not have any client workspaces available. Files will upload to General Files.</small></p>
                    }
                  </div>
                  <hr/>
                  <div className="-setting yt-row space-between">
                    <div className="-instructions yt-col">
                      <p><strong>Who has access</strong></p>
                      <p>Control who can view this request link</p>
                    </div>
                    <div className="-inputs yt-col">
                      <SelectFromObject
                        change={this._handleFormChange}
                        items={authTypes}
                        display="display"
                        displayStartCase={false}
                        name="authType"
                        selected={authType}
                        value="val"
                      />
                      { (authType === 'secret-question') ?
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
                              required={true}
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
                            required={true}
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
                          required={true}
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
                  <hr/>
                  <div className="-setting yt-row space-between">
                    <div className="-instructions yt-col">
                      <p><strong>Expiration</strong></p>
                      <p>Disable this link on a specific date</p>
                    </div>
                    <div className="-inputs yt-col">
                      <ToggleSwitchInput
                        change={this._handleFormChange}
                        disabled={false}
                        inputClasses="-right"
                        name={'expires'}
                        required={false}
                        rounded={true}
                        value={this.state.expires}
                      />
                      { this.state.expires ? 
                        <SingleDatePickerInput
                          anchorDirection="right" // This aligns the calendar drop down to the right side of the date-input. Default is to the left.
                          change={this._handleFormChange}
                          enableOutsideDays={false}
                          initialDate={this.state.expireDate} // epoch/unix time in milliseconds
                          inputClasses="-right"
                          minDate={DateTime.local().toMillis()}
                          name='expireDate'
                          numberOfMonths={1}
                          placeholder={""}
                        />
                        :
                        null 
                      }
                    </div>
                  </div>
                  <hr/>
                  <div className="-setting yt-row space-between">
                    <div className="-instructions yt-col">
                      <p><strong>Add instructions</strong></p>
                      <p>Let the client know what you are requesting</p>
                    </div>
                    <div className="-inputs yt-col">
                      <ToggleSwitchInput
                        change={this._handleFormChange}
                        disabled={false}
                        inputClasses="-right"
                        name={'addInstructions'}
                        required={false}
                        rounded={true}
                        value={this.state.addInstructions}
                      />
                    </div>
                    { this.state.addInstructions ?
                      // <TextAreaInput
                      //   change={this._handleFormChange}
                      //   name="instructions"
                      //   placeholder="Please upload your W-2 for 2019"
                      //   value={this.state.instructions}
                      //   rows="2"
                      // />
                      <div className="input-group">
                        <ISReactDraftEditor
                          onChange={this._handleRTEChange}
                          defaultValue={this.state.instructions}
                          title={null}
                          placeholder="Please upload your W-2 for 2019"
                        />
                      </div>
                      :
                      null
                    }
                  </div>
                  <hr/>
                    <div className="-setting yt-row space-between">
                      <div className="-instructions yt-col">
                        <p><strong>Send emails</strong></p>
                        <p>Auto send emails when you create this link</p>
                      </div>
                      <div className="-inputs yt-col">
                        <ToggleSwitchInput
                          change={this._handleFormChange}
                          disabled={false}
                          inputClasses="-right"
                          name={'sendEmails'}
                          required={false}
                          rounded={true}
                          value={this.state.sendEmails}
                        />
                      </div>
                    </div>
                    { this.state.sendEmails ?
                      <div className="yt-row space-between -share-and-request-recepient">
                        <div className="yt-col" style={{paddingLeft: '5px'}}>
                          <button className="yt-btn xx-small u-pullRight" onClick={this._addRecipient}><i className="fal fa-plus"/> Add recipient</button>
                          { this.state.recipients.map((recipient, i) => {
                            return (
                              recipient ?
                              <RecipientInput
                                change={this._handleFormChange}
                                handleRecipientChange={this._handleRecipientChange}
                                currentIndex={i}
                                key={'recipient_' + i}
                                recipientListItems={recipientListItems}
                                recipient={recipient}
                                removeRecipient={() => this._removeRecipient(i)}
                                filterable={true}
                                hiddenBtn={false}
                              />
                              :
                              null
                            )
                          })}
                        </div>
                        <div className="yt-row">
                          <TextAreaInput
                            change={this._handleFormChange}
                            name="emailMessage"
                            placeholder="Email message"
                            value={this.state.emailMessage}
                          />
                        </div>
                      </div>
                      :
                      null 
                    }
                    <hr/>
                    <div className="-setting yt-row space-between">
                      <div className="-instructions yt-col">
                        <p><strong>Receive emails</strong></p>
                        <p>Auto receive emails when contact uploaded a file</p>
                      </div>
                      <div className="-inputs yt-col">
                        <ToggleSwitchInput
                          change={this._handleFormChange}
                          disabled={false}
                          inputClasses="-right"
                          name={'receiveEmails'}
                          required={false}
                          rounded={true}
                          value={this.state.receiveEmails}
                        />
                      </div>
                    </div>
                    { this.state.receiveEmails ?
                      <div className="yt-row space-between -share-and-request-recepient">
                        <div className="yt-col" style={{paddingLeft: '5px'}}>
                          <button className="yt-btn xx-small u-pullRight" onClick={this._addRecipient.bind(this, "receiver")}><i className="fal fa-plus"/> Add recipient</button>
                          { this.state.receivers.map((receiver, i) => {
                            return (
                              receiver ?
                              <RecipientInput
                                change={this._handleFormChange.bind(this, "receiver")}
                                handleRecipientChange={this._handleRecipientChange}
                                currentIndex={i}
                                key={'receiver_' + i}
                                recipientListItems={availableStaff}
                                recipient={receiver}
                                removeRecipient={() => this._removeRecipient(i, "receiver")}
                                filterable={true}
                                hiddenBtn={false}
                              />
                              :
                              null
                            )
                          })}
                        </div>
                      </div>
                      :
                      null 
                    }
                </div>
              </div>
            </div>
            )
            :
            <div>
              <h4>Request files link created</h4>
              <div className="yt-row -share-link-row center-vert">
                <div className="-icon">
                  <i className="fas fa-eye fa-lg"/>
                </div>
                <div className="-description">
                  <div className={promptClass}>
                    <p>
                      <strong>Can view</strong><br/>
                    </p>
                    <p>
                    {displayUtils.getShareLinkViewParams(selectedShareLink.authType)}
                    </p>
                  </div>
                  <div className={linkClass}>
                    <input ref={(input) => this.linkInput = input} value={selectedShareLink.url} readOnly={true}/> 
                  </div>
                </div>
                <div className="-copy-action">
                  { this.state.copySuccess ?
                    <button type="button" className="yt-btn x-small link info" onClick={() => this.setState({copySuccess: false})}>Hide link</button>
                    :
                    <button type="button" className="yt-btn x-small link info" onClick={this._copyToClipboard}>Copy link</button>
                  }
                </div>
              </div>
              { selectedShareLink.sentTo && selectedShareLink.sentTo.length > 0 ?
                selectedShareLink.sentTo[0].email ? 
                <div>
                  <h4>Users notified</h4>
                  { // selectedShareLink.emailResults is populated on the server during creation.
                    // We set it in state once the shareLink is created, otherwise it is lost when the shareLink is updated.
                    this.state[selectedShareLink._id + '_emailResults'] ?
                    this.state[selectedShareLink._id + '_emailResults'].map((result, i) =>
                      <div key={'email_result_' + i}className="yt-row -share-link-row center-vert">
                        <div className="yt-col"><small>{`${result.email}`}</small></div>
                      </div>
                    )
                    :
                    <div className="loading -small"></div>
                  }
                </div> : null
                :
                null
              }
              { this.state.receiveEmails && this.state.receivers && this.state.receivers[0].email ?
                <div>
                  <h4>Users notified when contacts uploaded a file</h4>
                  { // selectedShareLink.emailResults is populated on the server during creation.
                    // We set it in state once the shareLink is created, otherwise it is lost when the shareLink is updated.
                    this.state.receivers.map((result, i) =>
                      <div key={'email_result_' + i}className="yt-row -share-link-row center-vert">
                        <div className="yt-col"><small>{`${result.email}`}</small></div>
                      </div>
                    )
                  }
                </div>
                :
                null
              }
            </div>
          }
      </Modal>
    )
  }
}

ShareRequestFilesModal.propTypes = {
  client: PropTypes.object
  , close: PropTypes.func.isRequired 
  , firm: PropTypes.object.isRequired 
  , isOpen: PropTypes.bool.isRequired
}

ShareRequestFilesModal.defaultProps = {
  client: null 
}

const mapStoreToProps = (store, props) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  const { firm, clientListItem } = props;
  const loggedInUser = store.user.loggedIn.user;
  let workspaceList = clientListItem;
  if (workspaceList) {
    workspaceList = workspaceList.sort((a, b) => {
      if(a.name.toLowerCase() < b.name.toLowerCase()) {
        return -1
      } else {
        return 1
      }
    });
  }

  if (workspaceList && loggedInUser) {
    workspaceList.unshift({
      _id: `personal${loggedInUser._id}`
      , name: "Your Staff Files"
      , _firm: firm._id
      , _staff: loggedInUser._id
    });
  }

  const userId = props.match.params.userId;
  if (workspaceList && loggedInUser && loggedInUser._id && store.user && store.user.byId && userId && userId != loggedInUser._id && store.user.byId[userId]) {
    workspaceList.unshift({
      _id: `personal${userId}`
      , name: `Personal Files for ${store.user.byId[userId].firstname} ${store.user.byId[userId].lastname}`
      , _firm: firm._id
      , _staff: userId
    });
  }

  return {
    // defaultFile: store.file.defaultItem
    clientStore: store.client
    , clientUserStore: store.clientUser
    , shareLinkStore: store.shareLink
    , userStore: store.user
    , staffStore: store.staff
    , workspaceList
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ShareRequestFilesModal)
);
