/**
 * View component for /link/request
 *
 * Displays a single shareLink from the 'byId' map in the shareLink reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, history, withRouter } from 'react-router-dom';
import queryString from 'query-string';
import { v4 as uuidv4 } from "uuid";
const async = require('async');
import axios from 'axios';

// import 3rd party libraries
import { Helmet } from 'react-helmet';
import _ from 'lodash';
import classNames from 'classnames';
import { DateTime } from 'luxon';

// import actions
import * as addressActions from '../../address/addressActions';
import * as firmActions from '../../firm/firmActions';
import * as clientActions from '../../client/clientActions';
import * as fileActions from '../../file/fileActions';
import * as clientUserActions from '../../clientUser/clientUserActions';
import * as userActions from '../../user/userActions';
import * as shareLinkActions from '../../shareLink/shareLinkActions';
import * as quickTaskActions from '../../quickTask/quickTaskActions';
import * as staffActions from '../../staff/staffActions';

// import other components
import RecipientInput from '../../quickTask/practice/components/RecipientInput.js.jsx';
import FileDeliveryListItem from '../../file/components/FileDeliveryListItem.js.jsx';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import LinkConfigLayout from '../components/LinkConfigLayout.js.jsx';
import ProgressBar from '../../../global/components/helpers/ProgressBar.js.jsx';
import {
  SelectFromObject
  , SingleDatePickerInput
  , TextAreaInput
  , TextInput 
  , ToggleSwitchInput
} from '../../../global/components/forms';
import { displayUtils, routeUtils, validationUtils } from "../../../global/utils";
import FileJotBlocks from '../../file/components/FileJotBlocks.js.jsx';
import QuickTaskSignatureForm from '../../quickTask/practice/components/QuickTaskSignatureForm.js.jsx';
import Modal from '../../../global/components/modals/Modal.js.jsx';
import { FeedbackMessage } from '../../../global/components/helpers/FeedbackMessage.js.jsx';

class ViewLinkConfigRequestSignature extends Binder {
  feedbackMessage = React.createRef();
  staffList = [];

  constructor(props) {
    super(props);
    this.state = {
      errorMessage: ''
      , hasError: false
      , firm: {}
      , client: {}
      , files: {}
      , folderId: null
      , addInstructions: false
      , authType: 'none'
      , authTypes: [
        { display: 'Direct Link', val: 'none' }
        , { display: 'Question/Answer', val: 'secret-question' }
      ]
      , expires: false
      , expireDate: DateTime.local().plus({days: 30}).toMillis()
      , instructions: '' // this will be saved on quickTask.prompt
      , password: ''
      , prompt: 'Please sign the attached document.'
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
      , recipients: []
      , submitting: false
      , receiveEmails: false
      , receivers: []
      , copySuccess: false
      , fileIds: []
      , allowMultiple: true
      , roleModal: null
      , isUploadFilesSubmit: false
      , listArgs: {}
      , uuid: ''
      , isOpen: false
      , updateLink: []
      , shareLink: null
      , quickTask: null
      , templates: []
      , selectedFile: {}
      , progress: {
        message: 'Waiting'
        , percent: 0
      }
      , showJotblocksModal: false
      , customeTemplate: { elements: [], signers: [] }
      , signers: []
      , fetching: false
      , templateId: ''
      , kbaEnabled: false
      , selectedClientId: null
      , duplicateEmail: false
      , _personal: null
      , selectedStaff: ''
      , receiverUrl: ''
      , key: {}
      , signerSigningOrderType: 'sequential'
      , receivers: [{  email: ''}]
    }
    this._bind(
      '_handleCustomTemplate'
      , '_close'
      , '_handleChange'
      , '_createSignatureQuickTask'
      , '_handleSignerChange'
      , '_handleTemplateChange'
      , '_handleJotblocksModal'
      , '_handleCheckInputChange'
      , '_getSignerList'
      , '_generateSignerInputs'
      , '_getTemplateById'
      , '_validateSignerArray'
      , '_handleCancelPostMessage'
      , '_handleErrorPostMessage'
      , '_deleteTempKey'
      , '_fetchParamsDetails'
      , '_handleRTEChange'
      , '_addRecipient'
      , '_removeRecipient'
    )

    const { socket } = this.props;
    socket.on('signature_progress', progress => {
      this.setState({ progress })
    });
  }

  componentDidMount() {
    const { match, dispatch, firmStore, socket } = this.props;

    console.log(window.location.href);

    const { file, files, vendorapitoken, firm, client, folder, receiverUrl } = queryString.parse(decodeURIComponent(window.location.search));

    const httpProtocol = window.appUrl.includes('localhost') ? 'http' : 'https';

    const url = `${httpProtocol}://${window.appUrl}/api/com/getKey/${vendorapitoken}`;
    console.log('request url', url);
    //get the key details
    axios({
      method: 'GET',
      url: url,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then((response) => {
      console.log('get key response', response);
      const responseData = response.data;

      const tempKey = !!responseData.key && responseData.status ? responseData.key : null;

      if(!!tempKey) {
        this._fetchParamsDetails(tempKey);
        this.setState({key: tempKey}, () => {
        })

        if(!!tempKey._folder) {
          this.setState({folderId: tempKey._folder});
        }
      } else {
        this.feedbackMessage.current.showError('Your token has already expired!');
        //alert('Your token has expired');
      }
    })

    if(!!receiverUrl) this.setState({ receiverUrl: receiverUrl });

    socket.on('connect', () => {
      // const uuid = uuidv4();
      // socket.emit('subscribe', uuid);
      // console.log('socket id - uuid', uuid);
      // this.setState({
      //   uuid
      // })
    })
  }

  _fetchParamsDetails(key) {
    const { dispatch } = this.props;
    const { vendorapitoken, folder } = queryString.parse(decodeURIComponent(window.location.search));

    const firm = key._firm;
    const client = key._client;
    const file = key.files && key.files.length > 0 ? key.files[0]: null;

    if(!!vendorapitoken) {
      console.log('get firm details');
      if(!!firm) {
        dispatch(firmActions.fetchSingleIfNeeded(firm)).then(response => {

          console.log('firm response', response);

          const selectedFirm = response.item;

          if(selectedFirm && selectedFirm._id) {

            dispatch(clientActions.fetchSingleIfNeeded(client)).then(response => {
              console.log('client response', response);

              this.setState({
                client: response.item,
                selectedClientId: response.item._id,
                hasError: false
              })
            })
            .catch(err => {
              console.log('failed to get client details');
              this.setState({hasError: true});
            })

            dispatch(fileActions.fetchListIfNeeded(...routeUtils.listArgsFromObject({
              '~firm': selectedFirm._id
              , _client: client
              , status: 'not-archived'
            }))).then(response => {
              const listFiles = response.list;

              console.log('listFiles', listFiles);
              
              const selectedFile = listFiles.filter(x => x._id == file)[0];

              console.log('selectedFile', selectedFile);

              if(!!selectedFile || selectedFile && selectedFile.fileExtension == '.pdf') {
                this.setState({ selectedFile }, () => { console.log('new state', this.state )})
              }
            })

            dispatch(clientUserActions.fetchListIfNeeded('_client', client));
            dispatch(userActions.fetchListIfNeeded('_client', client));

            dispatch(staffActions.fetchListIfNeeded('_firm', selectedFirm._id));
            dispatch(userActions.fetchListIfNeeded('_firmStaff', selectedFirm._id)); 

            if(selectedFirm.eSigAccess) {
              // Fetch all assuresign templates available to this firm.
              dispatch(firmActions.sendGetTemplates(selectedFirm._id)).then(templateRes => {
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

            const listArgs = routeUtils.listArgsFromObject({
              '~firm': selectedFirm._id
              , _client: client
              , status: 'not-archived'
            })

            this.setState({ listArgs });

            const defaultAuth = selectedFirm.authDefault == "QA" ? 'secret-question' : 'none';
            console.log("defaultAuth", defaultAuth);
            this.setState({authType: defaultAuth});
  
            if(selectedFirm.secretQuestions) {
              const cusSecretQuestions = typeof(selectedFirm.secretQuestions) === "string" ? JSON.parse(selectedFirm.secretQuestions) : selectedFirm.secretQuestions;
              console.log("cusSecretQuestions", typeof(selectedFirm.secretQuestions) === "string" , cusSecretQuestions)
      
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
            }
          } else {
            const {secretQuestions} = this.state;
            const other = {
              other: { display: 'Other', val: 'other', prompt: ''}
            }
            this.setState({secretQuestions: {...secretQuestions, ...other }});
          }

          this.setState({
            firm: selectedFirm,
            hasError: false
          })
        })
        .catch(err => {
          console.log('failed to get firm details');
          this.setState({hasError: true});
        })

      } else {
        console.log('firm not found');
        this.setState({hasError: true});
      }
    } else {
      console.log('apikey not found');
      this.setState({hasError: true});
    }
  }

  _getTemplateById() {
    const { dispatch } = this.props;
    const { templateId, firm } = this.state;
    const firmId = firm._id;
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

  _handleCustomTemplate(signers, customeTemplate) {
    if (signers && signers.length && customeTemplate && customeTemplate.signers && customeTemplate.signers.length && customeTemplate.elements && customeTemplate.elements.length) {
      if (this.state.kbaEnabled) {
        signers = signers.map(signer => {
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
      this.setState({ signers, customeTemplate, showJotblocksModal: false });    
    } else {
      this.setState({ templateId: null, showJotblocksModal: false });
    }
  }

  _close() {

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

  _handleChange(e, action = "") {
    const { socket, loggedInUser } = this.props;

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

    const isCustom = this.state.templateId === "custom";

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
      const val = e.target.value ? e.target.value.toString() : "";
      const _personal = val.includes("personal") ? val : null;
      const clientId = val.includes("personal") ? null : val;
      newState.clientId = clientId;
      newState._personal = _personal;
        // Reset signers array when the client changes.
      this.setState(newState, () => {
        if (!isCustom) {
          this._generateSignerInputs()
        }
      });
    } else {
      if(loggedInUser && loggedInUser._id) {
        socket.emit('subscribe', loggedInUser._id);
      } else 
      if(e.target.name == "selectedStaff") {
        socket.emit('subscribe', e.target.value);
      }
      this.setState(newState);
    }
  }

  _deleteTempKey() {
    const {
      key
    } = this.state;
    
    //delete the temp token after creation
    const httpProtocol = window.appUrl.includes('localhost') ? 'http' : 'https';

    const url = `${httpProtocol}://${window.appUrl}/api/com/deleteKey`;
    console.log('request url', url);
    //get the key details
    axios({
      method: 'POST',
      url: url,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        'token': key.token
      }
    })
    .then((response) => {
      console.log('get key response', response);        
      this.setState({key: {}}, () => {
        console.log('this.state', this.state);
      })
    })
  }

  _createSignatureQuickTask(e) {

    const { dispatch, clientStore } = this.props;

    const { 
      selectedFile
      , authType
      , password
      , targetLocation
      , _personal
      , kbaEnabled
      , secretQuestions
      , selectedQuestion
      , folderId
      , selectedStaff
      , firm
      , selectedClientId
      , key
      , prompt
      , receivers } = this.state;

    const selectedUser = this.staffList.filter(staff => staff.email == receivers[0].email)[0];

    console.log("this.staffList",this.staffList);
    console.log('receivers', receivers);
    console.log('selectedUser', selectedUser);

    if(e) {e.preventDefault()};

    if(!(selectedUser && selectedUser._id)) {
      this.feedbackMessage.current.showError('Unable to process the request. Please choose a recipient');
      return;
    }

    //check if match with temp key details
    if(!(key.type == 'request-signature')) {
      this.feedbackMessage.current.showError('Unable to process the request. Token is invalid');
      return;
    }

    if(authType == "secret-question") {
      const shareLinkSelectedQuestion = this.state.selectedQuestion
      const shareLinkPassword = password;

      if(!shareLinkSelectedQuestion || !shareLinkPassword) {
        console.log("shareLinkPrompt", shareLinkPrompt);
        console.log("shareLinkPassword", shareLinkPassword);
        this.feedbackMessage.current.showError('The secret question and the secret answer is missing.');
        return;
      }
    }

    this.setState({
      submitting: true
    })

    const shareLinkPassword = password;
    const shareLinkPrompt = secretQuestions[selectedQuestion] ? secretQuestions[selectedQuestion].prompt : null;

    const newShareLink = {
      _firm: this.state.firm._id
      , _client: this.state.selectedClientId
      , authType: authType // we are only checking for a matching email address. We may want to revisit to allow passwords etc...
      , _createdBy: selectedUser._user
      , password: authType !== "none" ? shareLinkPassword : ""
      , prompt: authType !== "none" ? shareLinkPrompt : ""
      , type: 'signature-request'
      , _folder: folderId
      , sentTo: receivers
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

          return signer;
        })

        // Put together a bit of a strange request body.
        const eSigRequest = {
          _client: this.state.selectedClientId
          , _firm: this.state.firm._id
          , type: 'signature'
          , _unsignedFiles: [selectedFile._id]
          , prompt: this.state.prompt
          , redirectUrl: shareLink.url
          , signers: updatedSigners
          , templateId: this.state.templateId
          , _createdBy: selectedUser._user
          , signerSigningOrderType: this.state.signerSigningOrderType
        }

        if (_personal) {
          eSigRequest._client = null;
        }

        if (this.state.templateId === "custom") {
          eSigRequest["customeTemplate"] = this.state.customeTemplate;
        }

        dispatch(quickTaskActions.sendCreateQuickTask(eSigRequest)).then(taskRes => {
          console.log('taskRes quicktask', taskRes);
          if(taskRes.success) {
            // Now update the sharelink with the quickTask id.
            shareLink._quickTask = taskRes.item._id

            let newFirm = this.state.firm;
            newFirm.tempApiKey = '';

            dispatch(firmActions.sendUpdateFirm(newFirm)).then(response => {});

            dispatch(shareLinkActions.sendUpdateShareLinkWithPermission(shareLink)).then(shareLinkRes => {
              this.setState({
                kbaEnabled: false
                , progress: {
                  message: "Waiting"
                  , percent: 0
                }
                , prompt: 'Please sign the attached document.'
                , quickTask: taskRes.item
                , selectedClientId: null
                , selectedTemplate: null
                , signers: []
                , submitting: false
                , templateId: null
              });
              if(shareLinkRes.success) {
                this._deleteTempKey();
                this.setState({
                  shareLink: shareLinkRes.item
                });
              } else {
                const feedbackMessageStr = taskRes && taskRes.error ? taskRes.error : 'Unable to create signature request. Please try again.';
                this.feedbackMessage.current.showError(feedbackMessageStr);
                this._handleErrorPostMessage();
              }
            })
          } else {
            const feedbackMessageStr = taskRes && taskRes.error ? taskRes.error : 'Unable to create signature request. Please try again.';
            this.feedbackMessage.current.showError(feedbackMessageStr)
            this._handleErrorPostMessage();
            this.setState({
              kbaEnabled: false
              , progress: {
                message: "Waiting"
                , percent: 0
              }
              , prompt: 'Please sign the attached document.'
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
        this._handleErrorPostMessage();
        const feedbackMessageStr = taskRes && taskRes.error ? taskRes.error : 'Unable to create signature request. Please try again.';
        this.feedbackMessage.current.showError(feedbackMessageStr)
        this.setState({
          kbaEnabled: false
          , progress: {
            message: "Waiting"
            , percent: 0
          }
          , prompt: 'Please sign the attached document.'
          , quickTask: taskRes.item
          , selectedClientId: null
          , selectedTemplate: null
          , signers: []
          , submitting: false
          , templateId: null
        })
      }
    })
  }

  _handleSignerChange(e) {
    const { addressStore, userStore } = this.props;
    const { kbaEnabled } = this.state;
 
    let newState = _.update(_.cloneDeep(this.state), e.target.name, (signer) => {
      const user = userStore.byId[e.target.value];
      let res = {};

      console.log('e.target.value', e.target.value);
      console.log('userStore', userStore);
      console.log('addressStore', addressStore);
      console.log('user', user);

      const userAddress = addressStore.byId[user && user._primaryAddress];
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

      console.log("res", res);
      return res;
    });
    this.setState(newState)
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

  _handleJotblocksModal() {
    const { signers, customeTemplate } = this.state;
    if (signers && signers.length && customeTemplate && customeTemplate.signers && customeTemplate.signers.length && customeTemplate.elements && customeTemplate.elements.length) {
      this.setState({ showJotblocksModal: !this.state.showJotblocksModal, errorMessage: "" });
    } else {
      this.setState({ templateId: null, showJotblocksModal: !this.state.showJotblocksModal, errorMessage: "" });
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

  _validateSignerArray() {
    const { signers } = this.state;
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

  _handleCancelPostMessage() {
    console.log('url', this.state.receiverUrl);

    parent.postMessage({
      action: 'cancel'
    }, '*')
  }

  _handleErrorPostMessage() {
    parent.postMessage({
      action: 'error'
    }, '*')
  }


  _handleRTEChange(value) {
    this.setState({prompt: value})
  }
  render() {

    const {
      shareLinkStore
      , userStore
      , match
      , staffStore
      , firmStore
    } = this.props;
    
    const {
      hasError
      , client
      , firm
      , authType
      , authTypes
      , password
      , sendEmails
      , recipients
      , progress
      , submitting
      , showJotblocksModal
      , selectedFile
      , templates
      , customeTemplate
      , kbaEnabled
      , selectedStaff
      , quickTask
      , shareLink
      , errorMessage
      , receivers
    } = this.state;

    const userListItems = client && client._id ? userStore.util.getList('_client', client._id) : null;
    const signerListItems = userListItems ? this._getSignerList(userListItems) : [];

    const selectedFirm = firmStore.selected.getItem();
    let staffListItems;
    let availableStaff;

    if(selectedFirm && selectedFirm._id) {
      staffListItems = staffStore.util.getList('_firm', selectedFirm._id);

      availableStaff = !staffListItems ? [] : staffListItems.flatMap(staff => {
        let item = staff;
        let fullName = userStore.byId[staff._user] ? `${userStore.byId[staff._user].firstname} ${userStore.byId[staff._user].lastname}` : '';
        let userName = userStore.byId[staff._user] ? userStore.byId[staff._user].username : '';
        item.displayName = `${fullName} | ${userName}`;
        item.fullName = fullName;
        item.userName = userName;
        item.email = userName;
        return staff && staff.status === "active" ? item : [];
      });

      this.staffList = staffListItems;
    }

    const confirmBtnClass = classNames(
      'yt-btn small',
      'info'
    )

    const linkBtnClass = classNames(
      'yt-btn small'
      , 'link'
      , 'info'
    )

    console.log('availableStaff', availableStaff);


    console.log('staffListItems', staffListItems);

    const selectedShareLink = shareLinkStore.selected.getItem();

    const elements = customeTemplate.elements ? customeTemplate.elements : [];

    const disabled = this.state.duplicateEmail || this.state.submitting || !this._validateSignerArray() || this.state.errorMessage;

    return (
      <LinkConfigLayout>
        <FeedbackMessage ref = {this.feedbackMessage} />
        <Helmet><title>Request Signature</title></Helmet>
        <div className="flex">
          <section className="section ">
            <div className="yt-container slim">
              <div className="yt-row center-horiz">
                <div className="yt-col _100">
                  <div className="card bordered profile-card">
                    <div className="card-header">
                      <div className="yt-row center-vert space-between">
                        Prepare document for e-signature
                      </div>
                    </div>
                    <div className="card-body">
                      {/* { errorMessage ?
                        <div className="yt-container" style={{padding: '2em 0'}}>
                          <div className="input-group">
                            <div className="-error-message -wrap-word">ERROR: {errorMessage}</div>
                          </div>
                        </div>
                        :
                        null
                      } */}
                      {
                        quickTask && shareLink ? 
                        <div>
                          <h4>Signature request created</h4>
                          <div className="yt-row -share-link-row center-vert">
                            <div className="-description">
                              <Link to={`/firm/${quickTask._firm}/workspaces/${quickTask._client}/quick-tasks/quick-view/${quickTask._id}`}>View it here</Link>  
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
                        </div>
                        :
                        <div>
                          <div className="-share-llink-configuration">
                            <div className="-body">
                              <div className="-setting yt-row space-between" style={{'display': 'block'}}>
                                {
                                  submitting ?
                                  // <div className="yt-container">
                                  //   <div className="yt-row center-horiz">
                                  //     <div style={{"width": "100%"}}>
                                  //       <ProgressBar
                                  //         progress={progress}
                                  //       />
                                  //     </div>
                                  //   </div>
                                  // </div>
                                  null
                                  :
                                  null
                                }
                                {
                                  <QuickTaskSignatureForm
                                    allowSharedEmail={this.state.signers && this.state.signers.length === 2}
                                    cancelLink={this._close}
                                    clientListItems={[]}
                                    disabled={disabled}
                                    handleFormChange={this._handleChange}
                                    handleFormSubmit={this._createSignatureQuickTask}
                                    handleSignerChange={this._handleSignerChange}
                                    handleTemplateChange={this._handleTemplateChange}
                                    prompt={this.state.prompt}
                                    selectedClient={this.state.client}
                                    selectedFile={this.state.selectedFile}
                                    signerListItems={signerListItems}
                                    signers={this.state.signers}
                                    submitting={submitting}
                                    templates={templates}
                                    templateId={this.state.templateId}
                                    authTypes={this.state.authTypes}
                                    authType={this.state.authType}
                                    secretQuestions={this.state.secretQuestions}
                                    selectedQuestion={this.state.selectedQuestion}
                                    password={this.state.password}
                                    handleJotblocksModal={this._handleJotblocksModal}
                                    elements={elements}
                                    match={match}
                                    userMap={userStore && userStore.byId ? userStore.byId : {}}
                                    kbaEnabled={kbaEnabled}
                                    handleCheckInputChange={this._handleCheckInputChange}
                                    staffListItems={availableStaff}
                                    selectedStaff={selectedStaff}
                                    isConfigScreenView={true}
                                    progress={progress}
                                    handleRTEChange={this._handleRTEChange}
                                    signerSigningOrderType={this.state.signerSigningOrderType}
                                    staffStore={staffStore}
                                    receivers={receivers}
                                    addRecipient={this._addRecipient}
                                    removeRecipient={this._removeRecipient}
                                  />
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                    {
                      quickTask && shareLink ? 
                      <div className="card-footer">
                        <div className="yt-row space-between">
                          <button
                            type="button"
                            className={linkBtnClass}
                            onClick={() => {}} 
                            style={{"visibility": "hidden"}}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className={confirmBtnClass}
                            onClick={this._handleCancelPostMessage} 
                            disabled={this.state.submitting}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                      :
                      <div className="card-footer">
                        <div className="yt-row space-between">
                          <button
                            type="button"
                            className={linkBtnClass}
                            onClick={this._handlePostMessage} 
                            style={{"visibility": "visible"}}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className={confirmBtnClass}
                            onClick={this._createSignatureQuickTask} 
                            disabled={this.state.submitting}
                          >
                            Prepare Request
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </section>
          <Modal
            cardSize={"jumbo_90"}
            closeAction={this._handleJotblocksModal}
            isOpen={showJotblocksModal}
            modalHeader={"Prepare document for e-signature > Setup custom template"}
            showButtons={false}
          >
            <FileJotBlocks
              selectedFile={selectedFile}
              handleCustomTemplate={this._handleCustomTemplate}
            />  
          </Modal>
        </div>
      </LinkConfigLayout>
    )
  }
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
   return {
    clientStore: store.client 
    , fileStore: store.file
    , firmStore: store.firm
    , shareLinkStore: store.shareLink
    , socket: store.user.socket
    , userStore: store.user
    , addressStore: store.address
    , staffStore: store.staff
    , loggedInUser: store.user.loggedIn.user 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ViewLinkConfigRequestSignature)
);