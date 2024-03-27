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

// import 3rd party libraries
import { Helmet } from 'react-helmet';
import _ from 'lodash';
import classNames from 'classnames';
import { DateTime } from 'luxon';

// import actions
import * as firmActions from '../../firm/firmActions';
import * as clientActions from '../../client/clientActions';
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

class ViewLinkTestActions extends Binder {
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
    }

    this._bind(
      '_addRecipient'
      , '_handleFormChange'
      , '_handleCreateShareLink'
      , '_removeRecipient'
      , '_handleCancelShareLink'
      , '_copyToClipboard'
    )
  }

  componentDidMount() {
    window.addEventListener("message", function(message) {
      console.log('postMessage', message);
      window.alert('cancel button is pressed');
    }, false)
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
    const { folderId, vendorapitoken } = queryString.parse(decodeURIComponent(window.location.search));
    
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
    } = this.state;

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
      _client: client._id
      , _firm: firm._id
      , emailMessage: emailMessage
      // filter out any undefined entries that resulted from the user adding and removing recipients willy-nilly.
      , sentTo: this.state.recipients.filter(user => !!user)
      , authType
      , expireDate: expires ? new Date(expireDate) : null
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
          _client: client._id
          , _firm: firm._id
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
            let newFirm = this.state.firm;
            newFirm.tempApiKey = '';

            dispatch(firmActions.sendUpdateFirm(newFirm)).then(response => {});

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

  _copyToClipboard = e => {
    this.linkInput.select();
    document.execCommand('copy');
    this.setState({copySuccess: true});
  };

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

    let recipientListItems = [];

    let availableStaff = [];

    const selectedShareLink = shareLinkStore.selected.getItem();
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
      <div
        style={{
          "width": "100%",
          "height": "100%"
        }}
      >
        <div
          style={{
            "width": "100%",
            "height": "100%"
          }}
        >
          <iframe 
            style={{
              "width": "100%",
              "height": "100%"
            }}
            loading="lazy"
            src={`https://app.imaginetime.com/link/request-signature??firm=384&client=234837&file=2813171&vendorapitoken=404268c4-09da-4f80-8695-e0a1b96ec856&receiverUrl=http://localhost:3030/link/test`}
            frameborder="0"
            sandbox>
          </iframe>
        </div>
      </div>
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
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ViewLinkTestActions)
);