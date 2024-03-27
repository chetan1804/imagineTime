/* global Office:false */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

import DesktopLoading from './DesktopLoading.js.jsx';

import Binder from '../../components/Binder.js.jsx';
import ProgressBar from '../../components/helpers/ProgressBar.js.jsx'
import {
  SelectFromObject
  , TextAreaInput
  , TextInput
} from '../../components/forms';

// import utils
import { validationUtils } from'../../utils';
import sortUtils from '../../utils/sortUtils.js';

// import actions
import * as addressActions from '../../../resources/address/addressActions';
import * as clientActions from '../../../resources/client/clientActions';
import * as firmActions from '../../../resources/firm/firmActions';
import * as quickTaskActions from '../../../resources/quickTask/quickTaskActions';
import * as shareLinkActions from '../../../resources/shareLink/shareLinkActions';
import * as userActions from '../../../resources/user/userActions';

import FileDeliveryListItem from '../../../resources/file/components/FileDeliveryListItem.js.jsx';
import SignerInput from '../../../resources/quickTask/practice/components/SignerInput.js.jsx'

import moment from 'moment';

class DesktopRequestSignatures extends Binder {
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
      , prompt: 'Please sign the attached document.'
      , clientId: this.props.location.state.clientId || null
      , selectedTemplate: null
      , signers: [] // instead of an array of ids, we'll need an array of objects with signer.username (email), signer.firstname, and signer.lastname
                    // We are no longer requiring signers to be portal users and this way we won't be trying to fetch user info on the server.
      , submitting: false
      , templates: null
      , templateId: null
      , copySuccess: false
      , authTypes: [
        { display: 'Direct Link', val: 'none' }
        , { display: 'Question/Answer', val: 'secret-question' }
      ]
      , password: ''
      , selectedQuestion: 'dssn'
      , secretQuestions: {
        // dssn: { display: 'What are the last 4 numbers of your Social Security Number?', val: 'dssn', prompt: 'What are the last 4 numbers of your Social Security Number?'}
        // , dssn2: { display: 'What is your social security number, without the dashes?', val: 'dssn2', prompt: 'What is your social security number, without the dashes?'}
        // , dssn3: { display: `What are the last four numbers of the client's Social Security Number?`, val: 'dssn3', prompt: `What are the last four numbers of the client's Social Security Number?`}
        // , dphone: { display: 'What are the last 4 of your phone number?', val: 'dphone', prompt: 'What are the last 4 of your phone number?'}
        // , dzip: { display: 'What is your zip code?', val: 'dzip', prompt: 'What is your zip code?'}
        // , ftin: { display: 'What are the last four digits of your Federal Tax Identification Number?', val: 'ftin', prompt: 'What are the last four digits of your Federal Tax Identification Number?' }
      }
      , userSecretQuestionList : []
    };

    this._bind(
      '_generateSignerInputs'
      , '_getSignerList'
      , '_getTemplateById'
      , '_handleClose'
      , '_handleCreateSignatureRequest'
      , '_handleFormChange'
      , '_handleSignerChange'
      , '_handleTemplateChange'
      , '_validateSignerArray'
      , '_copyToClipboard'
    );
    const { loggedInUser, socket } = this.props;

    socket.on('disconnect', reason => {
      // console.log('socket disconnected!!!');
      // console.log(reason);
      // We've been disconnected for some reason. Reconnect.
      socket.open();
    })

    // The connect event also fires on reconnect. That's when this will be hit since this component will not
    // yet be mounted when the socket first connects (when desktop.pug is loaded).
    socket.on('connect', () => {
      // console.log('Connected!');
      if(loggedInUser && loggedInUser._id) {
        // console.log('subscribing to userid');
        socket.emit('subscribe', loggedInUser._id);
      }
    })

    socket.on('signature_progress', progress => {
      // console.log('progress', progress);
      this.setState({ progress })
    });
  }

  componentDidMount() {
    const { dispatch, loggedInUser, selectedFirm , socket} = this.props
    if(socket && socket.disconnected) {
      socket.open();
    } else if(socket && socket.connected && loggedInUser && loggedInUser._id) {
      socket.emit('subscribe', loggedInUser._id);
    }
    if(selectedFirm && selectedFirm._id) {
      dispatch(clientActions.fetchListIfNeeded('_firm', selectedFirm._id))
      if(selectedFirm.eSigAccess) {
        // Fetch all assuresign templates available to this firm.
        dispatch(firmActions.sendGetTemplates(selectedFirm._id)).then(templateRes => {
          if(!templateRes.success) {
            // fail silently since they haven't actively triggered this action.
          } else {
            this.setState({
              templates: templateRes.templates
            });
          }
        });
      }
      
      const firm = selectedFirm;
      const defaultAuth = firm.authDefault == "QA" ? 'secret-question' : 'none';
      const {secretQuestions} = this.state;

      this.setState({authType: defaultAuth});

      let cusSecretQuestions = {}
      if(selectedFirm.secretQuestions) {
        cusSecretQuestions = typeof(firm.secretQuestions) === "string" ? JSON.parse(firm.secretQuestions) : firm.secretQuestions;

        if(Object.entries(cusSecretQuestions).length > 0) {
          //set secret questions\
        } else {
          cusSecretQuestions = {};
        }

      }

      const other = {
        other: { display: 'Other', val: 'other', prompt: ''}
      }

      this.setState({secretQuestions: {...secretQuestions, ...cusSecretQuestions, ...other }});
    }
  }

  componentDidUpdate(prevState) {
    const { dispatch } = this.props;
    if((!prevState.clientId && this.state.clientId) || (prevState.clientId && this.state.clientId && this.state.clientId !== prevState.clientId)) {
      dispatch(userActions.fetchListIfNeeded('_client', this.state.clientId))
    }
  }

  componentWillUnmount() {
    const { socket } = this.props;
    socket.off('disconnect')
    socket.off('connect')
    socket.off('signature_progress')
  }

  _handleCreateSignatureRequest(e) {
    // NOTE: This is a bit tricky. We need to create the sharelink before we create the quickTask
    // so we can use the sharelink url as the redirect url for assuresign. Then we have to save a reference
    // to the quicktask on the sharelink.
    const { dispatch, fileStore, selectedFirm, history, loggedInUser } = this.props;
    const { authType, password, _personal, kbaEnabled, secretQuestions, selectedQuestion } = this.state;

    if(e) {e.preventDefault()};
    this.setState({
      submitting: true
    })

    const shareLinkPassword = password;

    const shareLinkPrompt = secretQuestions[selectedQuestion] ? secretQuestions[selectedQuestion].prompt : "";

    const newShareLink = {
      _firm: selectedFirm._id
      , _client: this.state.clientId
      , authType: authType // we are only checking for a matching email address. We may want to revisit to allow passwords etc...
      , _createdBy: loggedInUser._id
      , password: authType !== "none" ? shareLinkPassword : ""
      , prompt: authType !== "none" ? shareLinkPrompt : ""
      , type: 'signature-request'
    }

    if (_personal) {
      newShareLink._personal = _personal.replace("personal", "");
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

          return signer;
        })

        const eSigRequest = {
          _client: this.state.clientId
          , _firm: selectedFirm._id
          , type: 'signature'
          , _unsignedFiles: [this.state.fileId]
          , prompt: this.state.prompt
          , redirectUrl: shareLink.url
          , signers: updatedSigners
          , templateId: this.state.templateId
        }
        dispatch(quickTaskActions.sendCreateQuickTask(eSigRequest)).then(taskRes => {
          if(taskRes.success) {
            // Now update the sharelink with the quickTask id.
            shareLink._quickTask = taskRes.item._id
            dispatch(shareLinkActions.sendUpdateShareLinkWithPermission(shareLink)).then(shareLinkRes => {
              // console.log('shareLinkRes', shareLinkRes);
              this.setState({
                fileId: null
                , progress: {
                  message: 'Waiting'
                  , percent: 0
                }
                , prompt: 'Please sign the attached document.'
                , clientId: null
                , selectedTemplate: null
                , signers: []
                , submitting: false 
                , templateId: null
              });
              if(shareLinkRes.success) {
                this.setState({
                  quickTask: taskRes.item
                  , shareLink: shareLinkRes.item
                })
              } else {
                this.setState({
                  errorMessage: 'Error code 612 - Unable to create signature request. Please try again.'
                });
              }
            })
          } else {
            this.setState({
              errorMessage: 'Error code 613 - Unable to create signature request. Please try again.'
            });
          }
        })
      } else {
        this.setState({
          errorMessage: 'Error code 614 - Unable to create signature request. Please try again.'
        });
      }
    })
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
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
    if(e.target.name === 'clientId') {
      // Reset signers array when the client changes.
      const val = e.target.value ? e.target.value.toString() : "";
      console.log("e.target.name", e.target.name);
      console.log("val", val);
      const _personal = val.includes("personal") ? val : null;
      const selectedClientId = !val.includes("personal") ? val : null
      newState.clientId = selectedClientId;
      newState._personal = _personal;

      console.log("newState", newState);
      this.setState(newState, () => this._generateSignerInputs());
    } else {
      this.setState(newState);
    }
  }

  _handleSignerChange(e) {
    const { addressStore, userStore } = this.props;
    const { kbaEnabled } = this.state;
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      const user = userStore.byId[e.target.value];
      const userAddress = addressStore.byId[user && user._primaryAddress];
      if(kbaEnabled) {
        return {
          username: user.username
          , firstname: user.firstname
          , lastname: user.lastname
          , _id: user._id
          , kba: {
            // auto-fill kba fields from user._primaryAddress (if it exists).
            // the staff member can still change it if they want.
            city: userAddress ? userAddress.city : ''
            , zip: userAddress ? userAddress.postal : ''
            , state: userAddress ? userAddress.state : ''
            , address: userAddress ? userAddress.street1 : ''
            , ssn: ''
            , dob: ''
          }
        }
      } else {
        return {
          username: user.username
          , firstname: user.firstname
          , lastname: user.lastname
          , _id: user._id
        }
      }
    });
    this.setState(newState)
  }

  _handleClose() {
    const { selectedFirm, history, location: { state: { uploadedFileIds } } } = this.props;
    const defaultAuth = selectedFirm.authDefault == "QA" ? 'secret-question' : 'none';
    this.setState({
      authType: defaultAuth
      , authTypes: [
        { display: 'Direct Link', val: 'none' }
        , { display: 'Question/Answer', val: 'secret-question' }
      ]
      , fileId: uploadedFileIds[0] || []
      , progress: {
        message: 'Waiting'
        , percent: 0
      }
      , prompt: 'Please sign the attached document.'
      , clientId: null
      , selectedTemplate: null
      , signers: []
      , submitting: false
      , templateId: null
      , password: ''
      , prompt: ''
      , selectedQuestion: 'dssn'
      , _personal: null
    });

    history.replace('/'); // go all the way back to actions
  }

  _handleTemplateChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    newState.fetching = true;
    // Fetch the actual template here so we can see how many signers the template is expecting.
    this.setState(newState, () => this._getTemplateById());
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
      signers.push(signer);
    }
    this.setState({
      fetching: false
      , signers: signers
    })
  }

  // Make sure we don't allow form submission until we have all required signer info.
  _validateSignerArray() {
    const { signers, kbaEnabled } = this.state;

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

      newSigners.push(cloneSigner);
    }

    return validationUtils.checkObjectHasValues(newSigners)
  }

  // TODO: File request methods go below.
  _copyToClipboard = e => {
    this.linkInput.select();
    document.execCommand('copy');
    this.setState({copySuccess: true});
  };

  render() {
    const {
      clientStore
      , fileStore
      , selectedFirm
      , userStore
      , workspaceList
    } = this.props;
    const {
      errorMessage
      , fileId
      , formHelpers
      , progress
      , prompt
      , quickTask
      , clientId
      , selectedTemplate
      , shareLink
      , signers
      , submitting
      , templates
      , templateId
      , authType
      , password
      , authTypes
      , _personal
    } = this.state;

    const userListItems = clientId ? userStore.util.getList('_client', clientId) : null
    const signerListItems = userListItems ? this._getSignerList(userListItems) : null

    const disabled = !selectedTemplate || this.state.duplicateEmail || this.state.submitting || !this._validateSignerArray() || this.state.errorMessage;
    
    if (!workspaceList) {
      return (<DesktopLoading />);
    }

    let signersId = [];
    if (signers) {
      signersId = signers.filter(a => a._id).map(a => a._id);
      signersId = signersId.length ? signersId : null;
    }

    const selectedClient = clientId && workspaceList ? workspaceList.filter(client => client._id == clientId ? client : null) : null;    

    return (
      <div style={{opacity: submitting || this.state.fetching ? 0.5 : 1}}>
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
          <div className="error-container" style={{width: '80%'}}>
            <div className="-error-message">{errorMessage}</div>
          </div>
        )}
        { !shareLink && !quickTask ?
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
                filePath={`/firm/${selectedFirm._id}/files/${fileId}`}
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
                  <p>
                    <strong>Who has access</strong>
                  </p>
                  <small>Control who can view the file with this link</small>
                </div>
                <div className="-inputs yt-col full">
                  <SelectFromObject
                    change={this._handleFormChange}
                    items={this.state.authTypes}
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
                </div>
              </div>
              <hr />
              <div className="-setting yt-row space-between">
                <div className="-inputs yt-col full">
                  <SelectFromObject 
                    change={this._handleTemplateChange}
                    display={'name'}
                    filterable={true}
                    helpText="Choose a template to match your file"
                    label="Template"
                    name="templateId"
                    value={'templateID'}
                    items={sortUtils._object(templates, "name") || []}
                    selected={templateId}
                    displayStartCase={false}
                  />
                  { this.props.location.state.clientId ?
                  // If we have a client Id then this file belongs to a single client workspace. Don't allow the user to change the client.
                    <div className="input-group">
                      <label>
                        Client
                      </label>
                      <p>{clientStore.byId[this.props.location.state.clientId].name}</p>
                    </div>
                    :
                    <SelectFromObject 
                      change={this._handleFormChange}
                      display={'name'}
                      filterable={true}
                      label="Client"
                      name="clientId"
                      value={'_id'}
                      items={workspaceList}
                      selected={clientId ? clientId : _personal}
                      isClearable={true}
                    />
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
                      />
                    )
                    :
                    null
                  }
                </div>
              </div>
              <hr />
              <div className="-setting yt-row space-between">
                <div className="-inputs yt-col">
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
        :
        <div>
          <h4>Signature request created</h4>
          <div className="yt-row -share-link-row center-vert">
            <div className="-description">
              <a href={`/firm/${quickTask._firm}/workspaces/${quickTask._client}/quick-tasks/quick-view/${quickTask._id}`}>View it here</a>
            </div>
          </div>
          {
            quickTask._client ? null :
            <div className="yt-row -share-link-row center-vert" style={{ marginTop: "1.5em" }}>
              <div className="-icon">
                <i className="fas fa-eye fa-lg"/>
              </div>
              <div className="-description" style={{ top: "3px" }}>
                <div className="-prompt">
                  <p>
                    Only requested signer can access with this link
                  </p>
                </div>
                <div className="-copyable-share-link">
                  <input ref={(input) => this.linkInput = input} value={shareLink.url} readOnly={true}/> 
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
          }
          <h4>Signers notified</h4>
          { shareLink.emailResults && shareLink.emailResults.length > 0 ?
            // shareLink.emailResults is populated on the server after the sharelink is updated with the quickTask id.
            shareLink.emailResults.map((result, i) =>
              <div key={'email_result_' + i}className="yt-row -share-link-row center-vert">
                <div className="yt-col"><small>{`${result.email}`}</small></div>
              </div>
            )
            :
            <div className="loading -small"></div>
          }
          <button
            type="button"
            className="yt-btn info small link"
            onClick={this._handleClose}
          >
            Back 
          </button>
        </div>
      }
      </div>
    );
  }
}

DesktopRequestSignatures.propTypes = {
  dispatch: PropTypes.func.isRequired
  , history: PropTypes.object.isRequired
  , selectedStaffId: PropTypes.number.isRequired
};

const mapStoreToProps = (store, props) => {
  const { selectedStaffId } = props;
  const firmStore = store.firm;
  const loggedInUser = store.user.loggedIn.user;
  const staffStore = store.staff;
  const selectedStaff = staffStore.byId[selectedStaffId]
  const selectedFirm = selectedStaff && firmStore.byId[selectedStaff._firm];
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
  workspaceList.sort((a, b) => {
    if(a.name.toLowerCase() < b.name.toLowerCase()) {
      return -1
    } else {
      return 1
    }
  });

  console.log("workspaceList", workspaceList);

  if (workspaceList && loggedInUser && selectedFirm) {
    workspaceList.unshift({
      _id: `personal${loggedInUser._id}`
      , name: "Personal Files"
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
    , userStore: store.user
    , workspaceList
  }
};

export default withRouter(connect(mapStoreToProps)(DesktopRequestSignatures));
