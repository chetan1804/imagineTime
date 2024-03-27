/**
 * Modal for setting up a signature request task.
 * Allows user to choose a template and choose signers.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as addressActions from '../../../address/addressActions';
import * as clientActions from '../../../client/clientActions';
import * as firmActions from '../../../firm/firmActions';
import * as userActions from '../../../user/userActions';
import * as quickTaskActions from '../../quickTaskActions';
import * as shareLinkActions from '../../../shareLink/shareLinkActions';
import * as staffActions from '../../../staff/staffActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';

// import third-party libraries
import _ from 'lodash';
import { DateTime } from 'luxon';

// import utils
import { validationUtils, permissions } from'../../../../global/utils';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';

// import resource components
import QuickTaskFileForm from './QuickTaskFileForm.js.jsx';
import QuickTaskSignatureForm from './QuickTaskSignatureForm.js.jsx';
import FileJotBlocks from '../../../file/components/FileJotBlocks.js.jsx';
import SelectFolderList from '../../../folder/components/SelectFolderList.js.jsx';
import moment from 'moment';
import classNames from 'classnames';

class CreateQuickTaskModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      errorMessage: ''
      // fetching is used to show a loading state while we fetch the template and generate the signer inputs.
      , fetching: false
      , formHelpers: _.cloneDeep(this.props.quickTaskStore.formHelpers)
      , kbaEnabled: false
      , progress: {
        message: 'Waiting'
        , percent: 0
      }
      , prompt: props.type === 'signature' ? 'Please sign the attached document.' : ''
      , quickTask: null
      , selectedClientId: null
      , selectedTemplate: null
      , shareLink: null
      , signers:[]
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
      , selectedQuestion: 'dssn'
      , secretQuestions: {
        // dssn: { display: 'What are the last 4 numbers of your Social Security Number?', val: 'dssn', prompt: 'What are the last 4 numbers of your Social Security Number?'}
        // , dssn2: { display: 'What is your social security number, without the dashes?', val: 'dssn2', prompt: 'What is your social security number, without the dashes?'}
        // , dssn3: { display: `What are the last four numbers of the client's Social Security Number?`, val: 'dssn3', prompt: `What are the last four numbers of the client's Social Security Number?`}
        // , dphone: { display: 'What are the last 4 of your phone number?', val: 'dphone', prompt: 'What are the last 4 of your phone number?'}
        // , dzip: { display: 'What is your zip code?', val: 'dzip', prompt: 'What is your zip code?'}
        // , ftin: { display: 'What are the last four digits of your Federal Tax Identification Number?', val: 'ftin', prompt: 'What are the last four digits of your Federal Tax Identification Number?' }
      }
      , showJotblocksModal: false
      , customeTemplate: { elements: [], signers: [] }
      , match: props.match
      , targetLocation: { 
        clientId: props.match.params.clientId ? props.match.params.clientId : null
        , userId: props.match.params.userId ? props.match.params.userId : "" 
        , _folder: props.match.params.folderId ? props.match.params.folderId : props.match.params.fileId ? props.match.params.fileId : ""
      }
      , _personal: props.match.params.userId ? `personal${props.match.params.userId}` : null
      , sN_viewSignatureRequest: true
      , sN_signingCompleted: true
      , showFolderTree: false
      , selectedFolder: null
      , showTermsConditions: false
      , sN_creatorAutoSignatureReminder: false
      , sN_clientAutoSignatureReminder: false
      , defaultLocation: props.match.params.clientId ? props.match.params.clientId : props.match.params.userId ? props.match.params.userId : null
      , signerSigningOrderType: "sequential"
      , isCreatorReminder: true
      , isClientReminder: true
      , receivers: []
    }
    this._bind(
      '_createSignatureQuickTask'
      , '_close'
      , '_generateSignerInputs'
      , '_getSignerList'
      , '_getTemplateById'
      , '_handleChange'
      , '_handleSignerChange'
      , '_handleTemplateChange'
      , '_validateSignerArray'
      , '_copyToClipboard'
      , '_handleJotblocksModal'
      , '_handleCustomTemplate'
      , '_handleCheckInputChange'
      , '_handleRTEChange'
      , '_handleShowFolderTree'
      , '_handleReminder'
      , '_addRecipient'
      , '_removeRecipient'
    )
    const { socket } = this.props;
    socket.on('signature_progress', progress => {
      this.setState({ progress })
    });
    // socket.on('debug', request => {
    //   console.log('REQUEST: ', request);
    // })
  }

  componentDidMount() {
    const { clientId, dispatch, file, loggedInUser, match, socket, firm } = this.props;

    console.log("matchy", match.params);
    console.log("this is my firm ", firm);

    if (match.params.clientId) {
      dispatch(staffClientActions.fetchListIfNeeded('_client', match.params.clientId, '~staff.status', 'active'));
    }

    if(firm) {
      const defaultAuth = firm.authDefault == "QA" ? 'secret-question' : 'none';
      console.log("defaultAuth 123", defaultAuth);
      this.setState({authType: defaultAuth});
    }  

    // First fetch the firm.
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId)).then(firmRes => {
      if(firmRes.success) {
        const firm = firmRes.item;
        
        const other = { other: { display: 'Other', val: 'other', prompt: ''}}
        if(firm.secretQuestions) {
          const cusSecretQuestions = typeof(firm.secretQuestions) === "string" ? JSON.parse(firm.secretQuestions) : firm.secretQuestions;
          if(Object.entries(cusSecretQuestions).length > 0) {
            //set secret questions
            const {secretQuestions} = this.state;
            this.setState({secretQuestions: { ...secretQuestions, ...cusSecretQuestions, ...other }});
          } else {
            const {secretQuestions} = this.state;
            const other = {
              other: { display: 'Other', val: 'other', prompt: ''}
            }
            this.setState({secretQuestions: { ...secretQuestions, ...other }});
          }
        } else {
          const {secretQuestions} = this.state;
          this.setState({secretQuestions: { ...secretQuestions, ...other }});
        }

        if(firm.eSigAccess) {
          // Fetch all assuresign templates available to this firm.
          dispatch(firmActions.sendGetTemplates(match.params.firmId)).then(templateRes => {
            if(!templateRes.success) {
              // fail silently since they haven't actively triggered this action.
            } else {
              if (templateRes.templates) {
                let template = templateRes.templates.sort(function(a,b) {
                  // a = a.name.toLowerCase().replace(/[^a-zA-Z0-9]/g,'');
                  // b = b.name.toLowerCase().replace(/[^a-zA-Z0-9]/g,'');
                  return a > b ? 1 : -1;
                });
                this.setState({
                  templates: template
                });  
              }
            }
          });
        }
      }
    });
    if(socket && loggedInUser && loggedInUser._id) {
      // The standard notification socket is not loaded on single file view
      // Subscribe here manually just in case.
      socket.emit('subscribe', loggedInUser._id)
    }
    // If we have a prop that gives the client id set it. Otherwise it will
    // be set later by the user.
    if(clientId || (file && file._client)) {
      let selectedClientId = clientId || file._client;
      this.setState({ selectedClientId });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { clientId, dispatch, file } = this.props;
    if(clientId && prevProps.clientId !== clientId && !isNaN(clientId)) {
      dispatch(userActions.fetchListIfNeeded('_client', clientId))
      dispatch(clientUserActions.fetchListIfNeeded('_client', clientId));
      this.setState({
        selectedClientId: clientId
        , selectedFolder: null
      })
    } else if((!prevProps.file && file && file._client) || (prevProps.file && file && prevProps.file._client !== file._client)) {
      dispatch(userActions.fetchListIfNeeded('_client', file._client));
      dispatch(clientUserActions.fetchListIfNeeded('_client', file._client));
      this.setState({
        selectedClientId: file._client
        , selectedFolder: null
      })
    } else if((!prevState.selectedClientId && this.state.selectedClientId && !isNaN(this.state.selectedClientId)) || (prevState.selectedClientId && this.state.selectedClientId && this.state.selectedClientId !== prevState.selectedClientId && !isNaN(this.state.selectedClientId))) {
      dispatch(userActions.fetchListIfNeeded('_client', this.state.selectedClientId));
      dispatch(clientUserActions.fetchListIfNeeded('_client', this.state.selectedClientId));
    }

    if (prevProps.match.params.fileId && prevProps.match.params.fileId != prevState.match.params.fileId) {
      const newTargetLocation = _.cloneDeep(this.state.targetLocation);
      newTargetLocation._folder = prevProps.match.params.fileId;
      this.setState({ targetLocation: newTargetLocation, match: prevProps.match });
    }
  }

  componentWillUnmount() {
    const { socket } = this.props
    socket.off('signature_progress')
  }

  _handleChange(e, action) {

    const { dispatch, match } = this.props;

    let name;
    let value;
    
    if (action === "receiver") {
      name = e.target.name.replace("recipients", "receivers");
      value = e.target.value;
    } else {
      name = e.target.name;
      value = e.target.value;
    }
    
    let newState = _.update(_.cloneDeep(this.state), name, () => {
      return value;
    });

    console.log("newState", newState);

    const isCustom = this.state.templateId === "custom";

    if (name.indexOf('signers') > -1 && name.indexOf('selectedQuestions') > -1) {
      let newName = name.replace('[selectedQuestions]', '');
      let newValue = { selectedQuestions: value } 
      newState = _.update(_.cloneDeep(this.state), newName, (signer) => {
        if (value != "none" && signer && !signer.hasOwnProperty('password')) {
          newValue.password = '';
        }
        return newValue;
      });
    } else if (name === 'authType' && value === 'individual-auth' && newState.signers && newState.signers.length) {
      newState.signers.forEach(signer => {
        signer.auth = {
          selectedQuestions: 'dssn'
          , password: '' 
        }
      });
    }

    if(name.includes('username')) {

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
    if(name === 'selectedClientId') {
      const val = value ? value.toString() : "";
      const _personal = val.includes("personal") ? val : null;
      const clientId = val.includes("personal") ? null : val;
      newState.clientId = clientId;
      newState._personal = _personal;
      newState.selectedFolder = null;

      if (clientId && !_personal) {
        dispatch(staffClientActions.fetchListIfNeeded('_client', clientId, '~staff.status', 'active'));
      }

      // Reset signers array when the client changes.
      this.setState(newState, () => {
        if (!isCustom && !_personal) {
          this._generateSignerInputs()
        }
      });
    } else {
      console.log("e.target.name", name);
      this.setState(newState);
    }
  }

  _handleTemplateChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    console.log("newState", newState);
    newState.fetching = true;
    // Fetch the actual template here so we can see how many signers the template is expecting.
    this.setState(newState, () => {
      if (e.target.value === "custom") {
        newState.fetching = false;
        newState.showJotblocksModal = true;
        newState.errorMessage = "";
        this.setState(newState);
      } else {
        this._getTemplateById()
      }
    });
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

  _close() {
    const { dispatch, firm, match } = this.props;
    const defaultAuth = firm.authDefault == "QA" ? 'secret-question' : 'none';
    dispatch(shareLinkActions.resetShareLink());
    
    this.setState({
      errorMessage: null
      , kbaEnabled: false
      , progress: {
        message: "Waiting"
        , percent: 0
      }
      //, prompt: this.props.type === 'signature' ? 'Please sign the attached document.' : ''
      , password: ''
      , prompt: ''
      , quickTask: null
      , selectedClientId: match.params.clientId
      , selectedTemplate: null
      , signers: []
      , submitting: false
      , templateId: null
      , authType: defaultAuth
      , selectedQuestion: 'dssn'
      , _personal: match.params.userId ? `personal${match.params.userId}` : null
      , authTypes: [
        { display: 'Direct Link', val: 'none' }
        , { display: 'Question/Answer', val: 'secret-question' }
        , { display: 'Individual Authentication', val: 'individual-auth' }
      ]
      , sN_viewSignatureRequest: true
      , sN_signingCompleted: true
      , sN_creatorAutoSignatureReminder: false
      , sN_clientAutoSignatureReminder: false
      , selectedFolder: null
      , showFolderTree: false
    }, () => this.props.close())
  }

  // Signature request methods.

  // We need to fetch the actual template so we can generate the correct number of singer inputs.
  _getTemplateById() {
    const { dispatch, match } = this.props;
    const { templateId } = this.state;
    const firmId = match.params.firmId;
    // console.log('Fetching template by id', templateId);

    dispatch(quickTaskActions.sendGetTemplateById(firmId, templateId)).then(templateRes => {
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

  _createSignatureQuickTask(e) {
    const { dispatch, loggedInUser, modelName } = this.props;

    const { authType, password, targetLocation, _personal, kbaEnabled, selectedFolder, showTermsConditions, selectedClientId, defaultLocation 
      , secretQuestions, selectedQuestion, sN_viewSignatureRequest, sN_signingCompleted, sN_creatorAutoSignatureReminder, sN_clientAutoSignatureReminder
      , signerSigningOrderType} = this.state;

    if(e) {e.preventDefault()};

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
    })

    const shareLinkPassword = password;
    const shareLinkPrompt = secretQuestions[selectedQuestion] ? secretQuestions[selectedQuestion].prompt : null;

    const newShareLink = {
      _firm: this.props.firmId
      , _client: selectedClientId
      , authType: authType // we are only checking for a matching email address. We may want to revisit to allow passwords etc...
      , _createdBy: loggedInUser._id
      , password: authType !== "none" ? shareLinkPassword : ""
      , prompt: authType !== "none" ? shareLinkPrompt : ""
      , type: 'signature-request'
      // , _folder: targetLocation._folder ? isNaN(targetLocation._folder) ? "" : targetLocation._folder : ""
      , sN_viewSignatureRequest
      , sN_signingCompleted
      , showTermsConditions: showTermsConditions
      , sN_clientAutoSignatureReminder
      , sN_creatorAutoSignatureReminder
      , sentTo: this.state.receivers
    }

    if (selectedFolder && selectedFolder._id) {
      newShareLink._folder = selectedFolder._id;
    } else {
      let newLocation = selectedClientId ? selectedClientId : _personal ? _personal.replace("personal", "") : null;
      if (newLocation == defaultLocation && targetLocation._folder) {
        newShareLink._folder = targetLocation._folder;
      }
    }
    
    if (_personal) {
      newShareLink._personal = _personal.replace("personal", "");
      newShareLink._client = null;
    }

    dispatch(shareLinkActions.sendCreateShareLink(newShareLink)).then(response => {
      if(response.success) {
        let shareLink = response.item

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

        console.log("updatedSigners signers", updatedSigners);
        // Put together a bit of a strange request body.
        const eSigRequest = {
          _client: this.state.selectedClientId
          , _firm: this.props.firmId
          , type: 'signature'
          , _unsignedFiles: [this.props.file._id]
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

        if (modelName) {
          eSigRequest.unsignedFileModelName = modelName;
        }

        dispatch(quickTaskActions.sendCreateQuickTask(eSigRequest)).then(taskRes => {
          if(taskRes.success) {
            // Now update the sharelink with the quickTask id.
            shareLink._quickTask = taskRes.item._id
            dispatch(shareLinkActions.sendUpdateShareLinkWithPermission(shareLink)).then(shareLinkRes => {
              this.setState({
                kbaEnabled: false
                , progress: {
                  message: "Waiting"
                  , percent: 0
                }
                , prompt: this.props.type === 'signature' ? 'Please sign the attached document.' : ''
                , quickTask: taskRes.item
                , selectedClientId: null
                , selectedTemplate: null
                , signers: []
                , submitting: false
                , templateId: null
                
              });
              if(shareLinkRes.success) {
                this.setState({
                  shareLink: shareLinkRes.item
                });
              } else {
                this.setState({
                  errorMessage: 'Error code 700 -' + taskRes.error || 'Unable to create signature request. Please try again.'
                })
              }
            })
          } else {
            this.setState({
              errorMessage: 'Error code 701 - ' + taskRes.error || 'Unable to create signature request. Please try again.'
              , kbaEnabled: false
              , progress: {
                message: "Waiting"
                , percent: 0
              }
              , prompt: this.props.type === 'signature' ? 'Please sign the attached document.' : ''
              , quickTask: taskRes.item
              , selectedClientId: null
              , selectedTemplate: null
              , signers: []
              , submitting: false
              , templateId: null
              , customeTemplate: { elements: [], signers: [] }
            })
          }
        })
      } else {
        this.setState({
          errorMessage: 'Error code 702 -' + response.error || 'Unable to create signature request. Please try again.'
          , kbaEnabled: false
          , progress: {
            message: "Waiting"
            , percent: 0
          }
          , prompt: this.props.type === 'signature' ? 'Please sign the attached document.' : ''
          , quickTask: response.item
          , selectedClientId: null
          , selectedTemplate: null
          , signers: []
          , submitting: false
          , templateId: null
        })
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
    const { signers, authType } = this.state;
    const kbaEnabled = _.cloneDeep(this.state.kbaEnabled);
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
            address: signer && signer.kba && signer.kba.address ? signer.kba.address : "",
            city: signer && signer.kba && signer.kba.city ? signer.kba.city : "",
            state: signer && signer.kba && signer.kba.state ? signer.kba.state : "",
            zip: signer && signer.kba && signer.kba.zip ? signer.kba.zip : ""
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

    return validationUtils.checkObjectHasValues(newSigners)
  }

  // TODO: File request methods go below.
  _copyToClipboard = e => {
    this.linkInput.select();
    document.execCommand('copy');
    this.setState({copySuccess: true});
  };

  _handleJotblocksModal() {
    const { signers, customeTemplate } = this.state;
    if (signers && signers.length && customeTemplate && customeTemplate.signers && customeTemplate.signers.length && customeTemplate.elements && customeTemplate.elements.length) {
      this.setState({ showJotblocksModal: !this.state.showJotblocksModal, errorMessage: "" });
    } else {
      this.setState({ templateId: null, showJotblocksModal: !this.state.showJotblocksModal, errorMessage: "" });
    }
  }

  _handleCustomTemplate(signers, customeTemplate) {
    if (signers && signers.length && customeTemplate && customeTemplate.signers && customeTemplate.signers.length && customeTemplate.elements && customeTemplate.elements.length) {
      signers = signers.map(signer => {
        if (this.state.kbaEnabled) {
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
        }
        if (this.state.authType === "individual-auth") {
          signer.auth = {
            selectedQuestions: 'dssn'
            , password: '' 
          } 
        }
        return signer;
      });
      this.setState({ signers, customeTemplate, showJotblocksModal: false });    
    } else {
      this.setState({ templateId: null, showJotblocksModal: false });
    }
  }

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

  _handleShowFolderTree() {
    const showFolderTree = _.cloneDeep(this.state.showFolderTree);
    this.setState({ showFolderTree: !showFolderTree });
  }

  _handleReminder(type, status) {
    if (!status) {
      if (type === 'creator') {
        this.setState({ isCreatorReminder: true, sN_creatorAutoSignatureReminder: false})
      } else {
        this.setState({ isClientReminder: true, sN_clientAutoSignatureReminder: false})
      }
    } else {
      if (type === 'creator') {
        this.setState({ isCreatorReminder: false, sN_creatorAutoSignatureReminder: true})
      } else {
        this.setState({ isClientReminder: false, sN_clientAutoSignatureReminder: true})
      }
    }
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
      let newReceivers = _.cloneDeep(this.state.receivers)
      delete newReceivers[index]
      this.setState({ receivers: newReceivers.filter(removeNull => removeNull) });
    } else {
      let newRecipients = _.cloneDeep(this.state.recipients)
      delete newRecipients[index]
      this.setState({ recipients: newRecipients.filter(removeNull => removeNull) });
    }
  }

  render() {
    const { 
      clientId
      , clientStore
      , isOpen
      , file
      , match
      , type
      , userStore
      , staffStore
      , loggedInUser
      , staffClientStore
      , firm
      , clientUserStore
    } = this.props;
    const {
      errorMessage
      , fetching
      , progress
      , quickTask
      , selectedClientId
      , selectedTemplate
      , signers
      , shareLink
      , submitting
      , templates
      , showJotblocksModal
      , customeTemplate
      , _personal
      , kbaEnabled
      , templateId
      , sN_viewSignatureRequest
      , sN_signingCompleted
      , showFolderTree
      , selectedFolder
      , showTermsConditions
      , sN_creatorAutoSignatureReminder
      , sN_clientAutoSignatureReminder
      , signerSigningOrderType
      , isCreatorReminder
      , isClientReminder
      , receivers
    } = this.state;

    console.log('selectedFolder', selectedFolder);

    const staffClientsListItems = staffClientStore.util.getList('_client', selectedClientId, '~staff.status', 'active');
    const staffClientInfo = staffClientStore.util.getSelectedStore('_client', selectedClientId, '~staff.status', 'active');

    let userListItems  = [];
    if (selectedClientId) {
      let clientUserListItems = clientUserStore.util.getList('_client', selectedClientId);
      if (clientUserListItems && clientUserListItems.length) {
        clientUserListItems.forEach(item => {
          if (item && item.status === "active" && userStore && userStore.byId && userStore.byId[item._user]) {
            userListItems .push(userStore.byId[item._user]);
          }
        })
      }
    }

    const signerListItems = type === 'signature' && userListItems && userListItems.length ? this._getSignerList(userListItems) : null;
 
    const elements = customeTemplate.elements ? customeTemplate.elements : [];

    // TODO: filter this list down to all clients that the loggedInStaff has a staffClient for.

    let clientListItems = clientStore.util.getList('_firm', match.params.firmId, 'status', 'visible'); 
    clientListItems = clientListItems ? clientListItems.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1) : null;

    const disabled = !templateId || signers && signers.length === 0 || this.state.duplicateEmail || this.state.submitting || !this._validateSignerArray() || this.state.errorMessage;

    let selectedUserId = null;
    let tempSelectedClient = selectedClientId;
    if (_personal) {
      selectedUserId = _personal.replace("personal", "");
      tempSelectedClient = null;
    }
  
    let modalHeader = 'Request a file';
    if (type === "signature") {
      modalHeader = "Prepare document for e-signature";
      if (showJotblocksModal) {
        modalHeader += " > Setup custom template";
      }
      if (showFolderTree) {
        modalHeader += " > Select folder location";
      }
    }

    const linkClass = classNames(
      "-copyable-share-link" 
      , { '-visible': this.state.copySuccess }
    )

    return (
      <div>
      <Modal
        cardSize={`${showJotblocksModal ? "jumbo_90" : "large"}`}
        closeAction={showFolderTree ? this._handleShowFolderTree : showJotblocksModal ? this._handleJotblocksModal : this._close}
        isOpen={isOpen}
        modalHeader={modalHeader}
        showButtons={!showFolderTree && !showJotblocksModal && !(quickTask && shareLink)}
        disableConfirm={!!disabled}
        confirmText={submitting ? "Preparing Request..." : "Prepare Request"}
        confirmAction={this._createSignatureQuickTask}
      >
        <div style={{ opacity: submitting || fetching ? 0.5 : 1 }}>
        { errorMessage ?
          <div className="yt-container" style={{padding: '2em 0'}}>
            <div className="input-group">
              <div className="-error-message -wrap-word">ERROR: {errorMessage}</div>
            </div>
          </div>
          :
          null
        }
        { quickTask && shareLink ?
          <div>
            <h4>Signature request created</h4>
            {
              quickTask._client ?
              <div className="yt-row -share-link-row center-vert">
                <div className="-description">
                  <Link to={`/firm/${quickTask._firm}/workspaces/${quickTask._client}/quick-tasks/quick-view/${quickTask._id}`}>View it here</Link>             
                </div>
              </div> : null            
            }
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
                <div className={linkClass}>
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
          </div>
          :
          type === 'signature' ?
            showFolderTree ? 
            <SelectFolderList
              selectedUserId={selectedUserId}
              selectedClientId={tempSelectedClient}
              handleSelectFolder={(folder) => this.setState({ selectedFolder: folder, showFolderTree: false })}
              hideHeader={true}
            />
            :
            showJotblocksModal ? 
            <FileJotBlocks 
              selectedFile={file}
              handleCustomTemplate={this._handleCustomTemplate}
              modelName={this.props.modelName}
            />
            :
            <QuickTaskSignatureForm
              allowSharedEmail={this.state.signers && this.state.signers.length === 2}
              cancelLink={this._close}
              clientListItems={clientListItems}
              disabled={disabled}
              fetching={fetching}
              handleFormChange={this._handleChange}
              handleFormSubmit={this._createSignatureQuickTask}
              handleSignerChange={this._handleSignerChange}
              handleTemplateChange={this._handleTemplateChange}
              prompt={this.state.prompt}
              selectedClient={clientStore.byId[selectedClientId]}
              selectedFile={file}
              signerListItems={signerListItems}
              signers={signers}
              submitting={submitting}
              templates={templates}
              templateId={templateId}
              authTypes={this.state.authTypes}
              authType={this.state.authType}
              secretQuestions={this.state.secretQuestions}
              selectedQuestion={this.state.selectedQuestion}
              password={this.state.password}
              handleJotblocksModal={this._handleJotblocksModal}
              elements={elements}
              loggedInUser={loggedInUser}
              match={match}
              _personal={_personal}
              userMap={userStore && userStore.byId ? userStore.byId : {}}
              kbaEnabled={kbaEnabled}
              handleCheckInputChange={this._handleCheckInputChange}
              progress={progress}
              sN_viewSignatureRequest={sN_viewSignatureRequest}
              sN_signingCompleted={sN_signingCompleted}
              sN_creatorAutoSignatureReminder={sN_creatorAutoSignatureReminder}
              sN_clientAutoSignatureReminder={sN_clientAutoSignatureReminder}
              handleRTEChange={this._handleRTEChange}
              handleShowFolderTree={this._handleShowFolderTree}
              selectedFolder={selectedFolder}
              modelName={this.props.modelName}
              firm={firm}
              showTermsConditions={showTermsConditions}
              staffClientsListItems={staffClientsListItems}
              staffClientInfo={staffClientInfo}
              signerSigningOrderType={signerSigningOrderType}
              staffStore={staffStore}
              userStore={userStore}
              receivers={receivers}
              addRecipient={this._addRecipient}
              removeRecipient={this._removeRecipient}
            />
          :
          type === 'file' ?
          <QuickTaskFileForm
            // TODO: Build this form.
          />
          :
          <div>Unsupported type</div>
        }
        {/* {
          type === "signature" && showJotblocksModal ?

        } */}
        </div>
      </Modal>
      {sN_creatorAutoSignatureReminder && <AlertModal
        alertTitle="Creator Weekly Reminder"
        closeAction={() => this._handleReminder("creator", false)}
        confirmAction={() => this._handleReminder("creator", true)}
        confirmText="Continue"
        declineAction={() => this._handleReminder("creator", false)}
        declineText="Cancel"
        isOpen={isCreatorReminder}
      >
        <div style={{ color: "black" }}>
          <p>This will enable your weekly reminder for incomplete signature requests.</p>
        </div>
      </AlertModal>}
      
      {sN_clientAutoSignatureReminder && <AlertModal
        alertTitle="Client Weekly Reminder"
        closeAction={() => this._handleReminder("client", false)}
        confirmAction={() => this._handleReminder("client", true)}
        confirmText="Continue"
        declineAction={() => this._handleReminder("client", false)}
        declineText="Cancel"
        isOpen={(isClientReminder)}
      >
        <div style={{ color: "black" }}>
          <h4>This will enable signer's weekly reminder for incomplete signature requests.</h4>
        </div>
      </AlertModal>}
      
      </div>
    )
  }
}

CreateQuickTaskModal.propTypes = {
  clientId: PropTypes.string
  , close: PropTypes.func.isRequired
  , dispatch: PropTypes.func.isRequired
  , file: PropTypes.object
  , firmId: PropTypes.string
  , isOpen: PropTypes.bool.isRequired
  , type: PropTypes.string.isRequired
  , firm: PropTypes.object 
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    addressStore: store.address
    , clientStore: store.client
    , loggedInUser: store.user.loggedIn.user 
    , userStore: store.user
    , quickTaskStore: store.quickTask
    , fileStore: store.file
    , socket: store.user.socket
    , staffStore: store.staff
    , staffClientStore: store.staffClient
    , clientUserStore: store.clientUser
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(CreateQuickTaskModal)
);