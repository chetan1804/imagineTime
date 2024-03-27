/**
 * Modal component for creating and editing share links 
 *
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';
const async = require('async');

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import { DateTime } from 'luxon';

// import actions
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as shareLinkActions from '../../shareLinkActions';
import * as fileActions from '../../../file/fileActions';

// import global components
import Binder from "../../../../global/components/Binder.js.jsx";
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import { 
  RadioInput
  , SelectFromObject
  , SingleDatePickerInput
  , TextInput 
  , ToggleSwitchInput
  , TextAreaInput 
} from '../../../../global/components/forms';

// import resource components 
import FileDeliveryListItem from '../../../file/components/FileDeliveryListItem.js.jsx';
import { displayUtils, fileUtils } from '../../../../global/utils';
import sortUtils from '../../../../global/utils/sortUtils.js';
import RoleModalComponent from '../../../../global/enum/RoleModalComponent.js.jsx';

// import other components
import RecipientInput from '../../../quickTask/practice/components/RecipientInput.js.jsx';

class ShareMultipleFilesModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      authType: 'none'
      , authTypes: [
        { display: 'Direct Link', val: 'none' }
        , { display: 'Question/Answer', val: 'secret-question' }
      ]
      , copySuccess: false
      , expires: false 
      , expireDate: DateTime.local().plus({days: 30}).toMillis() 
      , fileIds: this.props.selectedFileIds || []
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
      , submitting: false 
      , recipients: [] // an array of objects containing email addresses that will be notified when this shareLink is created.
      , sendEmails: false
      , emailMessage: ''
      , clientId: this.props.client ? this.props.client._id : null
      , shareFileWarning: false
      , isUploadFilesSubmit: false
      , attachFilesModalSubmit: false
      , updateLink: []
      , shareLink: {}
      , sN_downloaded: true
      , sN_viewed: true
      , showTermsConditions: false
      , roleModal: null
    }
    this._bind(
      '_copyToClipboard'
      , '_handleAttachFiles'
      , '_handleClose'
      , '_handleCreateShareLink'
      , '_handleFormChange'
      , '_handleRemoveFile'
      , '_removeRecipient'
      , '_getRecipientList'
      , '_addRecipient'
      , '_getAllRecipientList'
      , '_handleUploadedFiles'
      , '_handleUpdateShareLink'
    )
  }

  componentDidMount() {
    const { client, dispatch, userStore, socket, firm, handleUpdateSelectedFile, match, handleSetInvalidList } = this.props;
    
    socket.on('created_folder_finished', (folders) => {
      const fileIds = _.cloneDeep(this.state.fileIds);
      folders.forEach(item => fileIds.push(item._id));
      this.setState({ fileIds });
    });

    socket.on('upload_finished', (files) => {
      const roleModal = this.state.roleModal === "file_upload";
      console.log("share upload_finished", roleModal, files);
      if (files && roleModal) {
        let fileIds = _.cloneDeep(this.state.fileIds);
        async.map(files, (file, cb) => {
          dispatch(fileActions.addSingleFileToMap(file));
          if (!file._folder || (file._folder && (!fileIds.includes(Number(file._folder)) && file._folder == match.params.folderId))) {
            fileIds.push(file._id);
          }
          cb(null, file._id);
        }, (err, result) => {
          if (!err) {
            dispatch(fileActions.addFilesToList(result, ...this.props.listArgs));
            this.setState({ fileIds, roleModal: null, isUploadFilesSubmit: false }, () => {
              if (handleUpdateSelectedFile) {
                handleUpdateSelectedFile(fileIds);
                if (handleSetInvalidList) {
                  handleSetInvalidList();
                }
              }
            });
          }
        });
      }
    });

    // Used to display an overall file upload error.
    socket.on('upload_finished_error', (error) => {
      console.log("UPLOAD FINISHED ERROR!!!", error);
      alert("There was a problem uploading your files. " + error)
    });

    if(firm) {
      const defaultAuth = firm.authDefault == "QA" ? 'secret-question' : 'none';
      console.log("defaultAuth", defaultAuth);
      this.setState({authType: defaultAuth});

      if(firm.secretQuestions) {
        const cusSecretQuestions = typeof(firm.secretQuestions) === "string" ? JSON.parse(firm.secretQuestions) : firm.secretQuestions;

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

    if(client) {
      let authTypes = [
        { display: 'Direct Link', val: 'none' }
        , { display: 'Question/Answer', val: 'secret-question' }
      ]
      // If there is a client and that client has a secret question add that option to the list.
      if(client.sharedSecretPrompt) {
        authTypes.push({ display: `${client.name} - Secret Question`, val: 'shared-client-secret' })
      }
      dispatch(clientUserActions.fetchListIfNeeded('_client', client._id)).then(cuRes => {
        if(cuRes.success) {
          // let userIds = cuRes.list.map(cu =>)
          let userList = cuRes.list.map(cu => userStore.byId[cu._user]);
          let filteredUserList = userList && userList.filter(user => user.sharedSecretPrompt ? user : null); 
          
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
          this.setState({
            authTypes
            , userSecretQuestionList
          })

          // let clientUserList = cuRes.list.filter(cu => !!cu.sharedSecretPrompt) // filter out clientUsers that don't have a secret question.
          // // Generate the list of clientUsers that have a secret question so we can populate the dropdown.
          // let clientUserSecretQuestionList = clientUserList ? clientUserList.map(cu => {
          //   const user = userStore.byId[cu._user]
          //   return {
          //     display: `${user.firstname} ${user.lastname} - shared secret question`
          //     , val: cu._id
          //    }
          // })
          // :
          // []
          // // Add an option to the authTypes list for client user secret questions
          // if(clientUserSecretQuestionList && clientUserSecretQuestionList.length > 0) {
          //   authTypes.push({ display: 'Specific Contact\'s Secret Question', val: 'shared-contact-secret' })
          // }
          // this.setState({
          //   authTypes
          //   , clientUserSecretQuestionList
          // })
        } else {
          alert("There was a problem fetching client information. Please try again.")
        }
      })
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.props.selectedFileIds.length !== prevProps.selectedFileIds.length) {
      this.setState({
        fileIds: this.props.selectedFileIds
        , roleModal: this.props.selectedFileIds.length < 1 ? "file_attach" : null
      })
    }
  }

  _copyToClipboard = e => {
    this.linkInput.select();
    document.execCommand('copy');
    this.setState({copySuccess: true});
  };

  _handleAttachFiles(fileIds) {
    const { handleUpdateSelectedFile } = this.props;
    let newFileIds = _.cloneDeep(this.state.fileIds);
    // console.log(newFileIds);
    newFileIds = newFileIds.concat(fileIds);
    newFileIds = _.uniq(newFileIds); // dedupe the list 
    // console.log(newFileIds);

    this.setState({fileIds: newFileIds}, () => {
      if (handleUpdateSelectedFile) {
        handleUpdateSelectedFile(newFileIds);
      }
      if (this.state.attachFilesModalSubmit) {
        this._handleCreateShareLink();
      }
    });
  }

  _handleUploadedFiles() {
    console.log("upload")
  }

  _handleCreateShareLink() {
    const {
      client
      , clientStore
      , clientUserStore
      , userStore
      , dispatch
      , firm
      , allFilesFromListArgs
    } = this.props;
    const {
      authType
      , userId
      , expires
      , expireDate
      , password
      , prompt
      , sN_downloaded
      , sN_viewed
      , selectedQuestion
      , secretQuestions
      , showTermsConditions
    } = this.state;
    if(authType == "secret-question") {
      console.log("this.state", this.state);

      const shareLinkSelectedQuestion = selectedQuestion
      const shareLinkPassword = password;

      if(!shareLinkSelectedQuestion || !shareLinkPassword) {
        console.log("shareLinkPrompt", shareLinkPrompt);
        console.log("shareLinkPassword", shareLinkPassword);
        alert('There was a problem creating the shareLink.');
        return;
      }
    }

    let fileIds = _.cloneDeep(this.state.fileIds);
    // console.log("fileIds", fileIds)
    this.setState({submitting: true});

    const shareLinkPassword = (
      authType === 'shared-client-secret' ?
      clientStore.byId[client._id] ? clientStore.byId[client._id].sharedSecretAnswer : ""
      :
      authType === 'shared-contact-secret' ?
      userStore.byId[userId] ? userStore.byId[userId].sharedSecretAnswer : ""
      :
      password
    )

    const shareLinkPrompt = (
      authType === 'shared-client-secret' ?
      clientStore.byId[client._id] ? clientStore.byId[client._id].sharedSecretPrompt : ""
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
      _client: client ? client._id : null 
      , _firm: firm._id 
      , _files: fileIds 
      , emailMessage: this.state.emailMessage
      , sentTo: this.state.recipients.filter(user => !!user)
      , authType: authType 
      , expireDate: expires ? new Date(expireDate) : null 
      , password: shareLinkPassword
      , prompt: shareLinkPrompt
      , type: 'share'
      , showTermsConditions: showTermsConditions
    } 
    
    if (!newShareLink._client) {
      newShareLink.sN_viewed = sN_viewed;
      newShareLink.sN_downloaded = sN_downloaded;
    }
    
    dispatch(shareLinkActions.sendCreateShareLink(newShareLink)).then(slRes => {
      if(slRes.success) {
        this.setState({
          authType: 'none'
          , password: ''
          , prompt: ''
          // , fileIds: []
          , submitting: false 
          , [slRes.item._id + '_emailResults']: slRes.item.emailResults
          , roleModal: null
          , isUploadFilesSubmit: false
          , attachFilesModalSubmit: false
          , selectedQuestion: 'dssn'
          , updateLink: this.state.fileIds
          , shareLink: slRes.item
        })
      } else {
        alert('something went wrong');
      }
    })
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    if(e.target.name === 'sendEmails') {
      // user just turned sendEmails on. Initialize the array with one entry.
      if(e.target.value && this.state.recipients.length === 0) {
        newState.recipients = [{
          email: ''
        }]
        // user just turned sendEmails off. Clear the array.
      } else if(!e.target.value) {
        newState.recipients = [];
        newState.emailMessage = ''
      }
    }
    this.setState(newState);
  }

  _handleClose() {
    console.log('_handleClose')
    const { firm } = this.props;
    const defaultAuth = firm.authDefault == "QA" ? 'secret-question' : 'none';
    this.props.dispatch(shareLinkActions.invalidateSelected());
    this.setState({
      authType: defaultAuth
      , authTypes: [
        { display: 'Direct Link', val: 'none' }
        , { display: 'Question/Answer', val: 'secret-question' }
      ]
      , clientId: null
      , userId: null
      // , clientUserSecretQuestionList: null
      , userSecretQuestionList: null
      , copySuccess: false
      , expires: false 
      , expireDate: DateTime.local().plus({days: 30}).toMillis() 
      , password: ''
      , prompt: ''
      , fileIds: this.props.selectedFileIds || []
      , submitting: false 
      , selectedQuestion: 'dssn'
      , updateLink: []
      , sN_viewed: true
      , sN_downloaded: true
      , roleModal: null
    });
    this.props.close();
  }

  _handleRemoveFile(fileId) {
    let newFiles = this.state.fileIds;
    console.log(newFiles);
    const index = newFiles.indexOf(fileId);
    newFiles.splice(index, 1);
    this.setState({fileIds: newFiles});
  }

  _getRecipientList() {
    const { client, userStore } = this.props;
    const { clientId } = this.state;
    // The clientId in state overrides the client in props since client can be changed
    // on this component.
    const userListItems = userStore.util.getList('_client', clientId || client._id);
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

  _removeRecipient(index) {
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
    let newRecipients = _.cloneDeep(this.state.recipients);
    if (newRecipients && newRecipients.length > 1) {
      delete newRecipients[index];
      newRecipients = newRecipients.filter(item => _.has(item, 'email'));
      this.setState({
        recipients: newRecipients
      });  
    }
  }

  _addRecipient() {
    let recipients = _.cloneDeep(this.state.recipients);
    const recipient = {
      email: ''
    }
    recipients.push(recipient);
    this.setState({ recipients })
  }

  _handleUpdateShareLink() {
    const { dispatch, allFilesFromListArgs } = this.props;
    const { updateLink, shareLink, fileIds } = this.state;
    if (updateLink && updateLink.length && shareLink && shareLink._id) {
      const newShareLink = _.cloneDeep(shareLink);
      newShareLink._files = _.cloneDeep(fileIds);;
      this.setState({ submitting: true });
      dispatch(shareLinkActions.sendUpdateShareFilesLink(newShareLink)).then(json => {
        if(json.success) {
          this.setState({
            authType: 'none'
            , password: ''
            , prompt: ''
            // , fileIds: []
            , submitting: false 
            , [json.item._id + '_emailResults']: json.item.emailResults
            , roleModal: null
            , isUploadFilesSubmit: false
            , attachFilesModalSubmit: false
            , selectedQuestion: 'dssn'
            , updateLink: json.item._files
            , shareLink: json.item
          })
        } else {
          alert('something went wrong');
        }
      })
    }
  }

  render() {
    const {
      allowMultiple
      , client
      , close 
      , fileStore 
      , firm
      , isOpen
      , match
      , shareLinkStore 
      , clientStore
      , selectedFileIds
      , listArgs
      , folderListItems
    } = this.props; 

    const { 
      authTypes
      , fileIds
      , submitting 
      , recipients
      , clientId
      , updateLink
      , roleModal
    } = this.state;

    // If we have a client in props, this.state.clientId will be set when this component mounts
    // We'll pull from the map so everything still works if the user chooses a new client.
    const selectedClient = clientId ? clientStore.byId[clientId] : null
    const selectedShareLink = shareLinkStore.selected.getItem();
    let recipientListItems = selectedClient ? this._getRecipientList() : this._getAllRecipientList(); // selectedClient ? this._getRecipientList() : [];
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
    );

    const ModalComponent = RoleModalComponent[roleModal];

    return (
      <div>
        <Modal
          cardSize="large"
          closeAction={this._handleClose}
          closeText={(updateLink.length >= fileIds.length && fileIds.length) ? "Done" : "Cancel"}
          confirmAction={updateLink.length ? this._handleUpdateShareLink : this._handleCreateShareLink}
          confirmText={updateLink.length ? submitting ? "Updating..." : "Update share link" : submitting ? "Creating..." : "Create share link" }
          disableConfirm={(updateLink.length >= fileIds.length) || !fileIds || fileIds.length === 0 || submitting}
          isOpen={isOpen}
          modalHeader={client ? `Share files associated with ${client.name}`: 'Share files'}
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
                  <i className="fal fa-file-export"/> Files to include
                </div>
                <div className="-body">
                  {fileIds.map((fileId, i) => 
                    <FileDeliveryListItem
                      key={fileId + '_' + i}
                      file={fileStore.byId[fileId]}
                      filePath={client ? `/firm/${firm._id}/workspaces/${client._d}/files/${fileId}` :  `/firm/${firm._id}/files/${fileId}`}
                      removeFile={this._handleRemoveFile}
                      allowRemove={allowMultiple} // When this modal is opened from PracticeSingleFile view it doesn't make sense to let them delete the single file from the list.
                    />
                  )}
                  { allowMultiple ?
                    <button className="yt-btn small info link block" onClick={() => this.setState({ roleModal: "file_attach" })}>
                      Select { fileIds.length > 0 ? ' more ' : null } files to share
                    </button>
                    :
                    null
                  }
                  { allowMultiple ?
                    <button className="yt-btn small info link block" onClick={() => this.setState({ roleModal: "file_upload" })}>
                      Upload new files
                    </button>
                    :
                    null
                  }
                </div>
              </div>
              <hr/>
              <div className="-share-link-configuration">
                <div className="-header">
                  <i className="fas fa-eye"/> Link settings 
                </div>
                <div className="-body">
                  <div className="-setting yt-row space-between">
                    <div className="-instructions yt-col">
                      <p><strong>Who has access</strong></p>
                      <p>Control who can view the file with this link</p>
                    </div>
                    <div className="-inputs yt-col">
                      <SelectFromObject 
                        change={this._handleFormChange}
                        items={authTypes}
                        display="display"
                        displayStartCase={false}
                        name="authType"
                        selected={this.state.authType}
                        value="val"
                      />
                      { this.state.authType === 'secret-question' ?
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
                          { this.state.selectedQuestion === 'other' ?
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
                            required={true}
                            value={this.state.password}
                          />
                        </div>
                        :
                        null
                      }
                      { this.state.authType === 'password'  ? 
                        <TextInput
                          change={this._handleFormChange}
                          helpText="It's up to you to make sure they know this password"
                          name="password"
                          placeholder="Set Password"
                          required={true}
                          value={this.state.password}
                        />
                        :
                        null 
                      }
                      { this.state.authType === 'shared-contact-secret' ?
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
                        :
                        null
                      }
                      <div className="alert-message warning -left -small">
                      { this.state.authType === 'none' ? 
                        <p><small><strong>Note: </strong>Anyone with the link can access these files.</small></p> 
                        :
                        this.state.authType === 'shared-client-secret' ? 
                        <p><small><strong>Note: </strong>Only those who know the answer to the client's security question can access this request.</small></p> 
                        :
                        this.state.authType === 'shared-contact-secret' ? 
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
                          value={this.state.sN_viewed}
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
                          value={this.state.sN_downloaded}
                        />
                      </div>
                    </div>
                  }
                  <hr/>
                  {
                    firm.tcFileAccess ?
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
                    firm.tcFileAccess ? <hr/> : null
                  }
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
                            />
                            :
                            null
                          )
                        })}
                      </div>
                      <div className="yt-row" style={{paddingRight: '5px'}}>
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
                </div>
              </div>
            </div>
            )
            :
            <div>
              <h4>Share link created</h4>
              <div className="yt-row -share-link-row center-vert">
                <div className="-icon">
                  <i className="fas fa-eye fa-lg"/>
                </div>
                <div className="-description">
                  <div className={promptClass}>
                    <p>
                      <strong>Who can view?</strong><br/>
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
                </div>
                :
                null
              }
              <hr/>
              <div className="-share-link-configuration">
                  <div className="-header">
                    <i className="fal fa-file-export"/>  Update files included from link
                  </div>
                  <div className="-body">
                    {fileIds.map((fileId, i) => 
                      <FileDeliveryListItem
                        key={fileId + '_' + i}
                        file={fileStore.byId[fileId]}
                        filePath={client ? `/firm/${firm._id}/workspaces/${client._d}/files/${fileId}` :  `/firm/${firm._id}/files/${fileId}`}
                        removeFile={this._handleRemoveFile}
                        allowRemove={!updateLink.includes(fileId)} // When this modal is opened from PracticeSingleFile view it doesn't make sense to let them delete the single file from the list.
                      />
                    )}
                    { allowMultiple ?
                      <button className="yt-btn small info link block" onClick={() => this.setState({ roleModal: "file_attach" })}>
                        Select { fileIds.length > 0 ? ' more ' : null } files to share
                      </button>
                      :
                      null
                    }
                    {
                      allowMultiple ?
                      <button className="yt-btn small info link block" onClick={() => this.setState({ roleModal: "file_upload" })}>
                        Upload new files
                      </button>
                      : null
                    }
                  </div>
                </div>              
            </div>
          }
        </Modal>
        <ModalComponent 
          close={() => this.setState({ roleModal: null })}
          isOpen={!!roleModal}
          match={match}

          listArgs={listArgs}
          type={roleModal}
          firmId={match.params.firmId}
          fileListArgsObj={{}}
          selectedFileIds={selectedFileIds}
          multiple={true}
          handleUploaded={() => this.setState({ isUploadFilesSubmit: true })}
          filePointers={{_client: match.params.clientId, _firm: match.params.firmId}}
          showStatusOptions={true}
          viewingAs="default"
          onSubmit={this._handleAttachFiles}
          selectedClient={selectedClient}
          folderListItems={folderListItems}
        />
      </div>
    )
  }
}

ShareMultipleFilesModal.propTypes = {
  allowMultiple: PropTypes.bool
  , client: PropTypes.object
  , close: PropTypes.func.isRequired 
  , dispatch: PropTypes.func.isRequired
  , fileListArgsObj: PropTypes.object
  , firm: PropTypes.object.isRequired 
  , handleSelectFile: PropTypes.func.isRequired 
  , handleUpdateSelectedFile: PropTypes.func
  , isOpen: PropTypes.bool.isRequired
  , selectedFileIds: PropTypes.array
}

ShareMultipleFilesModal.defaultProps = {
  allowMultiple: true
  , client: null 
  , selectedFileIds: []
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    // defaultFile: store.selectedFileIds.defaultItem
    clientStore: store.client
    , clientUserStore: store.clientUser
    , fileStore: store.file 
    , shareLinkStore: store.shareLink 
    , userStore: store.user
    , socket: store.user.socket
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ShareMultipleFilesModal)
);
