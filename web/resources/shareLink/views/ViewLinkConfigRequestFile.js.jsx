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
import axios from 'axios';

// import 3rd party libraries
import { Helmet } from 'react-helmet';
import _ from 'lodash';
import classNames from 'classnames';
import { DateTime } from 'luxon';
import moment from 'moment';

// import actions
import * as firmActions from '../../firm/firmActions';
import * as userActions from '../../user/userActions';
import * as clientActions from '../../client/clientActions';
import * as staffActions from '../../staff/staffActions';
import * as shareLinkActions from '../../shareLink/shareLinkActions';
import * as quickTaskActions from '../../quickTask/quickTaskActions';

// import other components
import RecipientInput from '../../quickTask/practice/components/RecipientInput.js.jsx';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import LinkConfigLayout from '../components/LinkConfigLayout.js.jsx';
import {
  SelectFromObject
  , SingleDatePickerInput
  , TextAreaInput
  , TextInput 
  , ToggleSwitchInput
} from '../../../global/components/forms';

import { displayUtils } from "../../../global/utils";
import sortUtils from '../../../global/utils/sortUtils.js';

class ViewLinkConfigRequestFile extends Binder {
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
      , recipients: []
      , submitting: false
      , receiveEmails: false
      , receivers: []
      , copySuccess: false
      , receiverUrl: ''
      , key: {}
    }

    this._bind(
      '_addRecipient'
      , '_handleFormChange'
      , '_handleCreateShareLink'
      , '_removeRecipient'
      , '_handleCancelShareLink'
      , '_copyToClipboard'
      , '_handlePostMessage'
      , '_deleteTempKey'
      , '_fetchParamsDetails'
    )
  }

  componentDidMount() {
    const { files, vendorapitoken, receiverUrl } = queryString.parse(decodeURIComponent(window.location.search));

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
          console.log('this.state', this.state);
        })

        if(!!tempKey._folder) {
          this.setState({folderId: tempKey._folder});
        }
      } else {
        alert('Your token has expired');
      }
    });

    if(!!receiverUrl) this.setState({ receiverUrl: receiverUrl });

  }

  _fetchParamsDetails(key) {

    const { dispatch } = this.props;

    const { vendorapitoken } = queryString.parse(decodeURIComponent(window.location.search));

    const firm = key._firm;
    const client = key._client;

    if(!!vendorapitoken) {
      console.log('get firm details');
      if(!!firm) {
        dispatch(firmActions.fetchSingleIfNeeded(firm)).then(response => {
          console.log('firm response', response);

          const selectedFirm = response.item;

          if(selectedFirm && selectedFirm._id) {

            dispatch(userActions.fetchListIfNeeded('_firmStaff', selectedFirm._id)); 
            dispatch(userActions.fetchListIfNeeded('_firm', selectedFirm._id)); 

            if(!!client) {
              dispatch(clientActions.fetchSingleIfNeeded(client)).then(response => {
                console.log('client response', response);
  
                this.setState({
                  client: response.item || {},
                  hasError: false
                })
              })
              .catch(err => {
                console.log('failed to get client details');
                this.setState({hasError: true});
              })
            }

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

  _getRecipientList(userType) {
    const { userStore } = this.props;
    const { firm } = this.state;
    // The clientId in state overrides the client in props since client can be changed
    // on this component.
    console.log('userStore', userStore);
    const userListItems = userStore.util.getList(userType, firm._id)
    const recipientList = userListItems ? userListItems.map(user => {
      return {
        displayName: `${user.firstname} ${user.lastname} | ${user.username}`
        , email: user.username
       }
    })
    :
    []
    return recipientList
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

  _handleCancelShareLink() {
    window.open("about:blank", "_self");
    window.close();
  }

  _handleCreateShareLink() {
    const {
      dispatch
    } = this.props;

    const {
      authType
      , expires
      , expireDate
      , password
      , prompt
      , emailMessage
      , secretQuestions
      , selectedQuestion
      , firm
      , client
      , key
      , folderId
    } = this.state;

    if(!(key.type == 'request-file')) {
      alert('Unable to process the request. Token is invalid')
      return;
    }

    if(authType == "secret-question") {
      const shareLinkSelectedQuestion = this.state.selectedQuestion;
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

    let newShareLink = {
      _firm: firm._id
      , _client: client && client._id ? client._id : null
      , emailMessage: emailMessage
      // filter out any undefined entries that resulted from the user adding and removing recipients willy-nilly.
      , sentTo: this.state.recipients.filter(user => !!user)
      , authType
      // , expireDate: expires ? new Date(expireDate) : null
      , expireDate: expires ? moment(expireDate).format('YYYY-MM-DD') : null 
      , password: shareLinkPassword
      , prompt: shareLinkPrompt
      , type: 'file-request'
      , sN_upload: false
    } 

    if(!!folderId) {
      newShareLink._folder = !isNaN(folderId) ? folderId : null;
    }

    console.log('sharelink parameters', newShareLink);

    this.setState({submitting: true});

    dispatch(shareLinkActions.sendCreateShareLink(newShareLink)).then(slRes => {
      
      let shareLink = slRes.item;
      if(slRes.success) {

        this.setState({
          [shareLink._id + '_emailResults']: shareLink.emailResults
        })

        // create a quickTask here. Then update the shareLink with _quickTask
        const quickTask = {
          _client: shareLink._client
          , _firm: shareLink._firm
          , type: 'file'
          , prompt: this.state.instructions
          , selectedStaff: null
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
              })

              this._deleteTempKey();
              if(shareLinkRes.success) {
                // console.log('successfully updated shareLink!', shareLinkRes);
              } else {
                alert('There was a problem updating the shareLink.');
              }
            })
          } else {
            this._deleteTempKey();
            alert('There was a problem creating the quickTask.');
          }
        })
      } else {
        this._deleteTempKey();
        alert('There was a problem creating the shareLink.');
      }
    })
  }

  _copyToClipboard = e => {
    this.linkInput.select();
    document.execCommand('copy');
    this.setState({copySuccess: true});
  };

  _handlePostMessage() {
    console.log('url', this.state.receiverUrl);
    this._deleteTempKey();
    parent.postMessage({
      action: 'cancel'
    }, '*')
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

  render() {

    console.log('this is a test');

    const {
      shareLinkStore
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
      , staffs
    } = this.state;

    const confirmBtnClass = classNames(
      'yt-btn small',
      'info'
    )

    const closeBtnClass = classNames(
      'yt-btn x-small '
    )

    const linkBtnClass = classNames(
      'yt-btn small'
      , 'link'
      , 'info'
    )

    const linkClass = classNames(
      "-copyable-share-link" 
      , { '-visible': this.state.copySuccess }
    )

    const promptClass = classNames(
      "-prompt" 
      , { '-hidden': this.state.copySuccess }
    )


    const selectedShareLink = shareLinkStore.selected.getItem();
    const selectedClient = !!client._id ? client._id: null;

    let staffListItems = this._getRecipientList('_firmStaff');
    staffListItems = sortUtils._object(staffListItems, "displayName"); 

    let contactListItems = !!selectedClient ? this._getRecipientList('_firm') : [];
    contactListItems = sortUtils._object(contactListItems, "displayName"); 

    const linkEmpty = (
      !selectedShareLink
      || !selectedShareLink._id
      || shareLinkStore.selected.didInvalidate
    );

    const linkFetching = (
      shareLinkStore.selected.isFetching
    )

    console.log('selectedShareLink', selectedShareLink);
    return (
      <LinkConfigLayout>
        <Helmet><title>Request Files</title></Helmet>
        <div className="flex ">
          {
            linkEmpty ?
            (linkFetching ?
              <div className="-loading-hero hero">
                <div className="u-centerText">
                  <div className="loading"></div>
                </div>
              </div>  
              :
              !hasError ?
                <section className="section ">
                  <div className="yt-container slim">
                    <div className="yt-row center-horiz">
                      <div className="yt-col _100">
                        <div className="card bordered profile-card">
                          <div className="card-header">
                            <div className="yt-row center-vert space-between">
                              Request files from {client.name || `General Files`}
                            </div>
                          </div>
                          <div className="card-body">
                            <div>
                              <div className="-share-link-configuration">
                                <div className="-header">
                                  <i className="fas fa-eye"/> Link Settings
                                </div>
                                <div className="-body">
                                  <div className="-setting yt-row space-between">
                                    <div className="-instructions yt-col">
                                      <p><strong>Workspace</strong></p>
                                    </div>
                                    <div className="yt-col">
                                      {client.name || `General Files`}
                                    </div>
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
                                      {
                                         (authType === 'secret-question') ?
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
                                  {/* <div className="-setting yt-row space-between">
                                    <div className="-instructions yt-col">
                                      <p>Notify when uploaded</p>
                                    </div>
                                  </div> */}
                                  <div className="setting yt-row space-between">
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
                                  <div className="setting yt-row space-between">
                                    <div className="-instructions yt-col">
                                      <p><strong>Add Instructions</strong></p>
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
                                      <TextAreaInput
                                        change={this._handleFormChange}
                                        name="instructions"
                                        placeholder="Please upload your W-2 for 2019"
                                        value={this.state.instructions}
                                      />
                                      :
                                      null
                                    }
                                  </div>
                                  <hr/>
                                  <div className="setting yt-row space-between">
                                    <div className="-instructions yt-col">
                                      <p><strong>Send Request Emails</strong></p>
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
                                              recipientListItems={contactListItems}
                                              recipient={recipient}
                                              removeRecipient={() => this._removeRecipient(i)}
                                              filterable={true}
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
                                  <div className="setting yt-row space-between">
                                    <div className="-instructions yt-col">
                                      <p><strong>Receive Notification Emails</strong></p>
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
                                              recipientListItems={staffListItems}
                                              recipient={receiver}
                                              removeRecipient={() => this._removeRecipient(i, "receiver")}
                                              filterable={true}
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
                          </div>
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
                                onClick={this._handleCreateShareLink} 
                                disabled={this.state.submitting}
                              >
                                Create request files link
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                :
                null //display error
            )
            :
            <section className="section ">
              <div className="yt-container slim">
                <div className="yt-row center-horiz">
                  <div className="yt-col _100">
                    <div className="card bordered profile-card">
                      <div className="card-header">
                        <div className="yt-row center-vert space-between">
                          Request files from {client.name}
                        </div>
                      </div>
                      <div className="card-body">
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
                    </div>
                  </div>
                </div>
              </div>
            </section>
          }
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
    , userStore: store.user
    , socket: store.user.socket
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ViewLinkConfigRequestFile)
);