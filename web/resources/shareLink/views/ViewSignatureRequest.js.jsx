/**
 * View component for /signature-request/:hex
 *
 * Displays a single shareLink from the 'byId' map in the shareLink reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import queryString from 'query-string';

// import third-party libraries
import { DateTime } from 'luxon';
import { Helmet } from 'react-helmet';

// import actions
import * as firmActions from '../../firm/firmActions';
import * as quickTaskActions from '../../quickTask/quickTaskActions';
import * as shareLinkActions from '../shareLinkActions';
import * as activityActions from '../../activity/activityActions';

// import global components
import AlertModal from '../../../global/components/modals/AlertModal.js.jsx';
import Binder from '../../../global/components/Binder.js.jsx';
import DefaultTopNav from '../../../global/components/navigation/DefaultTopNav.js.jsx';
import { EmailInput } from '../../../global/components/forms';
import ProgressBar from '../../../global/components/helpers/ProgressBar.js.jsx';

// import resource components
import ShareLinkAuthForm from '../components/ShareLinkAuthForm.js.jsx';
import ShareLinkNav from '../components/ShareLinkNav.js.jsx';

// import utils
import { routeUtils } from '../../../global/utils';
import Modal from '../../../global/components/modals/Modal.js.jsx';


class ViewSignatureRequest extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      alertModalOpen: false 
      , hasSigned: false // flipped to true after the assuresign redirect.
      , password: ''
      , submitting: false
      , userEmail: '' // this is the current way we authenticate the user.
      , userSigningLink: null
      , wrongUser: null // true when the logged in user does not have a signingLink.
      , authenticatePassword: false
      , signedFile: {}
      , progress: {
        message: 'Waiting'
        , percent: 0
      }
      , sharedEmail: false
      , showTermsAndServices: false
      , tcContents: ''
      , tcCheckboxStatus: false
    }
    this._bind(
      '_handleAuthenticateLink'
      , '_handleDisableLink'
      , '_handleFinalizeSignature'
      , '_handleFormChange'
      , '_handleGetUserLink'
      , '_handleReload'
      , '_handleViewUserLink'
      , '_handleGetSharedEmailLink'
      , '_handleConfirmModal'
    )

    const { loggedInUser, match, socket } = this.props;

    socket.on('disconnect', reason => {
      // console.log('socket disconnected!!!');
      // console.log(reason);
      // We've been disconnected for some reason. Reconnect.
      socket.open();
    })
    // The connect event also fires on reconnect. That's when this will be hit since this component will not
    // yet be mounted when the socket first connects (when layout.pug is loaded).
    socket.on('connect', () => {
      console.log('Connected! 12345');
      if(loggedInUser && loggedInUser._id) {
        // console.log('subscribing to userid');
        // file progress is sent to req.user._id if the user is logged in.
        socket.emit('subscribe', loggedInUser._id);
      } else {
        // console.log('subscribing to hex');
        // file progress is sent to req.hex if the user is not logged in.
        socket.emit('subscribe', match.params.hex);
      }
    })

    socket.on('generate_progress', progress => {
      this.setState({ progress })
    });
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match, socket } = this.props;

    if(socket && socket.disconnected) {
      socket.open();
    } else if (socket && socket.connected) {
      console.log("I am connected 12345");
      // User may not be logged in. Check before we try to subscribe to a private channel.
      if(loggedInUser && loggedInUser._id) {
        console.log("loggedInUser");
        // console.log('subscribing to userid');
        // file progress is sent to req.user._id if the user is logged in.
        socket.emit('subscribe', loggedInUser._id);
      } else {
        console.log("match params hex");
        // console.log('subscribing to hex');
        // file progress is sent to req.hex if the user is not logged in.
        socket.emit('subscribe', match.params.hex);
      }
    }

    let envelopeStatus = routeUtils.objectFromQueryString(this.props.location.search)['envelopeStatus']

    if(loggedInUser && loggedInUser._id) {
      dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id)).then(firmRes => {
        console.log(firmRes);
      });
    }

    dispatch(shareLinkActions.fetchSingleByHexV2(match.params.hex)).then(slRes => {
      console.log("slRes", slRes);

      if (!envelopeStatus) {
        if(slRes.item && slRes.item.showTermsConditions) {
          const firm = slRes.item.firm;
          this.setState({
            showTermsAndServices: true, 
            tcContents: firm.tcContents,
          });
        }
      }

      if(slRes.success) {
        if(envelopeStatus) {
          // We were just redirected here after signing. Attempt to update the quickTask.
          this._handleFinalizeSignature(envelopeStatus)
        }
        
        // console.log('retrieved')
        // console.log(slRes);
        const selectedQuickTask = slRes.item.quickTask;
        const signingLinks = selectedQuickTask && selectedQuickTask.signingLinks;

        let sharedEmail = false;
        signingLinks.forEach(signer => {
          if(signer.signatoryEmail.includes('(')) {
            sharedEmail = true
          };
        });

        if (sharedEmail) {
          this.setState({ sharedEmail: true });
        } else if(loggedInUser && loggedInUser._id) {
          // console.log('loggedInUser detected. Attempting to get signing link.');
          const link = selectedQuickTask ? selectedQuickTask.signingLinks.filter(link => link.signatoryEmail == loggedInUser.username)[0] : null
          if(link && link.url) {
            this.setState({
              userSigningLink: link
            })
          } else {
            this.setState({
              wrongUser: true
            })
          }
        }
      } else {
        alert('no link found');
      }
    });
    dispatch(firmActions.fetchSingleFirmByDomain());  
  }

  componentWillUnmount() {
    const { socket } = this.props
    socket.off('generate_progress')
  }

  _handleAuthenticateLink(e) {
    if(e) {
      e.preventDefault();
    }
    console.log('authenticate link')
    const { dispatch, match, location, shareLinkStore } = this.props;
    const { userSigningLink } = this.state;
    
    dispatch(shareLinkActions.sendAuthenticateLink(match.params.hex, { password: this.state.password, username: userSigningLink && userSigningLink.signatoryEmail })).then(slRes => {
      if(slRes.success && slRes.item) {
        const shareLink = slRes.item;
        const selectedQuickTask = shareLink && shareLink.quickTask;
        const signingLinks = selectedQuickTask && selectedQuickTask.signingLinks;
        let sharedEmail = false;
        signingLinks.forEach(signer => {
          if(signer.signatoryEmail.includes('(')) {
            sharedEmail = true
          };
        });

        // this code is temporary, for some reason the signer value is different from web app and plugin
        // like this: from webapp signer value start from 0 and from plugin  signer value start from 1
        if (sharedEmail) {
          this.setState({
            password: '',
            authenticatePassword: true
            , sharedEmail: true
          });
        } else {
          // do nothing. deternmination of link's authentication status is handled on the reducer 
          this.setState({
            password: '',
            authenticatePassword: true
          });
        }
      } else {
        this.setState({
          alertModalOpen: true 
        })
      }
    })
  }

  _handleDisableLink() {
    const { dispatch, shareLinkStore} = this.props;
    const selectedShareLink = _.cloneDeep(shareLinkStore.selectedHex.getItem());
    const updatedShareLink = {
      _id: selectedShareLink._id 
      , expireDate: new Date()
    }
    dispatch(shareLinkActions.sendUpdateShareLinkWithPermission(updatedShareLink)).then(slRes => {
      console.log('done');
      if(slRes.success) {
        // force refresh 
        window.location.reload();
      } else {
        alert('Something went wrong');
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
    this.setState(newState);
  }

  _handleReload() {
    const { dispatch, match } = this.props;
    dispatch(shareLinkActions.fetchSingleByHex(match.params.hex));
    this.setState({alertModalOpen: false, userEmail: ''});
  }

  _handleGetUserLink() {

    const { shareLinkStore, dispatch, match } = this.props
    const { userEmail } = this.state
    const shareLink = shareLinkStore.selectedHex.getItem();
    const selectedQuickTask = shareLink ? shareLink.quickTask : null
    const link = selectedQuickTask ? selectedQuickTask.signingLinks.filter(link => link.signatoryEmail.toLowerCase() == userEmail.toLowerCase())[0] : null

    if(link && link.url) {
      dispatch(shareLinkActions.fetchSingleByHexV2(match.params.hex)).then(slRes => {
        if(slRes.item && slRes.item.showTermsConditions) {
          const firm = slRes.item.firm;
          this.setState({
            showTermsAndServices: !!slRes.item.showTermsConditions, 
            tcContents: firm.tcContents,
          });
        }
      })
      this.setState({ userSigningLink: link })
      localStorage.setItem('userEmail', userEmail);
    } else {
      this.setState({
        alertModalOpen: true  
      })
    }
  }

  _handleViewUserLink() {
    const { shareLinkStore, dispatch, loggedInUser } = this.props;
    const userSigningLink = _.cloneDeep(this.state.userSigningLink);
    const shareLink = shareLinkStore.selectedHex.getItem();
    const selectedQuickTask = shareLink ? shareLink.quickTask : null

    if (userSigningLink && userSigningLink.url) {
      // They put in the correct email and we have their signing link. Direct them to the signing page.
      let signingLink = document.createElement('a');
      signingLink.setAttribute('href', userSigningLink.url);
      signingLink.click();
      const sendData = { 
        quickTaskId: selectedQuickTask._id
        , userEmail: userSigningLink.signatoryEmail
      }
      dispatch(activityActions.sendViewRequestSignature(sendData));
    }
  }

  _handleFinalizeSignature(envelopeStatus) {
    const { dispatch, loggedInUser, match, shareLinkStore, location } = this.props;
    const shareLink = shareLinkStore.selectedHex.getItem();
    this.setState({
      hasSigned: true,
      authenticatePassword: true,
      submitting: true
    })
    let newQuickTask = _.cloneDeep(shareLink.quickTask);
    const userEmail = localStorage.getItem('userEmail');

    newQuickTask.signingLinks.forEach(link => {
      if(loggedInUser && link.signatoryEmail == loggedInUser.username) {
        // If the user is logged in, add the responseDate to the signing link so we have a record of when they signed and we can make
        // checks to see if we are still waiting for a signer.
        link.responseDate = new Date();
        link.search = location && location.search;
      } else if (!(loggedInUser && loggedInUser._id) && userEmail) {
        newQuickTask.signingLinks.forEach(link => {
          if (link && !link.responseDate && link.signatoryEmail && userEmail && link.signatoryEmail.toLowerCase() === userEmail.toLowerCase() && link.first_viewed_at) {
            link.responseDate = new Date();
            link.search = location && location.search;
          }
        });
      }
    });

    if(envelopeStatus === "EnvelopeCompleted") {
      newQuickTask.hex = match.params.hex;
      newQuickTask._folder = shareLink._folder;
        // The last signer just signed. Fire the action to download the signed document and update the quickTask.
      dispatch(quickTaskActions.sendFinalizeSignature(newQuickTask)).then(quickTaskRes => {
        if(!quickTaskRes.success) {
          alert("Error finalizing signature. Please refresh the page and try again.")
        } else {
          // Nothing to do here.
          console.log('Successfully finalized signature!');
          console.log('quickTaskRes', quickTaskRes);
          this.setState({signedFile: quickTaskRes.signedFile, submitting: false});
        }
      });
    } else if (envelopeStatus === 'InProgress') {

      const signed = newQuickTask.signingLinks.filter(item => item.responseDate);
      this.setState({
        progress: {
          percent: Math.round(signed.length / newQuickTask.signingLinks.length * 100)
          , message: 'Completed'
        }
      });

      if(loggedInUser && loggedInUser._id) {
        // We are still awaiting a signature, so instead of finalizing it we'll just update the quickTask with the signer responseDate.
        dispatch(quickTaskActions.sendUpdateQuickTask(newQuickTask)).then(quickTaskRes => {
         if(!quickTaskRes.success) {
           alert("Error finalizing signature. Please refresh the page and try again.")
         } else {
           // Nothing to do here.
           console.log('Successfully updated quickTask responseDate!');
         }
        })
      } else {
       // We are still awaiting a signature, so instead of finalizing it we'll just update the quickTask with the signer responseDate.
       dispatch(quickTaskActions.sendUpdateQuickTaskWithPermission(newQuickTask)).then(quickTaskRes => {
        if(!quickTaskRes.success) {
          alert("Error finalizing signature. Please refresh the page and try again.")
        } else {
          // Nothing to do here.
          console.log('Successfully updated quickTask responseDate!');
        }
       })
      }
      if (newQuickTask.signingLinks.length > 1) {
        dispatch(quickTaskActions.currentSigner(shareLink))
      }
    }
  }

  _handleGetSharedEmailLink(signer) {
    const { shareLinkStore, dispatch, loggedInUser } = this.props
    const shareLink = shareLinkStore.selectedHex.getItem();
    const selectedQuickTask = shareLink ? shareLink.quickTask : null
    if(signer && signer.url) {
      this.setState({ userSigningLink: signer, hasSigned: false, authenticatePassword: false });
    }
  }

  _handleConfirmModal() {
    this.setState({showTermsAndServices: false});
  }

  render() {
    const { 
      firmStore 
      , loggedInUser
      , shareLinkStore 
    } = this.props;

    const {
      hasSigned
      , userSigningLink
      , wrongUser
      , authenticatePassword
      , progress
      , submitting
      , sharedEmail
      , tcContents
      , tcCheckboxStatus
      , userEmail
    } = this.state;

    /**
     * use the selected.getItem() utility to pull the actual shareLink object from the map
     */
    const selectedShareLink = shareLinkStore.selectedHex.getItem();
    const selectedQuickTask = selectedShareLink && selectedShareLink.quickTask ? _.cloneDeep(selectedShareLink.quickTask) : null;
    const userFirmList = loggedInUser && loggedInUser._id && firmStore.lists && firmStore.lists._user ? firmStore.lists._user[loggedInUser._id] : null;
    const envelopeStatus = routeUtils.objectFromQueryString(this.props.location.search)['envelopeStatus']

    const isEmpty = (
      !selectedShareLink
      || !selectedShareLink._id
      || shareLinkStore.selectedHex.didInvalidate
    );

    const isFetching = (
      shareLinkStore.selectedHex.isFetching
    ) 

    const isExpired = (
      !isEmpty 
      && selectedShareLink.expireDate 
      && DateTime.fromISO(selectedShareLink.expireDate) < DateTime.local()
    )

    const isClosed = (
      !isEmpty
        && selectedShareLink
        && selectedShareLink.quickTask
        && selectedShareLink.quickTask.visibility === "archived"
    );

    // Currently only requiring a matching email address to be entered to give access to the signing link.
    // TODO: Add other auth types on e-sig sharelinks.
    const isAuthenticated = shareLinkStore.selectedHex.isAuthenticated;

    let isDirectLink = false;
    if (selectedShareLink && selectedShareLink.authType === 'individual-auth' && !authenticatePassword && !hasSigned) {
      if (userSigningLink && userSigningLink.auth && userSigningLink.auth.selectedQuestions === 'none') {
        isDirectLink = true;
      }
    }
    

    return (
      <div>
        <Helmet><title>Signature Request</title></Helmet>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <div className="flex column">
              <section className="section white-bg the-404">
                <div className="hero flex three-quarter ">
                  <div className="yt-container slim">
                    <h1> Whoops! <span className="light-weight">Something wrong here</span></h1>
                    <hr/>
                    <h4>Either this link no longer exists, or your credentials are invalid.</h4>
                  </div>
                </div>
              </section>
            </div>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            { isExpired ?
              <div className="share-link-layout">
                <DefaultTopNav />
                <div className="yt-row center-horiz" style={{marginTop: '128px'}}>
                  <div className="yt-container slim">
                    <h1> Whoops! <span className="light-weight">This link is expired</span></h1>
                    <hr/>
                    <h4>
                      Do you have multiple accounts? You may be logged in to the wrong one. You can <Link to="/user/forward">switch accounts.</Link>
                    </h4>
                  </div>
                </div>
              </div>
              : isClosed ? 
              <div className="share-link-layout">
                <DefaultTopNav />
                <div className="yt-row center-horiz" style={{marginTop: '128px'}}>
                  <div className="yt-container slim">
                    <h1> Whoops! <span className="light-weight">This task is no longer available.</span></h1>
                    <hr/>
                    <h4>
                      Do you have multiple accounts? You may be logged in to the wrong one. You can <Link to="/user/forward">switch accounts.</Link>
                    </h4>
                  </div>
                </div>
              </div>
              :
              wrongUser ?
              <div className="share-link-layout">
                <DefaultTopNav />
                <div className="yt-row center-horiz" style={{marginTop: '128px'}}>
                  <div className="yt-container slim">
                    <h1> Whoops! <span className="light-weight">You're not the requested signer on this document</span></h1>
                    <hr/>
                    <h4>
                      Do you have multiple accounts? You may be logged in to the wrong one. You can <Link to="/user/forward">switch accounts.</Link>
                    </h4>
                  </div>
                </div>
              </div>
              :
              hasSigned ?
              <div className="share-link-layout">
                <DefaultTopNav />
                <div className="yt-row center-horiz" style={{marginTop: '128px'}}>
                  <div className="yt-container slim">
                    <h1> Thanks! <span className="light-weight">You're all done</span></h1>
                    <hr/>
                    <h4>
                    { selectedShareLink.firm ?
                      <span> {selectedShareLink.firm.name} </span>
                      :
                      <span> Your accountant </span>
                    }
                      has received your signature.
                    </h4>
                    <hr/>
                    {
                      this.state.signedFile && this.state.signedFile._id && !submitting ? (
                        <a className="yt-btn x-small link bordered" href={`/api/share-links/download/${selectedShareLink.hex}/${this.state.signedFile._id}/${encodeURIComponent(this.state.signedFile.filename)}?type=signature`} download target="_blank">
                          <span> Download </span>
                        </a>
                      ) : (
                        <div id="generateSignedFileProgressContainer">
                          <ProgressBar
                            progress={progress}
                          />
                        </div>
                      )
                    }
                    {
                      sharedEmail && envelopeStatus === "InProgress" ? 
                      <div>
                        <hr/>
                        <div className=" yt-col full m_50 l_40 xl_33">
                          <div className="input-group" style={{marginTop: "16px"}}>
                            {
                              selectedQuickTask.signingLinks.map((signer, i) => 
                                <button key={i} className="yt-btn info" onClick={this._handleGetSharedEmailLink.bind(this, signer)} style={{ marginRight: "0.8em", marginBottom: "16px"}}>
                                  {signer && signer.signerName}
                                </button>
                              )
                            }
                          </div>
                        </div>
                      </div>
                       : null
                    }
                  </div>
                </div>
              </div>
              :
              !userSigningLink && sharedEmail && selectedQuickTask && selectedQuickTask.signingLinks && selectedQuickTask.signingLinks.length ?
              <div className="share-link-layout">
                <ShareLinkNav/>
                <div className="body with-header">
                  <div className="yt-container slim">
                    <h3>
                      { selectedShareLink.firm ?
                        <span> {selectedShareLink.firm.name} </span>
                        :
                        <span> Your accountant </span>
                      }
                      is requesting your signature.
                    </h3>
                    { selectedShareLink.client ?
                      <p className="u-muted">for {selectedShareLink.client.name}</p>
                      :
                      null
                    }
                    <hr/>
                    <div className=" yt-col full m_50 l_40 xl_33">
                      <div className="input-group" style={{marginTop: "16px"}}>
                        {
                          selectedQuickTask.signingLinks.map((signer, i) => 
                            <button key={i} className="yt-btn info" onClick={this._handleGetSharedEmailLink.bind(this, signer)} style={{ marginRight: "0.8em", marginBottom: "16px"}}>
                              {signer && signer.signerName}
                            </button>
                          )
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              :
              !userSigningLink && !(userSigningLink && userSigningLink.url) ?
              <div className="share-link-layout">
                <ShareLinkNav/>
                <div className="body with-header">
                  <div className="yt-container slim">
                    <h3>
                      { selectedShareLink.firm ?
                        <span> {selectedShareLink.firm.name} </span>
                        :
                        <span> Your accountant </span>
                      }
                      is requesting your signature.
                    </h3>
                    { selectedShareLink.client ?
                      <p className="u-muted">for {selectedShareLink.client.name}</p>
                      :
                      null
                    }
                    <hr/>
                    <div className=" yt-col full m_50 l_40 xl_33">
                      <EmailInput
                        autoFocus
                        name='userEmail'
                        placeholder='Enter your email address'
                        change={this._handleFormChange}
                        value={this.state.userEmail}
                        allowComment={true}
                      />
                      <div className="input-group">
                        <button className="yt-btn x-small info u-pullRight" onClick={this._handleGetUserLink}>
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              :
              selectedShareLink && selectedShareLink.authType === 'individual-auth' && !authenticatePassword && !hasSigned && !isDirectLink ?
              <div className="share-link-layout">
                <DefaultTopNav />
                <div className="yt-row center-horiz" style={{marginTop: '128px'}}>
                  <ShareLinkAuthForm
                    handleFormChange={this._handleFormChange}
                    handleFormSubmit={this._handleAuthenticateLink}
                    password={this.state.password}
                    prompt={userSigningLink && userSigningLink.auth && userSigningLink.auth.selectedPrompt}
                    shareLink={{ shareLink: 'secret-question' }}
                  />
                </div>
              </div>
              :
              selectedShareLink && selectedShareLink.authType != 'none' && selectedShareLink.authType != 'individual-auth' && !authenticatePassword && !hasSigned ?
              <div className="share-link-layout">
                <DefaultTopNav />
                <div className="yt-row center-horiz" style={{marginTop: '128px'}}>
                  <ShareLinkAuthForm
                    handleFormChange={this._handleFormChange}
                    handleFormSubmit={this._handleAuthenticateLink}
                    password={this.state.password}
                    prompt={selectedShareLink.prompt}
                    shareLink={selectedShareLink}
                  />
                </div>
              </div>
              :
              <div className="share-link-layout">
                <ShareLinkNav/>
                <div className="body with-header">
                  <div className="yt-container slim">
                    { userFirmList && userFirmList.items.includes(selectedShareLink._firm) ? 
                      <button className="yt-btn danger x-small u-pullRight" onClick={this._handleDisableLink}>Disable this link</button>
                      :
                      null
                    }
                    <h3>
                      { selectedShareLink.firm ?
                        <span> {selectedShareLink.firm.name} </span>
                        :
                        <span> Your accountant </span>
                      }
                      is requesting your signature.
                    </h3>
                    { selectedShareLink.client ?
                      <p className="u-muted">for {selectedShareLink.client.name}</p>
                      :
                      null 
                    }
                    <hr/>
                    { selectedShareLink.quickTask ?
                      <div dangerouslySetInnerHTML={{__html: selectedShareLink.quickTask.prompt || ""}}></div>
                      :
                      null
                    }
                    <div className=" yt-col full m_50 l_40 xl_33">
                      <a onClick={this._handleViewUserLink} className="yt-btn xx-small bordered info">View signature request</a>
                    </div>
                  </div>
                </div>
              </div>
              }
          </div>
        }
        <AlertModal
          alertMessage={<div><p>You did not enter the correct information to access this link.</p></div> }
          alertTitle="Invalid credentials"
          closeAction={this._handleReload}
          confirmAction={this._handleReload}
          confirmText="Try again"
          isOpen={this.state.alertModalOpen }
          type="danger"
        />
        <Modal
          isOpen={this.state.showTermsAndServices}
          cardSize="standard"
          modalHeader="Terms and Conditions"
          confirmAction={this._handleConfirmModal}
          closeAction={() => {}}
          showClose={false}
          showConfirm={true}
          confirmText={'Agree'}
          showExit={false}
          disableConfirm={!tcCheckboxStatus}
          showTermsConditionsCB={true}
          tcCheckboxStatus={tcCheckboxStatus}
          tcCheckboxAction={() => {this.setState({tcCheckboxStatus: !tcCheckboxStatus})}}
        >
          <div dangerouslySetInnerHTML={{__html: tcContents || ""}}></div>
        </Modal>
      </div>
    )
  }
}

ViewSignatureRequest.propTypes = {
  dispatch: PropTypes.func.isRequired
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
    , loggedInUser: store.user.loggedIn.user
    , quickTaskStore: store.quickTask
    , shareLinkStore: store.shareLink
    , socket: store.user.socket
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ViewSignatureRequest)
);