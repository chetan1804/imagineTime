/**
 * View component for /share-links/:shareLinkId
 *
 * Displays a single shareLink from the 'byId' map in the shareLink reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, history, withRouter } from 'react-router-dom';

// import actions
import * as clientActions from '../../../resources/client/clientActions';
import * as fileActions from '../../../resources/file/fileActions';
import * as firmActions from '../../../resources/firm/firmActions';
import * as quickTaskActions from '../../../resources/quickTask/quickTaskActions';
import * as shareLinkActions from '../../../resources/shareLink/shareLinkActions';

// import global components
import AlertModal from '../../components/modals/AlertModal.js.jsx';
import Binder from '../../components/Binder.js.jsx';
import DefaultTopNav from '../../components/navigation/DefaultTopNav.js.jsx';
import ProfilePic from '../../components/navigation/ProfilePic.js.jsx';
import ProfileDropdown from '../../components/navigation/ProfileDropdown.js.jsx';
import { FileInput, TextInput } from '../../components/forms';

// import resource components
import ShareLinkAuthForm from '../../../resources/shareLink/components/ShareLinkAuthForm.js.jsx';
import ShareLinkNav from '../../../resources/shareLink/components/ShareLinkNav.js.jsx';


import classNames from 'classnames';
import { DateTime } from 'luxon';
import { auth } from '../../../global/utils';
import { Helmet } from 'react-helmet';

class UploadboxUploadFile extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      alertModalOpen: false
      , errorMessage: ''
      , expired: false 
      , files: []
      , password: ''
      , preparing: false
      , progressPercent: []
      , progressError: []
      , submitting: false
      , submitted: false
      , uploadName: ''
      , uploadNameSet: false
    }
    this._bind(
      '_handleAuthenticateLink'
      , '_handleDisableLink'
      , '_handleFilesChange'
      , '_handleFormChange'
      , '_handleReload'
      , '_handleSubmitFiles'
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
      // console.log('Connected!');
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

    socket.on('upload_progress', (progress, index) => {
      let newProgress = _.update(_.cloneDeep(this.state.progressPercent), index, () => {
        return progress;
      });
      this.setState({progressPercent: newProgress});
    })

    // Used to display an error on a single file upload.
    socket.on('upload_progress_error', (error, index) => {
      // console.log('Upload progress error', error);
      let newProgressError = _.update(_.cloneDeep(this.state.progressError), index, () => {
        return error;
      });
      this.setState({progressError: newProgressError});
    })

    socket.on('upload_finished', (files) => {
      const { dispatch, shareLinkStore } = this.props;
      // console.log("UPLOAD FINISHED!!!", files);
      let updatedShareLink = _.cloneDeep(shareLinkStore.selectedHex.getItem())
      let newFileIds = files.map(file => file._id)
      if(updatedShareLink.quickTask) {
        const filteredFileIds = newFileIds.filter(fileId => !updatedShareLink.quickTask._returnedFiles.includes(fileId))
        // add the files to the quickTask files array and update the quickTask.
        let updatedQuickTask = updatedShareLink.quickTask
        updatedQuickTask._returnedFiles = updatedQuickTask._returnedFiles.concat(filteredFileIds)
        dispatch(quickTaskActions.sendUpdateQuickTaskWithPermission(updatedQuickTask)).then(qtRes => {
          // console.log('qtRes', qtRes);
          
        })
      } else {
        const filteredFileIds = newFileIds.filter(fileId => !updatedShareLink._files.includes(fileId))
        // add the files to the shareLink files array and update the shareLink
        updatedShareLink._files = updatedShareLink._files.concat(filteredFileIds)
        dispatch(shareLinkActions.sendUpdateShareLinkWithPermission(updatedShareLink)).then(slRes => {
          // console.log('slRes', slRes);
          
        });
      }
      this.setState({
        progressPercent: []
        , submitting: false
        , submitted: true
      })
      if(this.props.handleUploaded) {
        this.props.handleUploaded(files)
      }
    })
    // Used to display an overall file upload error.
    socket.on('upload_finished_error', (error) => {
      console.log("UPLOAD FINISHED ERROR!!!", error);
      this.setState({
        progressPercent: []
        , submitting: false
        , submitted: true
        , errorMessage: error
      })
    })
  }

  componentDidMount() {
    console.log('did mount');
    const { dispatch, loggedInUser, match, socket } = this.props;
    if(socket && socket.disconnected){
      // console.log('socket isnt connected. opening');
      socket.open();
    } else if(socket && socket.connected) {
      // User may not be logged in. Check before we try to subscribe to a private channel.
      if(loggedInUser && loggedInUser._id) {
        // console.log('subscribing to userid');
        // file progress is sent to req.user._id if the user is logged in.
        socket.emit('subscribe', loggedInUser._id);
      } else {
        // console.log('subscribing to hex');
        // file progress is sent to req.hex if the user is not logged in.
        socket.emit('subscribe', match.params.hex);
      }
    }
    dispatch(shareLinkActions.fetchSingleByHex(match.params.hex)).then(slRes => {
      if(slRes.success) {
        // console.log('retrieved')
        // console.log(slRes);
        if(slRes.authenticated) {
          // dispatch file action here 
        }
      } else {
        alert('no link found');
      }
    });
    dispatch(firmActions.fetchSingleFirmByDomain());  
  }

  componentWillUnmount() {
    const { socket } = this.props;
    socket.off('disconnect')
    socket.off('connect')
    socket.off('upload_progress')
    socket.off('upload_finished')
    socket.off('upload_progress_error')
    socket.off('upload_finished_error')
  }

  _handleFilesChange(files) {
    console.log('-------- files -----');
    console.log(files);
    this.setState({files})
  }

  _handleSubmitFiles(e) {
    const { close, dispatch, match, shareLinkStore } = this.props;
    if(e) {
      e.preventDefault();
    }
    this.setState({preparing: true})
    // convert to a FormData objet to allow uploading file=
    const { files } = this.state;
    if(files.length < 1) {
      alert("No files present");
    } else {
      // build formdata to upload file
      let formData = new FormData()
      Object.keys(this.state.files).forEach(key => {
        console.log("debug", key, this.state.files[key]);
        const file = this.state.files[key];
        formData.append(key, new Blob([file], { type: file.type }), file.name || 'file')
      })
      const selectedShareLink = shareLinkStore.selectedHex.getItem();
      let filePointers = {
        _firm: selectedShareLink._firm
        , status: 'visible' // files uploaded by a client should be visible to the client.
      }
      if(selectedShareLink._client) {
        filePointers._client = selectedShareLink._client
      }
      if(this.state.uploadName) {
        filePointers.uploadName = this.state.uploadName
      }
      // add file pointers 
      Object.keys(filePointers).forEach(key => {
        formData.append(key, filePointers[key]);
      })

      dispatch(shareLinkActions.sendUploadFiles(match.params.hex, formData)).then((result) => {
        if(result.success) {
          this.setState({
            submitting: true
            , preparing: false
          })
        } else {
          this.setState({
            // This probably means a file timeout during parse.
            errorMessage: result.error
            , files: []
            , preparing: false
            , submitted: true
          })
        }
      });
    }
  }

  _handleAuthenticateLink(e) {
    if(e) {
      e.preventDefault();
    }
    console.log('authenticate link')
    const { dispatch, match, shareLinkStore } = this.props;
    const selectedShareLink = _.cloneDeep(shareLinkStore.selectedHex.getItem());
    // If it is 'shared-client-secret' then password needs to be hashed.
    const password = selectedShareLink && (selectedShareLink.authType === 'shared-client-secret' || selectedShareLink.authType === 'shared-contact-secret') ? auth.getHashFromString(_.snakeCase(this.state.password)) : this.state.password
    dispatch(shareLinkActions.sendAuthenticateLink(match.params.hex, {password: password})).then(slRes => {
      if(slRes.success) {
        // do nothing. deternmination of link's authentication status is handled on the reducer 
      } else {
        this.setState({
          alertModalOpen: true 
        })
      }
    })
  }

  _handleDisableLink() {
    const { dispatch, history, match, shareLinkStore} = this.props;
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
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleReload() {
    const { dispatch, match } = this.props;
    dispatch(shareLinkActions.fetchSingleByHex(match.params.hex));
    this.setState({
      alertModalOpen: false
      , files: []
      , submitted: false
      , progressPercent: []
      , progressError: []
    });
  }

  render() {
    const { 
      clientStore 
      , fileStore 
      , firmStore 
      , location 
      , loggedInUser
      , shareLinkStore 
    } = this.props;

    const {
      files
      , progressError
      , progressPercent
      , preparing
      , submitting
      , submitted
    } = this.state;

    /**
     * use the selected.getItem() utility to pull the actual shareLink object from the map
     */
    const selectedShareLink = shareLinkStore.selectedHex.getItem();
    // console.log(selectedShareLink)
    // console.log(shareLinkStore.selectedHex);
    // console.log(shareLinkStore.byHex[match.params.hex])

    // const userFirms = loggedInUser && loggedInUser._id ? firmStore.util.getList(userFirmListArgs);
    const userFirmList = loggedInUser && loggedInUser._id && firmStore.lists && firmStore.lists._user ? firmStore.lists._user[loggedInUser._id] : null;

    const isEmpty = (
      !selectedShareLink
      || !selectedShareLink._id
      || shareLinkStore.selectedHex.didInvalidate
    );

    const isFetching = (
      shareLinkStore.selectedHex.isFetching
    );

    const isExpired = (
      !isEmpty 
      && selectedShareLink.expireDate 
      && DateTime.fromISO(selectedShareLink.expireDate) < DateTime.local()
    )

    const isAuthenticated = shareLinkStore.selectedHex.isAuthenticated

    const previewClass = classNames(
      'file-preview-container'
      , { '-with-sidebar': this.state.showSideBar }
    )

    const sideBarClass = classNames(
      'file-preview-sidebar'
      , { '-hidden': !this.state.showSideBar }
    )


    const sideMenuClass = classNames(
      "-sidebar-menu"
      , { '-open': this.state.showSideBar }
    )

    return (
      <div>
        <Helmet><title>File Request</title></Helmet>
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
              <div className="flex column">
                <section className="section white-bg the-404">
                  <div className="hero flex three-quarter ">
                    <div className="yt-container slim">
                      <h1> Whoops! <span className="light-weight">This link is expired</span></h1>
                      <hr/>
                      <h4>You can <Link to="/user/login">sign in</Link> to view your account, or request a new link.</h4>
                    </div>
                  </div>
                </section>
              </div>
              : selectedShareLink.authType !== 'none' && !isAuthenticated ? 
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
                        is requesting files
                      </h3>
                      { selectedShareLink.client ?
                        <p className="u-muted">for {selectedShareLink.client.name}</p>
                        :
                        null 
                      }
                      <hr/>
                      { !loggedInUser._id && !this.state.uploadNameSet ?
                        <div className=" yt-col full m_50 l_40 xl_33">
                          <TextInput
                            autoFocus
                            name='uploadName'
                            placeholder='Enter your name'
                            change={this._handleFormChange}
                            value={this.state.uploadName}
                          />
                          <div className="input-group">
                            <button className="yt-btn x-small info u-pullRight" disabled={!this.state.uploadName} onClick={() => this.setState({ uploadNameSet: true })}>
                              Done
                            </button>
                          </div>
                        </div>
                        :
                        <div className=" yt-col full m_50 l_40 xl_33">
                        { !submitted ?
                          !submitting ?
                          !preparing ?
                          <div className="-request-file-input">
                          { selectedShareLink.quickTask ?
                            <label>{selectedShareLink.quickTask.prompt}</label>
                            :
                            null
                          }
                            <FileInput
                              change={this._handleFilesChange}
                              multiple={true}
                              required={true}
                            />
                            <button className="yt-btn small block info" onClick={this._handleSubmitFiles} disabled={!files || files.length < 1 || submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>
                          </div>
                          :
                          <span><i className="fas fa-spinner fa-spin"/>{` Preparing file${files.length > 1 ? 's...' : '...'}`}</span>
                          :
                          files.map((file, i) =>
                          <div key={file.name + "_" + i} style={{padding: '1em'}}>
                          { progressError[i] ?
                            <p><small><strong>{file.name}</strong></small>{` - ${progressError[i]}`}</p>
                            :
                            <p><small><strong>{file.name}</strong></small>{` - ${progressPercent[i] || 0}%`}</p>
                          }
                            <div className={`progress-bar-${progressPercent[i] || 0}`} >
                              <div className="-progress">
                                <div className="-complete">
                                </div>
                              </div>
                            </div>
                          </div>
                          )
                          :
                          <div className="hero">
                          { !this.state.errorMessage && progressError.length === 0 ?
                            <div className="u-centerText">
                              <h3>Files submitted successfully.</h3>
                              {/* calling handleReload so we can refetch the shareLink with the updated files array. */}
                              <button className="yt-btn small info" onClick={this._handleReload}>Upload more files</button>
                            </div>
                            :
                            <div className="u-centerText">
                              <h3>Something went wrong.</h3>
                              <p>{this.state.errorMessage}</p>
                              { files.map((file, i) =>
                                <div key={file.name + "_" + i} style={{textAlign: 'left'}}>
                                { progressError[i] ?
                                  <p className="u-danger"><small><strong>{file.name}</strong></small>{` - ${progressError[i]}`}</p>
                                  :
                                  <p><small><strong>{file.name}</strong></small>{` - Successfully uploaded`}</p>
                                }
                                </div>
                              )}
                              {/* calling handleReload so we can refetch the shareLink with the updated files array. */}
                              <button className="yt-btn small warning" onClick={this._handleReload}>Try again</button>
                            </div>
                          }
                          </div>
                        }
                        </div>
                      }
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
      </div>
    )
  }
}

UploadboxUploadFile.propTypes = {
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
    , shareLinkStore: store.shareLink
    , socket: store.user.socket
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(UploadboxUploadFile)
);