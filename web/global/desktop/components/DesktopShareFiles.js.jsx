/* global Office:false */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import _ from 'lodash';
import classNames from 'classnames';
import { DateTime } from 'luxon';

import DesktopLoading from './DesktopLoading.js.jsx';

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

import FileDeliveryListItem from '../../../resources/file/components/FileDeliveryListItem.js.jsx';

import { displayUtils } from '../../utils';

class DesktopShareFiles extends Binder {
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
      , shareLink: null
      , submitting: false
      , showTermsConditions: false
    };

    this._bind(
      '_copyToClipboard',
      '_handleClose',
      '_handleCreateShareLink',
      '_handleFormChange',
      '_handleRemoveFile'
    );
  }

  componentDidMount() {
    const { clientStore, dispatch, userStore, selectedFirm} = this.props;
    const { clientId } = this.state;
    const selectedClient = clientStore.byId[clientId]

    console.log("selectedFirm", selectedFirm);

    let authTypes = [
      { display: 'Direct Link', val: 'none' }
      , { display: 'Question/Answer', val: 'secret-question' }
    ]

    // If there is a client and that client has a secret question add that option to the list.
    if(selectedClient) {
      if(selectedClient.sharedSecretPrompt) {
        authTypes.push({ display: `${selectedClient.name} - Secret Question`, val: 'shared-client-secret' })
      }
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
          // Add an option to the authTypes list for client user secret questions
          // Add the list of clientUsers that have a secret question so we can populate the dropdown.
          if(userSecretQuestionList && userSecretQuestionList.length > 0) {
            authTypes.push({ display: 'Specific Contact\'s Secret Question', val: 'shared-contact-secret' })
          }
          this.setState({
            authTypes
            , userSecretQuestionList
          })
        } else {
          alert("There was a problem fetching client information. Please try again.")
        }
      })
    } else {
      this.setState({
        authTypes
      })
    }

    if(selectedFirm) {
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

  _copyToClipboard = e => {
    this.linkInput.select();
    document.execCommand('copy');
    this.setState({copySuccess: true});
  };

  _handleCreateShareLink() {
    const {
      clientStore
      , userStore
      , dispatch
      , selectedFirm
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
      , showTermsConditions
    } = this.state;

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

    //const shareLinkPrompt = secretQuestions[selectedQuestion] ? secretQuestions[selectedQuestion].prompt : "";

    const shareLinkPrompt = (
      authType === 'shared-client-secret' ?
      clientStore.byId[clientId] ? clientStore.byId[clientId].sharedSecretPrompt : ""
      :
      authType === 'shared-contact-secret' ?
      userStore.byId[userId] ? userStore.byId[userId].sharedSecretPrompt : ""
      :
      authType === 'secret-question' ?
      this.state.secretQuestions[this.state.selectedQuestion].prompt
      :
      prompt
    )

    dispatch(
      shareLinkActions.sendCreateShareLink({
        _client: clientId
        , _firm: selectedFirm._id
        , _files: fileIds
        , authType
        , expireDate: expires ? new Date(expireDate) : null
        , password: shareLinkPassword
        , prompt: shareLinkPrompt
        , type: 'share'
        , showTermsConditions: showTermsConditions
      })
    ).then((response) => {
      this.setState({
        authType: 'none'
        , authTypes: [
          { display: 'Direct Link', val: 'none' }
          , { display: 'Question/Answer', val: 'secret-question' }
        ]
        , userId: null
        , fileIds: []
        , password: ''
        , prompt: ''
        , submitting: false
        , selectedQuestion: 'dssn'
      });

      if (response.success) {
        console.log("done")
        this.setState({
          shareLink: response.item 
        })
      } else {
        this.setState({
          errorMessage: 'Error code 505 - Unable to create share link. Please try again.',
        });
      }
    });
  }

  _handleFormChange(e) {
    const newState = _.update(this.state, e.target.name, () => e.target.value);

    this.setState(newState);
  }

  _handleClose() {
    const { dispatch, history, location: { state: { uploadedFileIds } } } = this.props;

    dispatch(shareLinkActions.invalidateSelected());

    this.setState({
      authType: 'none'
      , authTypes: [
        { display: 'Direct Link', val: 'none' }
        , { display: 'Question/Answer', val: 'secret-question' }
      ]
      , userId: null
      , errorMessage: null
      , expires: false
      , expireDate: DateTime.local().plus({ days: 30 }).toMillis()
      , fileIds: uploadedFileIds || []
      , password: ''
      , prompt: ''
      , submitting: false
      , selectedQuestion: 'dssn'
    });

    history.replace('/'); // go all the way back to actions
  }

  _handleRemoveFile(fileId) {
    const newFiles = this.state.fileIds;
    const index = newFiles.indexOf(fileId);
    newFiles.splice(index, 1);
    this.setState({ fileIds: newFiles });
  }

  render() {
    const { clientStore, fileStore, selectedFirm, shareLinkStore } = this.props;
    const {
      authType
      , clientId
      , errorMessage
      , expires
      , expireDate
      , fileIds
      , password
      , prompt
      , submitting
    } = this.state;

    const selectedClient = clientId ? clientStore.byId[clientId] : null;

    const linkClass = classNames(
      "-copyable-share-link" 
      , { '-visible': this.state.copySuccess }
    )

    const promptClass = classNames(
      "-prompt" 
      , { '-hidden': this.state.copySuccess }
    )

    if (shareLinkStore.selected.isFetching) {
      return (<DesktopLoading />);
    }

    return (
      <div>
        <h2>{selectedClient ? `Share files associated with ${selectedClient.name}`: 'Share files'}</h2>
        <hr />
        <br />
        {errorMessage && (
          <div className="input-group">
            <div className="-error-message">{errorMessage}</div>
          </div>
        )}
        { !this.state.shareLink ? 

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
                    allowRemove
                  />
                ))}
              </div>
            </div>
            <div className="-share-link-configuration">
              <div className="-header">
                <i className="fas fa-eye" style={{ marginRight: '8px' }} /> Link settings
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
                </div>
                <div className="alert-message general -left -small">
                  <p><small><strong>Note: </strong>You can manually disable this link anytime by visiting the link page while logged into your account. </small></p> 
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
                      <strong>Can view</strong><br/>
                    </p>
                    <p>
                    {displayUtils.getShareLinkViewParams(this.state.shareLink.authType)}
                    </p>
                  </div>
                  <div className={linkClass}>
                    <input ref={(input) => this.linkInput = input} value={this.state.shareLink.url} readOnly={true}/> 
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

DesktopShareFiles.propTypes = {
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

  return {
    clientStore: store.client
    , fileStore: store.file
    , loggedInUser: store.user.loggedIn.user
    , selectedFirm
    , shareLinkStore: store.shareLink
    , userStore: store.user
  }
};

export default withRouter(connect(mapStoreToProps)(DesktopShareFiles));
