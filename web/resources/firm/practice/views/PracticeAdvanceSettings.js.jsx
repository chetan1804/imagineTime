/**
 * View component for /firm/:firmId/settings/advanced
 *
 * Displays firm's settings and lets the owner use edit them.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import _ from 'lodash'; 
import _uniqueId from 'lodash/uniqueId';
import { Helmet } from 'react-helmet';

// import actions
import * as firmActions from '../../firmActions';
import * as fileActions from '../../../file/fileActions'; 
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import ISReactDraftEditor from '../../../../global/components/forms/ISReactDraftEditor.js.jsx';
import { SelectFromObject, TextInput, ToggleSwitchInput } from '../../../../global/components/forms';
import {FeedbackMessage} from '../../../../global/components/helpers/FeedbackMessage.js.jsx';
import {LoadingBiscuit} from '../../../../global/components/helpers/LoadingBiscuit.js.jsx';

// import layout components
import PracticeFirmLayout from '../components/PracticeFirmLayout.js.jsx';

// import configuration
import brandingName from '../../../../global/enum/brandingName.js.jsx';

// import api utility
import apiUtils from '../../../../global/utils/api';

const API_GET_SETTINGS = (firmId) => {return `/api/firms/${firmId}/settings`};
const API_UPDATE_SETTINGS = (firmId) => {return `/api/firms/${firmId}/settings`};

class PracticeAdvanceSettings extends Binder {
  feedbackMessage = React.createRef();

  constructor(props) {
    super(props);
    this.state = {
      isInEditMode: false
      , savedSettings: {} // object containing the firm settings stored in the db to check if the state on the screen has changed or not
      , editedSettings: {}
      , archiveFile: null
      , expireLinks: null
      , authDefault: null
      , initialSecretQuestions: {}
      , secretQuestions: {}
      , newSecretQuestion: ''
      , counter: 0
      , allowCreateFolder: ''
      , allowDeleteFiles: ''
      , allowMoveFiles: ''
      , allowRenameFiles: ''
      , zipFilesDownload: ''
      , draggingStart: null
      , tcFileAccess: false
      , tcContents: ''
      , showNewLabel: true
      , showEmail: false
      , showCompany: false
      , fileVersionType: ''
      , default_file_status: ''
      , allowAddRecipientFileRequest: ''
      , enable_pdftron: ''
      , email_useLoggedInUserInfo: true
      , email_fromName: null
      , email_replyTo: null
      , isFetching: false
      , allowRequiredRecipient: ''
    }
    this._bind(
      'onInputElementChange'
      , 'onCancel'
      , 'onUpdate'
      , 'onAddSecretQuestion'
      , 'onDeleteSecretQuestion'
      , 'parseQuestions'
      , 'onRTEChange'
      , 'holdSettings'
    );

    this.selectedFirm = {};
  }

  componentDidMount() {
    console.log('componentDidMount')
    const { dispatch, match } = this.props;
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId))
    .then(firmRes => {
      if (firmRes.success && firmRes.item) {
        this.selectedFirm = _.cloneDeep(firmRes.item);
        console.log('Firm Name:', this.selectedFirm.name);
      }
    });
    /*
    .then(firmRes => {
      if (firmRes.success && firmRes.item) {
        this.selectedFirm = _.cloneDeep(firmRes.item);
        if(firmRes && firmRes.item && firmRes.item._file) {
          dispatch(fileActions.fetchSingleIfNeeded(firmRes.item._file)); 
        }
        if(firmRes && firmRes.item && firmRes.item.secretQuestions) {
          this._handleParseQuestions(firmRes.item);
        } else {
          this.setState(firmRes.item);
        }
      } else if (!firmRes.item) {
        dispatch(firmActions.fetchSingleFirmById(match.params.firmId)).then(firmRes => {
          if (firmRes.success && firmRes.item) {
            this.selectedFirm = _.cloneDeep(firmRes.item);
            if(firmRes && firmRes.item && firmRes.item._file) {
              dispatch(fileActions.fetchSingleIfNeeded(firmRes.item._file)); 
            }
            if(firmRes && firmRes.item && firmRes.item.secretQuestions) {
              this._handleParseQuestions(firmRes.item);
            } else {
              this.setState(firmRes.item);
            }
          }
        });
      }
    })*/
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches clientUser/contacts 
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
    this.setState({isFetching: true}, () => {
      apiUtils.callAPI(API_GET_SETTINGS(match.params.firmId), 'GET')
      .then(json => {
        console.log('json', json);
        this.setState({isFetching: false}, () => {
          if(json.success === true) {
            const firmSettings = json.firmSettings;
            const secretQuestions = this.parseQuestions(firmSettings.secretQuestions);
            this.holdSettings(firmSettings, secretQuestions);
          }
          else {
            console.log('GetSettings - Error:', json.message)
            console.log('feedbackMessage:', this.feedbackMessage);
            this.feedbackMessage.current.showError(json.message);
          }
        });
      })
      .catch(err => {
        this.setState({isFetching: false});
        console.log('GetSettings - Error2:', err);
        console.log('feedbackMessage:', this.feedbackMessage);
        this.feedbackMessage.current.showError(err);
      });
    });
  }

  holdSettings(firmSettings, secretQuestions) {
    const firmName = this.selectedFirm.name;
    this.setState({
      isInEditMode: false
      , archiveFile: firmSettings.archiveFile
      , expireLinks: firmSettings.expireLinks
      , authDefault: firmSettings.authDefault
      , initialSecretQuestions: _.cloneDeep(secretQuestions)
      , secretQuestions: secretQuestions
      , allowCreateFolder: firmSettings.allowCreateFolder
      , allowDeleteFiles: firmSettings.allowDeleteFiles
      , allowMoveFiles: firmSettings.allowMoveFiles
      , allowRenameFiles: firmSettings.allowRenameFiles
      , zipFilesDownload: firmSettings.zipFilesDownload
      , tcFileAccess: firmSettings.tcFileAccess
      , tcContents: firmSettings.tcContents
      , showNewLabel: firmSettings.showNewLabel
      , showEmail: firmSettings.showEmail
      , showCompany: firmSettings.showCompany
      , fileVersionType: firmSettings.fileVersionType
      , default_file_status: firmSettings.default_file_status
      , allowAddRecipientFileRequest: firmSettings.allowAddRecipientFileRequest
      , enable_pdftron: firmSettings.enable_pdftron
      , email_useLoggedInUserInfo: firmSettings.email_useLoggedInUserInfo
      , email_fromName: (firmSettings.email_fromName ? firmSettings.email_fromName : firmName)
      , email_replyTo: firmSettings.email_replyTo
      , savedSettings: firmSettings
      , allowRequiredRecipient: firmSettings.allowRequiredRecipient
    });
  }

  onInputElementChange(e) {
    let val;

    //console.log('name', e.target.name);
    //console.log('value', e.target.value);

    if (e.target.name == 'zipFilesDownload') {
      val = e.target.value.toString() == 'true';
    } else {
      val = e.target.value;
    }
    
    let newState = _.update( this.state, e.target.name, function() {
      return val;
    });
    //console.log('value 1', val);
    //console.log('newState', newState);
    this.setState({newState});
  }

  onCancel() {
    const savedSettings = _.cloneDeep(this.state.savedSettings);
    //console.log('current Settings:', savedSettings);
    const secretQuestions = this.parseQuestions(savedSettings.secretQuestions);
    this.setState({isInEditMode: false, secretQuestions});
  }

  parseQuestions(secretQuestions) {
    //console.log('secretQuestions:', secretQuestions);
    secretQuestions = !!secretQuestions ? secretQuestions: "{}";
    const tempSQs = typeof(secretQuestions) === 'string' ? JSON.parse(secretQuestions) : secretQuestions;
    let newSQs = {};
    for(const [key, value] of Object.entries(tempSQs)) {
      const uid = _uniqueId('ssn');
      const sq = {
        display: value.display,
        prompt: value.prompt,
        val: uid
      }
      newSQs = {...newSQs, [uid]: sq};
    }
    return newSQs;
    //savedSettings.secretQuestions = newSQs;
    //this.setState({savedSettings});
  }

  onAddSecretQuestion() {
    const {secretQuestions, newSecretQuestion, counter} = this.state;
    const newId = _uniqueId(`ssn`);

    if(!newSecretQuestion) return;

    if(!secretQuestions[newId]) {
      console.log('nothing hill');
      const questionsContent = {
        display: newSecretQuestion,
        prompt: newSecretQuestion,
        val: newId
      }
      this.setState({secretQuestions: {...secretQuestions, [newId]: questionsContent}, newSecretQuestion:''})
    }
  }
  
  onDeleteSecretQuestion(id) {
    console.log(id);

    let updatedSq = this.state.secretQuestions;
    if(updatedSq[id]) delete updatedSq[id];
    console.log('updatedSq', updatedSq);
    this.setState({secretQuestions: updatedSq});
  }

  onUpdate() {
    let updatedSettings = _.cloneDeep(this.state.savedSettings);
    const { 
      tcContents
      , tcFileAccess
      , archiveFile
      , expireLinks
      , authDefault
      , secretQuestions
      , allowCreateFolder
      , allowDeleteFiles
      , allowMoveFiles
      , allowRenameFiles
      , zipFilesDownload
      , fileVersionType
      , showNewLabel
      , showEmail
      , showCompany
      , default_file_status
      , allowAddRecipientFileRequest
      , enable_pdftron
      , email_useLoggedInUserInfo
      , email_fromName
      , email_replyTo
      , allowRequiredRecipient
    } = this.state;

    updatedSettings.archiveFile = archiveFile == 0 ? 'None' : isNaN(archiveFile) ? 'None' : archiveFile;
    updatedSettings.expireLinks = expireLinks == 0 ? 'None' : isNaN(expireLinks) ? 'None' : expireLinks;
    updatedSettings.authDefault = authDefault ? authDefault : updatedSettings.authDefault;
    updatedSettings.secretQuestions = JSON.stringify(secretQuestions);
    updatedSettings.allowCreateFolder = allowCreateFolder;
    updatedSettings.allowDeleteFiles = allowDeleteFiles;
    updatedSettings.allowMoveFiles = allowMoveFiles;
    updatedSettings.allowRenameFiles = allowRenameFiles;
    updatedSettings.zipFilesDownload = zipFilesDownload;
    updatedSettings.fileVersionType = fileVersionType;
    updatedSettings.tcContents = tcContents;
    updatedSettings.tcFileAccess = tcFileAccess;
    updatedSettings.showNewLabel = showNewLabel;
    updatedSettings.showEmail = showEmail;
    updatedSettings.showCompany = showCompany;
    updatedSettings.default_file_status = default_file_status;
    updatedSettings.allowAddRecipientFileRequest = allowAddRecipientFileRequest;
    updatedSettings.enable_pdftron = enable_pdftron;
    updatedSettings.email_useLoggedInUserInfo = email_useLoggedInUserInfo;
    updatedSettings.email_fromName = (email_useLoggedInUserInfo ? '' : email_fromName);
    updatedSettings.email_replyTo = (email_useLoggedInUserInfo ? '' : email_replyTo);
    updatedSettings.allowRequiredRecipient = allowRequiredRecipient;

    this.setState({isFetching: true}, () => {
      apiUtils.callAPI(API_UPDATE_SETTINGS(this.props.match.params.firmId), 'PUT', updatedSettings)
      .then(json => {
        this.setState({isFetching: false}, () => {
          if(json.success === true) {
            const firmSettings = json.firmSettings;
            const secretQuestions = this.parseQuestions(firmSettings.secretQuestions);
            this.holdSettings(firmSettings, secretQuestions);
            this.feedbackMessage.current.showSuccess('Firm advance settings updated successfully.');
          }
          else {
            console.log('GetSettings - Error:', json.message)
            console.log('feedbackMessage:', this.feedbackMessage);
            this.feedbackMessage.current.showError(json.message);
          }
        });
      })
      .catch(err => {
        this.setState({isFetching: false});
        console.log('GetSettings - Error2:', err);
        console.log('feedbackMessage:', this.feedbackMessage);
        this.feedbackMessage.current.showError(err);
      });
    });
  }

  onRTEChange(value) {
    console.log('tcContents', value);
    this.setState({tcContents: value});
  }

  onDragStart = (ev, type, data) => {
    if (type === 'sq') {
      const newData = JSON.stringify(data);
      ev.dataTransfer.setData('sq', newData);
      if (document.querySelector(`.-sq-index-${data.id}`)) {
        ev.dataTransfer.setDragImage(document.querySelector(`.-sq-index-${data.id}`), 20, 20);
    }
      this.setState({ draggingStart: data.id })
    }
  }

  onDragOver = (ev) => {
      ev.preventDefault();
  }

  onDrop = (ev, type, data) => {
      /**
       * name and swap variable is the index of signers state
       */

      const { secretQuestions, isInEditMode } = this.state;
      if (type === 'sq' && isInEditMode && secretQuestions) {

        let oldData = ev.dataTransfer.getData('sq');
        oldData = JSON.parse(oldData);
        const tmp = _.cloneDeep(data);

        data.id = oldData.id;
        data.val = oldData.val;
        oldData.id = tmp.id;
        oldData.val = tmp.val;

        secretQuestions[tmp.id] = oldData;
        secretQuestions[data.id] = data;

        this.setState({ secretQuestions, draggingStart: null });
      }
  }

  render() {
    const { 
      firmStore 
      , staffStore 
      , match
    } = this.props;

    const { 
      isInEditMode
      , savedSettings
      , archiveFile
      , expireLinks
      , authDefault
      , allowCreateFolder
      , allowDeleteFiles
      , allowMoveFiles
      , allowRenameFiles
      , initialSecretQuestions
      , newSecretQuestion
      , secretQuestions
      , zipFilesDownload
      , draggingStart
      , tcFileAccess
      , tcContents
      , showNewLabel
      , showEmail
      , showCompany
      , fileVersionType
      , default_file_status
      , allowAddRecipientFileRequest
      , enable_pdftron
      , email_useLoggedInUserInfo
      , email_fromName
      , email_replyTo
      , allowRequiredRecipient
    } = this.state;

    const isEmpty = (
      !savedSettings
      || !savedSettings._firm
    );

    const isFetching = (
      firmStore.selected.isFetching
    )

    const sqArray = [];
    for(const [key, value] of Object.entries(secretQuestions)) {
      const sq = {
        display: value.display,
        prompt: value.prompt,
        val: key,
        id: key
      }
      sqArray.push(sq);
    }
    //console.log('secretQuestions', secretQuestions, sqArray)

    const keyAuthOptions = [
      { value: 'Direct', name: 'Direct' }
      , { value: 'QA', name: 'Question and Answer' }
    ]
    const filesDownloadOptions = [
      { value: false, name: 'Individual files' }
      , { value: true, name: '.zip files' }
    ];
    const fileVersionOptions = [
      { value: 'disable', name: 'Disable file versioning' }
      , { value: 'enable', name: 'Enable file versioning' }
    ];

    const fileStatus = [
      {
        value: 'hidden', name: 'Hidden'
      },
      {
        value: 'visible', name:'Visible'
      },
    ]

    return (
      <PracticeFirmLayout>
        <FeedbackMessage ref = {this.feedbackMessage} />
        <LoadingBiscuit isVisible={isFetching} />
        <Helmet><title>Firm Settings</title></Helmet>
        { isEmpty ?
            <div className='-loading-hero hero'>
              <div className='u-centerText'>
                <div className='loading'></div>
              </div>
            </div> 
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className='yt-row '>
              <div className='yt-col'>
                <div className='-practice-content'>
                  <div className={`-advance-setting-form ${isInEditMode ? '-update-form' : '-display-form'}`}>

                    <div className='box'>
                      <div className='heading'>Files</div>

                      <div className='space-between'>
                        <div>
                          <div>Enable PDF Editing (using PDFtron)?</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            {enable_pdftron ? 'Yes' : 'No'}
                          </div>
                          <div className='-to-update'>
                            <ToggleSwitchInput
                              name=''
                              change={() => this.setState({ enable_pdftron: !enable_pdftron })}
                              rounded={true}
                              value={enable_pdftron}
                            />
                          </div>
                        </div>
                      </div>

                      <div className='space-between'>
                        <div>
                          <div>Default Status of Newly Uploaded Files</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            {!!default_file_status ? fileStatus.filter(a => a.value === default_file_status)[0].name : fileStatus[1].name}
                          </div>
                          <div className='-to-update'>
                            <SelectFromObject
                              change={this.onInputElementChange}
                              name='default_file_status'
                              items={fileStatus}
                              placeholder='Select default file upload status...'
                              required={false}
                              value='value'
                              selected={default_file_status}
                              display='name'
                              // helpText='Help: explain the changes of action, right here...'
                            />
                          </div>
                        </div>
                      </div>

                      <div className='space-between'>
                        <div>
                          <div>File Versioning</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            {savedSettings ? fileVersionOptions.filter(a => a.value === savedSettings.fileVersionType)[0].name : null}
                          </div>
                          <div className='-to-update'>
                            <SelectFromObject
                              change={this.onInputElementChange}
                              name='fileVersionType'
                              items={fileVersionOptions}
                              placeholder=''
                              required={false}
                              value='value'
                              selected={fileVersionType}
                              display='name'
                              helpText='Help: explain the changes of action, right here...'
                            />
                          </div>
                        </div>
                      </div>

                      <div className='space-between'>
                        <div>
                          <div>Show 'New' Label on the Newly Uploaded Files?</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            {showNewLabel ? 'Yes' : 'No'}
                          </div>
                          <div className='-to-update'>
                            <ToggleSwitchInput
                              name=''
                              change={() => this.setState({ showNewLabel: !showNewLabel })}
                              rounded={true}
                              value={showNewLabel}
                            />
                          </div>
                        </div>
                      </div>

                      <div className='space-between'>
                        <div>
                          <div>Archive Files Automatically after (Days)</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            {archiveFile}
                          </div>
                          <div className='-to-update'>
                            <TextInput
                              change={this.onInputElementChange}
                              label=''
                              helpText='Enter number per day (0 or blank is equivalent to "None")'
                              name='archiveFile'
                              required={false}
                              value={isNaN(archiveFile) ? '0' : archiveFile}
                            />
                          </div>
                        </div>
                      </div>

                      <div className='space-between'>
                        <div>
                          <div>Download Multiple Files as</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            { savedSettings ? filesDownloadOptions.filter(a => a.value === savedSettings.zipFilesDownload)[0].name : null}
                          </div>
                          <div className='-to-update'>
                            <SelectFromObject
                              change={this.onInputElementChange}
                              name='zipFilesDownload'
                              items={filesDownloadOptions}
                              placeholder=''
                              required={false}
                              value='value'
                              selected={zipFilesDownload.toString()}
                              display='name'
                            />
                          </div>
                        </div>
                      </div>

                    </div>

                    <div className='box'>
                      <div className='heading'>Links</div>

                      <div className='space-between'>
                        <div>
                          <div>Show Terms & Conditions Option on Sharefiles Link Creation?</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            {tcFileAccess ? 'Yes' : 'No'}
                          </div>
                          <div className='-to-update'>
                            <ToggleSwitchInput
                              name=''
                              change={() => this.setState({ tcFileAccess: !tcFileAccess })}
                              rounded={true}
                              value={tcFileAccess}
                            />
                            {
                              isInEditMode &&
                              <ISReactDraftEditor
                                onChange={this.onRTEChange}
                                defaultValue={this.state.tcContents}
                                title={'Terms and Conditions'}
                              />
                            }
  
                          </div>
                        </div>
                      </div>

                      <div className='space-between'>
                        <div>
                          <div>Show Email Address Input for Guest Users on Request Link?</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            {showEmail ? 'Yes' : 'No'}
                          </div>
                          <div className='-to-update'>
                            <ToggleSwitchInput
                              name=''
                              change={() => this.setState({ showEmail: !showEmail })}
                              rounded={true}
                              value={showEmail}
                            />

                          </div>
                        </div>
                      </div>

                      <div className='space-between'>
                        <div>
                          <div>Show Company Name Input for Guest Users on Request Link?</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                              {showCompany ? 'Yes' : 'No'}
                          </div>
                          <div className='-to-update'>
                            <ToggleSwitchInput
                              name=''
                              change={() => this.setState({ showCompany: !showCompany })}
                              rounded={true}
                              value={showCompany}
                            />

                          </div>
                        </div>
                      </div>

                      <div className='space-between'>
                        <div>
                          <div>Allow the User to Add a Recipient in the File Request Link?</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            {allowAddRecipientFileRequest ? 'Yes' : 'No'}
                          </div>
                          <div className='-to-update'>
                            <ToggleSwitchInput
                              name=''
                              change={() => this.setState({ allowAddRecipientFileRequest: !allowAddRecipientFileRequest })}
                              rounded={true}
                              value={allowAddRecipientFileRequest}
                            />
                          </div>
                        </div>
                      </div>

                      <div className='space-between'>
                        <div>
                          <div>Make recipient required in Request Link?</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            {allowRequiredRecipient ? 'Yes' : 'No'}
                          </div>
                          <div className='-to-update'>
                            <ToggleSwitchInput
                              name=''
                              change={() => this.setState({ allowRequiredRecipient: !allowRequiredRecipient })}
                              rounded={true}
                              value={allowRequiredRecipient}
                            />
                          </div>
                        </div>
                      </div>

                      <div className='space-between'>
                        <div>
                          <div>Expire Links Automatically after (Days)</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            {expireLinks}
                          </div>
                          <div className='-to-update'>
                            <TextInput
                              change={this.onInputElementChange}
                              label=''
                              helpText='Enter number per day (0 or blank is equivalent to "None")'
                              name='expireLinks'
                              required={false}
                              value={isNaN(expireLinks) ? '0' : expireLinks}
                            />
                          </div>
                        </div>
                      </div>

                      <div className='space-between'>
                        <div>
                          <div>Default Authentication Scheme for Links</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            { savedSettings ? authDefault === 'QA' ? 'Question and Answer' : authDefault : null}
                          </div>
                          <div className='-to-update'>
                            <SelectFromObject
                              change={this.onInputElementChange}
                              name='authDefault'
                              items={keyAuthOptions}
                              placeholder=''
                              required={false}
                              value='value'
                              selected={authDefault}
                              display='name'
                            />
                          </div>
                        </div>
                      </div>

                      {
                        isInEditMode &&  (
                          <div class='space-between'>
                            <TextInput
                              autoComplete='off'
                              change={this.onInputElementChange}
                              label='Secret Question'
                              name='newSecretQuestion'
                              required={false}
                              value={newSecretQuestion}
                            />
                            <div>
                              <div>
                                <div></div>
                                <button className='yt-btn x-small info' onClick={this.onAddSecretQuestion} disabled={false}>
                                  Add Secret Question
                                </button>
                              </div>
                            </div>
                          </div>
                        ) 
                      }
                      <table style={{marginTop: '10px', display: 'inline-grid', padding: '0px 20px' }} className='yt-table firm-table -workspace-table -auto-width'>
                        <thead>
                            <th></th>
                            <th style={{paddingLeft: '0'}}>List of Questions</th>
                            { isInEditMode ? <th></th> : null }
                        </thead>
                        <tbody>
                          {
                            sqArray.map((item, i) => 
                              <tr key={item.id} style={{ borderBottom: 'none' }}>
                                {
                                  isInEditMode ? 
                                  <td style={{ minWidth: '35px' }}
                                    draggable={isInEditMode}
                                    onDragOver={(e)=>this.onDragOver(e)}
                                    onDrop={(e)=>this.onDrop(e, 'sq', item)}
                                    onDragStart={(e) => this.onDragStart(e, 'sq', item)}>
                                    <div style={isInEditMode && draggingStart && draggingStart != item.id ? { color: 'rgb(83 205 240)' } : {}}>
                                      <i className='far fa-long-arrow-alt-up'></i>
                                      <i className='far fa-long-arrow-alt-down'></i>
                                    </div>
                                  </td>
                                  : <td></td>
                                }
                                <td style={{ paddingLeft: '0', width: '100%' }}
                                  className={`-sq-index-${item.id}`}
                                  draggable={isInEditMode}
                                  onDragOver={(e)=>this.onDragOver(e)}
                                  onDrop={(e)=>this.onDrop(e, 'sq', item)}
                                  onDragStart={(e) => this.onDragStart(e, 'sq', item)}>
                                    {`${i+1}. ${item.display}`} 
                                </td>
                                {
                                  isInEditMode ?
                                  <td>
                                        <button className='yt-btn link x-small danger' onClick={(e) => {
                                          this.onDeleteSecretQuestion(item.id);
                                        }}>
                                          Delete
                                        </button>
                                  </td>
                                  :
                                  null
                                }
                              </tr>
                            )
                          }
                        </tbody>
                      </table>

                    </div>

                    <div className='box'>
                      <div className='heading'>Client User</div>

                      <div className='space-between'>
                        <div>
                          <div>Allow Clients to Create New Folders?</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            {allowCreateFolder ? 'Yes' : 'No'}
                          </div>
                          <div className='-to-update'>
                            <ToggleSwitchInput
                              name=''
                              change={() => this.setState({ allowCreateFolder: !allowCreateFolder })}
                              rounded={true}
                              value={allowCreateFolder}
                            />
                          </div>
                        </div>
                      </div>

                      <div className='space-between'>
                        <div>
                          <div>Allow Clients to Delete Files?</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            {allowDeleteFiles ? 'Yes' : 'No'}
                          </div>
                          <div className='-to-update'>
                            <ToggleSwitchInput
                              name=''
                              change={() => this.setState({ allowDeleteFiles: !allowDeleteFiles })}
                              rounded={true}
                              value={allowDeleteFiles}
                            />
                          </div>
                        </div>
                      </div>

                      <div className='space-between'>
                        <div>
                          <div>Allow Clients to Rename Files?</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            {allowRenameFiles ? 'Yes' : 'No'}
                          </div>
                          <div className='-to-update'>
                            <ToggleSwitchInput
                              name=''
                              change={() => this.setState({ allowRenameFiles: !allowRenameFiles })}
                              rounded={true}
                              value={allowRenameFiles}
                            />
                          </div>
                        </div>
                      </div>

                      <div className='space-between'>
                        <div>
                          <div>Allow Clients to Move Files?</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            {allowMoveFiles ? 'Yes' : 'No'}
                          </div>
                          <div className='-to-update'>
                            <ToggleSwitchInput
                              name=''
                              change={() => this.setState({ allowMoveFiles: !allowMoveFiles })}
                              rounded={true}
                              value={allowMoveFiles}
                            />
                          </div>
                        </div>
                      </div>

                    </div>

                    <div className='box'>
                      <div className='heading'>Email Personalization</div>

                      <div className='space-between'>
                        <div>
                          <div>Use Logged-In User Name & Email Address?</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            {email_useLoggedInUserInfo ? 'Yes' : 'Use the following information instead:'}
                          </div>
                          <div className='-to-update'>
                            <ToggleSwitchInput
                              name=''
                              change={() => this.setState({ email_useLoggedInUserInfo: !email_useLoggedInUserInfo })}
                              rounded={true}
                              value={email_useLoggedInUserInfo}
                            />
                          </div>
                        </div>
                      </div>
                      {!email_useLoggedInUserInfo ?
                      <div className='space-between'>
                        <div>
                          <div>From Name</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            {email_fromName}
                          </div>
                          <div className='-to-update'>
                            <TextInput
                              change={this.onInputElementChange}
                              label=''
                              helpText='Name to be shown to the recipients before the "From" email address'
                              name='email_fromName'
                              required={!email_useLoggedInUserInfo}
                              value={!!email_fromName ? email_fromName : ''}
                            />
                          </div>
                        </div>
                      </div>
                      : null
                      }

                      {!email_useLoggedInUserInfo ?
                      <div className='space-between'>
                        <div>
                          <div>Reply-To Email Address</div>
                          <div className='-to-display'>
                            <i class='fal fa-angle-right'></i>
                            {email_replyTo}
                          </div>
                          <div className='-to-update'>
                            <TextInput
                              change={this.onInputElementChange}
                              label=''
                              helpText={`Email address to receive emails in, from the clients when they reply to emails generated by ${brandingName.title}`}
                              name='email_replyTo'
                              required={!email_useLoggedInUserInfo}
                              value={!!email_replyTo ? email_replyTo : ''}
                            />
                          </div>
                        </div>
                      </div>
                      : null
                      }

                    </div>


                    <div style={{display: 'block'}}>
                      <button className='yt-btn x-small success -to-display' onClick={() => this.setState({ isInEditMode: true })}>Edit</button>
                      <button className='yt-btn x-small link -to-update' onClick={this.onCancel} style={{ marginRight: 20 }}>Cancel</button>
                      <button
                          className='yt-btn x-small success -to-update' 
                          disabled={
                            (archiveFile == (savedSettings ? savedSettings.archiveFile : 'None')) && 
                            (expireLinks ===  (savedSettings ? savedSettings.expireLinks : 'None')) &&
                            (authDefault === (savedSettings ? savedSettings.authDefault : 'Direct')) && 
                            !((authDefault != 'Direct') && JSON.stringify(secretQuestions).length != savedSettings.secretQuestions.length) && 
                            allowCreateFolder === (savedSettings ? savedSettings.allowCreateFolder : false) && 
                            allowDeleteFiles === (savedSettings ? savedSettings.allowDeleteFiles : false) &&
                            zipFilesDownload === (savedSettings ? savedSettings.zipFilesDownload : false) &&
                            allowMoveFiles === (savedSettings ? savedSettings.allowMoveFiles : false) &&
                            allowRenameFiles === (savedSettings ? savedSettings.allowRenameFiles : false) &&
                            tcFileAccess === (savedSettings ? savedSettings.tcFileAccess : false) &&
                            tcContents === (savedSettings ? savedSettings.tcContents : false) && 
                            showNewLabel === (savedSettings ? savedSettings.showNewLabel : true) &&
                            showEmail === (savedSettings ? savedSettings.showEmail : true) &&
                            showCompany === (savedSettings ? savedSettings.showCompany : true) &&
                            fileVersionType === (savedSettings ? savedSettings.fileVersionType : false) &&
                            default_file_status === (savedSettings ? savedSettings.default_file_status : false) &&
                            allowAddRecipientFileRequest === (savedSettings ? savedSettings.allowAddRecipientFileRequest : false) &&
                            enable_pdftron === (savedSettings ? savedSettings.enable_pdftron : false) &&
                            email_useLoggedInUserInfo === (savedSettings ? savedSettings.email_useLoggedInUserInfo : true) &&
                            email_fromName === (savedSettings ? savedSettings.email_fromName : null) &&
                            email_replyTo === (savedSettings ? savedSettings.email_replyTo : null) &&
                            _.isEqual(initialSecretQuestions, secretQuestions) &&
                            allowRequiredRecipient === (savedSettings ? savedSettings.allowRequiredRecipient : false)
                          }
                          onClick={this.onUpdate}
                      >
                      Update
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </PracticeFirmLayout>
    )
  }
}

PracticeAdvanceSettings.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    firmStore: store.firm
    , staffStore: store.staff 
    , userStore: store.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeAdvanceSettings)
);