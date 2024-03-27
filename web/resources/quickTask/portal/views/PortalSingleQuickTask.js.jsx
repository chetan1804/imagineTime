
/**
 * View component for portal/:clientId/quick-tasks/:quickTaskId
 *
 * Displays a single quickTask from the 'byId' map in the clientWorkflow reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import classNames from 'classnames';
import { DateTime } from 'luxon';
import { Helmet } from 'react-helmet';

// import actions
import * as clientActions from '../../../client/clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as fileActions from '../../../file/fileActions';
import * as firmActions from '../../../firm/firmActions';
import * as quickTaskActions from '../../quickTaskActions';
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../../user/userActions';
import * as activityActions from '../../../activity/activityActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import FileInput from '../../../../global/components/forms/FileInput.js.jsx';
import PortalLayout from '../../../../global/portal/components/PortalLayout.js.jsx';

// import utils
import { quickTaskUtils, routeUtils } from '../../../../global/utils';

// import other components.
import FileMicroListItem from '../../../file/components/FileMicroListItem.js.jsx';

class PortalSingleQuickTask extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      files: []
      , password: ''
      , preparing: false
      , refetch: null
      , submitted: false 
      , submitting: false
      , progressPercent: []
      , progressError: []
    }
    this._bind(
      '_handleFinalizeSignature'
      , '_handleFilesChange'
      , '_handleSubmitFiles'
      , '_handleViewUserLink'
    )

    const { loggedInUser, socket } = this.props;

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
        socket.emit('subscribe', loggedInUser._id);
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
      const { dispatch, quickTaskStore } = this.props;
      files.map(file => this.props.dispatch(fileActions.addSingleFileToMap(file)))
      let updatedQuickTask = _.cloneDeep(quickTaskStore.selected.getItem())
      let newFileIds = files.map(file => file._id)
      const filteredFileIds = newFileIds.filter(fileId => !updatedQuickTask._returnedFiles.includes(fileId))
      // add the files to the quickTask files array and update the quickTask.
      updatedQuickTask._returnedFiles = updatedQuickTask._returnedFiles.concat(filteredFileIds)
      dispatch(quickTaskActions.sendUpdateQuickTaskWithPermission(updatedQuickTask)).then(qtRes => {
        this.setState({
          submitted: true
          , submitting: false
          , progressPercent: []
        })
      })
    })

    // Used to display an overall file upload error.
    socket.on('upload_finished_error', (error) => {
      // console.log("UPLOAD FINISHED ERROR!!!", error);
      this.setState({
        progressPercent: []
        , submitted: true
        , submitting: false
        , errorMessage: error
      })
    })
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match, socket } = this.props
    if(socket && socket.disconnected) {
      socket.open();
    } else if(socket && socket.connected && loggedInUser && loggedInUser._id) {
      // Already connected, make sure we are subscribed to socket updates.
      socket.emit('subscribe', loggedInUser._id);
    }
    /**
     * add this to each portal view 
     */
    dispatch(clientUserActions.fetchClientUserLoggedInByClientIfNeeded(match.params.clientId));

    dispatch(quickTaskActions.fetchSingleIfNeeded(match.params.quickTaskId)).then(quickTaskRes => {
      if(!quickTaskRes.success) {
        this.props.history.push(`/portal/${match.params.clientId}/quick-tasks`)
      } else {
        let envelopeStatus = routeUtils.objectFromQueryString(this.props.location.search)['envelopeStatus']
        if(envelopeStatus) {
          // This means we were just redirected from signing a document.
          this._handleFinalizeSignature(match.params.quickTaskId, envelopeStatus)
        }
        // fetch a list of your choice
        dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
        dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then(clientRes => {
          if(clientRes.success) {
            dispatch(firmActions.fetchSingleIfNeeded(clientRes.item._firm));
            dispatch(staffActions.fetchListIfNeeded('_firm', clientRes.item._firm));
            dispatch(userActions.fetchListIfNeeded('_firmStaff', clientRes.item._firm));
          }
        })
        // TODO:  Make this dynamic 
        dispatch(fileActions.fetchListIfNeeded('~client', match.params.clientId));
        dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));
      }
    })
  }

  componentDidUpdate(prevProps) {
    const { dispatch, match } = this.props;
    if(prevProps.match.params.quickTaskId !== match.params.quickTaskId || this.state.refetch) {
      dispatch(fileActions.fetchListIfNeeded('~client', match.params.clientId));
      dispatch(quickTaskActions.fetchSingleIfNeeded(match.params.quickTaskId));
      this.setState({
        refetch: false
      })
    }
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

  _handleFinalizeSignature(quickTaskId, envelopeStatus) {
    const { dispatch, history, loggedInUser, match, quickTaskStore } = this.props;
    this.setState({
      submitting: true
    })
    let newQuickTask = _.cloneDeep(quickTaskStore.byId[quickTaskId])
    newQuickTask.signingLinks.forEach(link => {
      if(link.signatoryEmail == loggedInUser.username) {
        // Add the responseDate to the signing link so we have a record of when they signed and we can make
        // checks to see if we are still waiting for a signer.
        link.responseDate = new Date()
      }
    });
    if(envelopeStatus === "EnvelopeCompleted") {
      // The last signer just signed. Fire the action to download the signed document and update the quickTask.
      dispatch(quickTaskActions.sendFinalizeSignature(newQuickTask)).then(quickTaskRes => {
        if(!quickTaskRes.success) {
          alert("Error finalizing signature. Please refresh the page and try again.")
        } else {
          dispatch(quickTaskActions.invalidateSelected())
          dispatch(fileActions.invalidateList('~client', match.params.clientId));
          // The component is about to update. Set refetch to true so componentDidUpdate knows to refetch.
          this.setState({
            refetch: true
            , submitting: false
          }, () => history.push(match.url))
        }
      });
    } else {
     // We are still awaiting a signature, so instead of finalizing it we'll just update the quickTask with the signer responseDate.
     dispatch(quickTaskActions.sendUpdateQuickTask(newQuickTask)).then(quickTaskRes => {
      if(!quickTaskRes.success) {
        alert("Error finalizing signature. Please refresh the page and try again.")
      } else {
        dispatch(quickTaskActions.invalidateSelected())
        dispatch(fileActions.invalidateList('~client', match.params.clientId));
        // The component is about to update. Set refetch to true so componentDidUpdate knows to refetch.
        this.setState({
          refetch: true
          , submitting: false
        }, () => history.push(match.url))
      }
     })
    }
  }

  _handleFilesChange(files) {
    // console.log('-------- files -----');
    // console.log(files);
    this.setState({files})
  }

  _handleSubmitFiles(e) {
    const { dispatch, quickTaskStore } = this.props;
    if(e) {
      e.preventDefault();
    }
    const selectedQuickTask = quickTaskStore.selected.getItem();
    this.setState({preparing: true})
    // convert to a FormData object to allow uploading files
    const { files } = this.state;
    if(files.length < 1) {
      alert("No files present");
    } else {
      // build formdata to upload file
      let formData = new FormData()
      Object.keys(this.state.files).forEach(key => {
        // console.log("debug", key, this.state.files[key]);
        const file = this.state.files[key];
        formData.append(key, new Blob([file], { type: file.type }), file.name || 'file')
      })
      const filePointers = {
        _client: selectedQuickTask._client
        , _firm: selectedQuickTask._firm
        , status: 'visible' // files uploaded by a client should be visible to the client.
      }
      // add file pointers 
      Object.keys(filePointers).forEach(key => {
        formData.append(key, filePointers[key]);
      })
      dispatch(fileActions.sendCreateFiles(formData)).then((result) => {
        if(result.success) {
          this.setState({
            submitting: true
            , preparing: false
          })
        } else {
          this.setState({
            errorMessage: result.error
            , preparing: false
            , submitted: true
          })
          alert("ERROR - Check logs");
        }
      });
    }
  }

  _handleViewUserLink() {
    const { loggedInUser, quickTaskStore, dispatch } = this.props;
    const selectedQuickTask = quickTaskStore.selected.getItem();
    const link = selectedQuickTask && selectedQuickTask.type === 'signature' ? quickTaskUtils.getUserSigningLink(selectedQuickTask, loggedInUser) : null;

    if (link && link.url) {
      // They put in the correct email and we have their signing link. Direct them to the signing page.
      let signingLink = document.createElement('a');
      signingLink.setAttribute('href', link.url);
      signingLink.click();
      const sendData = { 
        quickTaskId: selectedQuickTask._id
        , userEmail: loggedInUser.username
      }
      dispatch(activityActions.sendViewRequestSignature(sendData));
    }
  }

  render() {
    const {
      clientStore 
      , firmStore
      , fileStore
      , loggedInUser
      , match
      , quickTaskStore
    } = this.props;

    const  {
      files
      , preparing
      , submitted
      , submitting
      , progressError
      , progressPercent
    } = this.state;

    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();
    const selectedQuickTask = quickTaskStore.selected.getItem();

    const signingLink = selectedQuickTask && selectedQuickTask.type === 'signature' ? quickTaskUtils.getUserSigningLink(selectedQuickTask, loggedInUser) : null;
    const percentComplete = quickTaskUtils.getProgressPercent(selectedQuickTask);

    const isEmpty = (
      clientStore.selected.didInvalidate
      || firmStore.selected.didInvalidate
      || !selectedClient
      || !selectedClient._id
      || !selectedFirm
      || !selectedFirm._id
      || !selectedQuickTask
      || !selectedQuickTask._id
    );

    const isFetching = (
      firmStore.selected.isFetching
      || clientStore.selected.isFetching
      || quickTaskStore.selected.isFetching
    )

    let progressClass = classNames(
      `progress-bar-${percentComplete || 0}`
    )
    const iconClass = classNames(
      '-icon'
      , { '-completed' : selectedQuickTask && selectedQuickTask.status === 'closed' }
    )
    return (
      <PortalLayout>
        <Helmet><title>Task details</title></Helmet>
        <Link className="-back-link" to={`/portal/${match.params.clientId}/quick-tasks`}>
          <span className="-icon"><i className="fal fa-angle-left"/> </span> Back to tasks
        </Link>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>
            : 
            <em>Quick task not found.</em>
          )
          :
          selectedQuickTask.visibility === 'active' ?
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedQuickTask.type === 'signature' ? 'Signature Request' : "File Request" }</h1>
            <hr/>
            {/* <p> {selectedQuickTask.prompt} </p> */}
            <div dangerouslySetInnerHTML={{__html: selectedQuickTask.prompt || ""}}></div>
            <div className="-portal-content">
              <div className="yt-row with-gutters space-between">
                <div className="yt-col full s_60 m_50">
                  <div style={{marginBottom: '1em'}}>
                    <p><small>{selectedQuickTask.status === 'open' ? `Completed ${percentComplete}%`: 'Complete!' } </small></p>
                    <div className={progressClass} >
                      <div className="-progress">
                        <div className="-complete">
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="task-viewer -portal">
                    <div className={iconClass}>
                    { selectedQuickTask && selectedQuickTask.status == 'closed'? 
                      <span style={{color: 'green'}}>
                        <i className="fas fa-check-circle fa-2x"/>
                      </span>
                      : percentComplete > 0 && percentComplete < 100 ?
                      <span style={{color: 'green'}}>
                        <i className="fad fa-spinner-third fa-2x"></i>
                      </span>
                      :
                      <i className="fal fa-circle fa-2x"/>
                    }
                    </div>
                    <div className="-content">
                    { selectedQuickTask.type === 'signature' ?
                      submitting ? // When redirected back to this page after signing, we set submitting to true so the user isn't confused while we download the doc and update the task.
                        <div className="u-pullLeft">
                          <div className="loading"></div>
                        </div>
                        :
                        selectedQuickTask._returnedFiles && selectedQuickTask._returnedFiles.length > 0 ?
                          selectedQuickTask._returnedFiles.map((fileId, i) => 
                            <FileMicroListItem
                              key={fileId + '_' + i}
                              file={fileStore.byId[fileId]}
                              // Standard file path
                              filePath={`/portal/${match.params.clientId}/files/${fileId}`}
                            />
                          )
                        :
                        signingLink ?
                          !signingLink.responseDate ? // User has not yet signed. Show the link.
                          <a onClick={this._handleViewUserLink} className="yt-btn xx-small bordered info">View signature request</a>
                          :
                          <div>
                            <p style={{textAlign: "left"}}>You've already signed this document</p>
                            <p style={{textAlign: "left"}}><small>Remaining Signer(s):</small></p>
                            { selectedQuickTask.signingLinks.map((link, i) => (
                                link.signatoryEmail != loggedInUser.username && !link.responseDate ?
                                <p key={selectedQuickTask._id + '_' + i} style={{textAlign: "left"}}><small>{link.signatoryEmail}</small></p>
                                :
                                null
                              )
                            )}
                          </div>
                        :
                        // Has no signing link. This clientUser isn't required to sign this document.
                        <div>
                          <p style={{textAlign: "left"}}>You are not the requested signer on this task</p>
                          <p style={{textAlign: "left"}}><small>Requested Signer(s):</small></p>
                          {selectedQuickTask.signingLinks.map((link, i) => <p key={selectedQuickTask._id + '_' + i} style={{textAlign: "left"}}><small>{link.signatoryEmail}</small></p>)}
                        </div>
                      :
                      selectedQuickTask.type === 'file' ?
                      <div className="yt-row">
                      { !submitted ?
                        !submitting ?
                        !preparing ?
                        <div className="-request-file-input" style={{ width: 300 }}>
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
                        <div className="yt-col full" key={file.name + "_" + i} style={{padding: '1em'}}>
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
                            <button className="yt-btn small info" onClick={() => this.setState({ submitted: false, files: [] })}>Upload more files</button> 
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
                            <button className="yt-btn small warning" onClick={() => this.setState({ submitted: false, files: [] })}>Try again</button> 
                          </div>
                        }
                        </div>
                      }
                      {selectedQuickTask._returnedFiles && selectedQuickTask._returnedFiles.length > 0 ?
                        selectedQuickTask._returnedFiles.map((fileId, i) =>
                        <div className="yt-col full" key={fileId + '_' + i}>
                          <FileMicroListItem
                            file={fileStore.byId[fileId]}
                            // Standard file path
                            filePath={`/portal/${match.params.clientId}/files/${fileId}`}
                          />
                        </div>
                        )
                        :
                        null
                      }
                      </div>
                      :
                      null
                    }
                    </div>
                  </div>
                </div>
                <div className="yt-col full s_40 m_25 portal-info-helper">
                  <div className="-content-box">
                    <div className="-icon">
                      <i className="fal fa-lightbulb-on"/>
                    </div>
                    <p>Automated Requests are a collection of action items between you and the {selectedFirm ? selectedFirm.name : null} team. They provide you with an easy way to understand exactly what you need to deliver and when you need to deliver it.</p>
                  </div>
                  {/* <div className="-need-help" style={{marginTop: '32px'}}>
                    <p className="u-centerText">Need help?</p>
                    <button className="yt-btn bordered block x-small info">Schedule a call</button>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
          :
          <div>
            <h1>Oops!</h1>
            <hr/>
            <p>This task is no longer available.</p>
          </div>
        }
      </PortalLayout>
    )
  }
}

PortalSingleQuickTask.propTypes = {
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
    , socket: store.user.socket
    , tagStore: store.tag
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PortalSingleQuickTask)
);
