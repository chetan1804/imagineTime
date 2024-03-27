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

// import third-party libraries
import { DateTime } from 'luxon';
import { Helmet } from 'react-helmet';

// import actions
import * as firmActions from '../../firm/firmActions';
import * as quickTaskActions from '../../quickTask/quickTaskActions';
import * as shareLinkActions from '../shareLinkActions';
import * as fileActions from '../../file/fileActions';
import * as userActions from '../../user/userActions';

// import global components
import AlertModal from '../../../global/components/modals/AlertModal.js.jsx';
import Binder from '../../../global/components/Binder.js.jsx';
import DefaultTopNav from '../../../global/components/navigation/DefaultTopNav.js.jsx';
import { EmailInput } from '../../../global/components/forms';
import ProgressBar from '../../../global/components/helpers/ProgressBar.js.jsx';

// import resource components
import ShareLinkAuthForm from '../components/ShareLinkAuthForm.js.jsx';
import ShareLinkNav from '../components/ShareLinkNav.js.jsx';
import PreviewFile from '../../file/components/PreviewFile.js.jsx';

// import utils
import { routeUtils } from '../../../global/utils';
import { fileUtils } from '../../../global/utils'

// import third party libraries
import classNames from 'classnames';
import brandingName from '../../../global/enum/brandingName.js.jsx';

class ViewSignedFile extends Binder {
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
      , showSideBar: true
      , viewing: 'details'
    }
    this._bind(
      '_handleAuthenticateLink'
      , '_handleFormChange'
      , '_handleGetUserLink'
      , '_handleReload'
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

    // if(socket && socket.disconnected) {
    //   socket.open();
    // } else if (socket && socket.connected) {
    //   console.log("I am connected 12345");
    //   // User may not be logged in. Check before we try to subscribe to a private channel.
    //   if(loggedInUser && loggedInUser._id) {
    //     console.log("loggedInUser");
    //     // console.log('subscribing to userid');
    //     // file progress is sent to req.user._id if the user is logged in.
    //     socket.emit('subscribe', loggedInUser._id);
    //   } else {
    //     console.log("match params hex");
    //     // console.log('subscribing to hex');
    //     // file progress is sent to req.hex if the user is not logged in.
    //     socket.emit('subscribe', match.params.hex);
    //   }
    // }

    // let envelopeStatus = routeUtils.objectFromQueryString(this.props.location.search)['envelopeStatus']
    
    // console.log("envelopeStatus", envelopeStatus);

    // console.log("loggedInUser", loggedInUser);

    // if(loggedInUser && loggedInUser._id) {
    //   dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id)).then(firmRes => {
    //     console.log(firmRes);
    //   });
    // }
    dispatch(shareLinkActions.fetchSingleByHex(match.params.hex)).then(slRes => {
    //   console.log("slRes", slRes);

    //   if(slRes.success) {
    //     if(envelopeStatus) {
    //       // We were just redirected here after signing. Attempt to update the quickTask.
    //       this._handleFinalizeSignature(envelopeStatus)
    //     }
    //     // console.log('retrieved')
    //     // console.log(slRes);
    //     if(slRes.authenticated) {
    //       if(loggedInUser && loggedInUser._id) {
    //         // console.log('loggedInUser detected. Attempting to get signing link.');
    //         const selectedQuickTask = slRes.item.quickTask;
    //         const link = selectedQuickTask ? selectedQuickTask.signingLinks.filter(link => link.signatoryEmail == loggedInUser.username)[0] : null
    //         if(link && link.url) {
    //           this.setState({
    //             userSigningLink: link.url
    //           })
    //         } else {
    //           this.setState({
    //             wrongUser: true
    //           })
    //         }
    //       }
    //     }
    //   } else {
    //     alert('no link found');
    //   }
    });
    // dispatch(firmActions.fetchSingleFirmByDomain());  

    dispatch(fileActions.fetchSingleIfNeeded(match.params.fileId)).then(fileRes => {
        if(fileRes.success) {
          const file = fileRes.item;
          if(file.status === 'hidden' || file.status === 'deleted' || file.status === 'archived') {
            // The client isn't allowed to view files with these statuses. Invalidate it and they'll just get the "No file found..." message.
            dispatch(fileActions.invalidateSelected());
          } else {
            // Fetch all users by dedicated api route so we can populate the comments with userMap.
            // This should work from the portal side and the firm side.
            // dispatch(userActions.fetchListIfNeeded('_firmStaff', fileRes.item._firm))
            // dispatch(userActions.fetchListIfNeeded('_client', fileRes.item._client))
          }
        }
      });
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
    const { dispatch, match } = this.props;
    
    dispatch(shareLinkActions.sendAuthenticateLink(match.params.hex, {password: this.state.password})).then(slRes => {
      if(slRes.success) {
        // do nothing. deternmination of link's authentication status is handled on the reducer 
        this.setState({
          password: '',
          authenticatePassword: true
        })
      } else {
        this.setState({
          alertModalOpen: true 
        })
      }
    })
  }

//   _handleDisableLink() {
//     const { dispatch, shareLinkStore} = this.props;
//     const selectedShareLink = _.cloneDeep(shareLinkStore.selectedHex.getItem());
//     const updatedShareLink = {
//       _id: selectedShareLink._id 
//       , expireDate: new Date()
//     }
//     dispatch(shareLinkActions.sendUpdateShareLinkWithPermission(updatedShareLink)).then(slRes => {
//       console.log('done');
//       if(slRes.success) {
//         // force refresh 
//         window.location.reload();
//       } else {
//         alert('Something went wrong');
//       }
//     })
//   }

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

    const { shareLinkStore } = this.props
    const { userEmail } = this.state
    const shareLink = shareLinkStore.selectedHex.getItem();
    const selectedQuickTask = shareLink ? shareLink.quickTask : null
    const link = selectedQuickTask ? selectedQuickTask.signingLinks.filter(link => link.signatoryEmail.toLowerCase() == userEmail.toLowerCase())[0] : null

    if(link && link.url) {
      // They put in the correct email and we have their signing link. Direct them to the signing page.
      let signingLink = document.createElement('a');
      signingLink.setAttribute('href', link.url);
      signingLink.click();
    } else {
      this.setState({
        alertModalOpen: true 
      })
    }
  }

//   _handleFinalizeSignature(envelopeStatus) {
//     const { dispatch, loggedInUser, match, shareLinkStore } = this.props;
//     const shareLink = shareLinkStore.selectedHex.getItem();
//     this.setState({
//       hasSigned: true,
//       authenticatePassword: true,
//       submitting: true
//     })
//     let newQuickTask = _.cloneDeep(shareLink.quickTask)
//     newQuickTask.signingLinks.forEach(link => {
//       if(loggedInUser && link.signatoryEmail == loggedInUser.username) {
//         // If the user is logged in, add the responseDate to the signing link so we have a record of when they signed and we can make
//         // checks to see if we are still waiting for a signer.
//         link.responseDate = new Date()
//       }
//     });
//     newQuickTask.hex = match.params.hex;
//     if(envelopeStatus === "EnvelopeCompleted") {
//       // The last signer just signed. Fire the action to download the signed document and update the quickTask.
//       dispatch(quickTaskActions.sendFinalizeSignature(newQuickTask)).then(quickTaskRes => {
//         if(!quickTaskRes.success) {
//           alert("Error finalizing signature. Please refresh the page and try again.")
//         } else {
//           // Nothing to do here.
//           console.log('Successfully finalized signature!');
//           console.log('quickTaskRes', quickTaskRes);
//           this.setState({signedFile: quickTaskRes.signedFile, submitting: false});
//         }
//       });
//     } else if(loggedInUser && loggedInUser._id) {
//      // We are still awaiting a signature, so instead of finalizing it we'll just update the quickTask with the signer responseDate.
//      dispatch(quickTaskActions.sendUpdateQuickTask(newQuickTask)).then(quickTaskRes => {
//       if(!quickTaskRes.success) {
//         alert("Error finalizing signature. Please refresh the page and try again.")
//       } else {
//         // Nothing to do here.
//         console.log('Successfully updated quickTask responseDate!');
//       }
//      })
//     }
//   }

  render() {
    const { 
      firmStore 
      , loggedInUser
      , shareLinkStore 
      , fileStore
      , userMap
      , match
    } = this.props;

    const {
      hasSigned
      , userSigningLink
      , wrongUser
      , authenticatePassword
      , progress
      , submitting
      , showSideBar
    } = this.state;

    /**
     * use the selected.getItem() utility to pull the actual shareLink object from the map
     */
    const selectedShareLink = shareLinkStore.selectedHex.getItem();
    const userFirmList = loggedInUser && loggedInUser._id && firmStore.lists && firmStore.lists._user ? firmStore.lists._user[loggedInUser._id] : null;

    const previewClass = classNames(
        'file-preview-container'
        , { '-with-sidebar': showSideBar }
    )

    const sideBarClass = classNames(
        'file-preview-sidebar'
        , { '-hidden': !showSideBar }
      )
  

    const selectedFile = fileStore.selected.getItem()
    const fileTags = selectedFile && selectedFile._tags ? selectedFile._tags.map(tagId => tagStore.byId[tagId] || '') : []

    console.log("selectedFile", selectedFile);

    // Currently only requiring a matching email address to be entered to give access to the signing link.
    // TODO: Add other auth types on e-sig sharelinks.
    const isAuthenticated = shareLinkStore.selectedHex.isAuthenticated

    console.log("isAuthenticated", isAuthenticated);
    console.log("authenticatePassword", authenticatePassword);

    const isEmpty = (
      !selectedShareLink
      || !selectedShareLink._id
      || shareLinkStore.selectedHex.didInvalidate
      || !selectedFile
      || !selectedFile._id
      || fileStore.selected.didInvalidate
    );

    const isFetching = (
      shareLinkStore.selectedHex.isFetching
      || fileStore.selected.isFetching
    ) 
    
    return (
      <div>
        <Helmet><title>Signature Request</title></Helmet>
        { isEmpty ? 
        (isFetching ? 
          <div className="-loading-hero hero">
            <div className="u-centerText">
              <div className="loading"></div>
            </div>
          </div>: "") :
            selectedShareLink.authType != 'none' && !authenticatePassword ? (
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
            ) : (
                <div style={{ opacity: isFetching ? 0.5 : 1 }}>
                <div className={previewClass}>
                  <header className="-header fixed">
                    <div className="-header-content">
                      {/* <Link className="-exit-preview" to={targetExitLocation} >
                        <i className="fas fa-arrow-left"></i>
                      </Link> */}
                      <div className="-preview-title">
                        { selectedFile.filename }
                      </div>
                      <div className="-file-actions">
                        { selectedFile.status == 'locked' ?
                          <button className="yt-btn  x-small link bordered" disabled={true}>
                            <span> Download</span>
                          </button>
                        : 
                          <a className="yt-btn x-small link bordered" href={`/api/share-links/download/${match.params.hex}/${selectedFile._id}/${encodeURIComponent(selectedFile.filename)}?type=signature`} download target="_blank">
                            <span> Download</span>
                          </a>
                        }
                      </div>
                    </div>
                  </header>
                  <div className="-preview-content">
                    {/* <div className={sideMenuClass} onClick={() => this.setState({showSideBar: !this.state.showSideBar, viewing: 'comments'})}>
                      <div className="-icon">
                        { this.state.showSideBar ?
                          <i className="far fa-arrow-to-right fa-lg"/>
                          :
                          <i className="far fa-arrow-from-right fa-lg"/>
                        }
                      </div>
                      { !this.state.showSideBar ?
                        <div className="-icon">
                          <i className="far fa-comment-lines fa-lg"/>
                        </div>
                        :
                        null
                      }
                    </div> */}
                    { selectedFile.status == 'locked' ? 
                      <div className="-icon">
                        <img src={brandingName.image.locked_file} />
                      </div>
                      :
                      <PreviewFile
                        contentType={selectedFile.contentType}
                        filePath={`/api/share-links/download/${match.params.hex}/${selectedFile._id}/${encodeURIComponent(selectedFile.filename)}?type=signature`}
                        isIE={false}
                        file={selectedFile}
                      />
                    }
                  </div>
                </div>
                <div className={sideBarClass}>
                  <div className="tab-bar-nav">
                    <ul className="navigation">
                      {/* <li>
                        <span className={`action-link ${this.state.viewing === 'comments' ? 'active' : null}`} onClick={() => this.setState({viewing: 'comments'})}>Comments</span>
                      </li> */}
                      <li>
                        <span className={`action-link ${this.state.viewing === 'details' ? 'active' : null}`} onClick={() => this.setState({viewing: 'details'})}>Details</span>
                      </li>
                    </ul>
                  </div>
                  { this.state.viewing === 'comments'  ? 
                    <div className="-content">
                      {/* <NewClientNoteInput
                        clientNote={this.props.defaultNote}
                        pointers={{
                          '_file': match.params.fileId
                          , '_firm': match.params.firmId
                          , '_client': match.params.clientId
                        }}
                        onSubmit={this._handleNewClientNote}
                      />
                   
                      { clientNoteListItems ? 
                        clientNoteListItems.map((clientNote, i) =>
                          <ClientNoteItem 
                            key={`clientNote_${i}_${clientNote._id}`}
                            clientNote={clientNote}
                            user={userMap[clientNote._user]}
                          />
                        )
                        :
                        null
                      } */}
                    </div> 
                    :
                    <div className="-content">
    
                      <h4>File details</h4>
                      <p>
                        <small className="u-muted">File Name: </small><br/>
                        { selectedFile.filename }
                      </p>
                      <br/>
                      <p>
                        <small className="u-muted">Date Uploaded: </small><br/>
                        {DateTime.fromISO(selectedFile.created_at).toLocaleString(DateTime.DATE_SHORT)}
                      </p>
                      <br/>
                      <p>
                        <small className="u-muted">Uploaded By: </small><br/>
                        { userMap[selectedFile._user] ?
                          `${userMap[selectedFile._user].firstname} ${userMap[selectedFile._user].lastname}`
                          :
                          selectedFile.uploadName ?
                          <em>{selectedFile.uploadName} (not logged in)</em>
                          :
                          'Unknown'
                        }
                      </p>
                      <br/>
                      <p>
                        <small className="u-muted">Type: </small><br/>
                        { selectedFile.category }
                      </p>
                      <br/>
                      <p>
                        <small className="u-muted">Content Type: </small><br/>
                        { selectedFile.contentType }
                      </p>
                      <br/>
                      <p>
                        <small className="u-muted">Tags: </small><br/>
                      </p>
                      { fileTags.map((tag, i) => 
                        <span key={tag._id + i}>{i > 0 ? " | " : ""}{tag.name}</span>
                      )}
                      <br/>
                      
                    </div>
                  }
                </div>
              </div>
            )
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
      </div>
    )
  }
}

ViewSignedFile.propTypes = {
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
    , userMap: store.user.byId
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ViewSignedFile)
);