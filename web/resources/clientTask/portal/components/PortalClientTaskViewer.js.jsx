/**
 * Boilerplate code for a new Redux-connected view component.
 * Nice for copy/pasting
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import { DateTime } from 'luxon';

// import actions
import * as activityActions from '../../../activity/activityActions';
import * as fileActions from '../../../file/fileActions';
import * as clientTaskResponseActions from '../../../clientTaskResponse/clientTaskResponseActions';
import * as clientTaskActions from '../../../clientTask/clientTaskActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import { FileInput, TextAreaInput } from '../../../../global/components/forms';


// import resource components
import FileMicroListItem from '../../../file/components/FileMicroListItem.js.jsx';
import AttachFilesModal from '../../../file/components/AttachFilesModal.js.jsx';
import UploadFilesModal from '../../../file/components/UploadFilesModal.js.jsx';
import FileDeliveryListItem from '../../../file/components/FileDeliveryListItem.js.jsx';

class PortalClientTaskViewer extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      content: ''
      , attachFilesModalOpen: false
      , attachedFiles: []
      , newFiles: []
      , formEdited: false
      , showResponder: props.clientTaskResponses && props.clientWorkflowStatus ? props.clientTaskResponses.length < 1 && props.clientWorkflowStatus === 'published' : false
      , submitting: false
      , uploadFilesModalOpen: false
    }
    this._bind(
      '_handleAttachFiles'
      , '_handleFilesChange'
      , '_handleFormChange'
      , '_handleRemoveFile'
      , '_handleSubmitForReview'
      , '_getUserSigningLink'
      , '_handleUploadedFiles'
    )
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    // fire actions
  }

  _handleFilesChange(files) {
    // console.log('-------- files -----');
    // console.log(files);
    this.setState({newFiles: files})
  }

  _handleAttachFiles(fileIds) {
    this.setState({
      attachedFiles: fileIds
    });
  }

  _handleUploadedFiles(files) {
    const fileIds = files.map(file => file._id);
    this._handleAttachFiles(fileIds)
    this.setState({
      uploadFilesModalOpen: false
    });
    files.map(file => {
      this.props.dispatch(fileActions.addSingleFileToMap(file))
    });
  }

  _handleRemoveFile(fileId) {
    let nextAttachedFiles = _.cloneDeep(this.state.attachedFiles)
    const fileIndex = nextAttachedFiles.indexOf(fileId)
    if(fileIndex !== -1) {
      nextAttachedFiles.splice(fileIndex, 1)
      this.setState({
        attachedFiles: nextAttachedFiles
      });
    }
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    newState.formEdited = true;
    this.setState(newState);
  }

  _handleSubmitForReview() {
    const { close, dispatch, firmStore, loggedInUser, match, clientTask } = this.props;

    this.setState({submitting: true})

    // convert to a FormData objet to allow uploading file=
    const { attachedFiles, newFiles } = this.state;
    if(newFiles.length < 1 && attachedFiles.length < 1) {
      // this is NOT a file responder
      let newClientTaskResponse = {
        _user: loggedInUser._id
        , _clientTask: clientTask._id 
        , _clientWorkflow: match.params.clientWorkflowId
        , content: this.state.content 
      }
      dispatch(clientTaskResponseActions.sendCreateClientTaskResponse(newClientTaskResponse)).then(trRes => {
        if(trRes.success) {
          dispatch(clientTaskActions.invalidateList('_clientWorkflow', match.params.clientWorkflowId));
          dispatch(clientTaskActions.fetchListIfNeeded('_clientWorkflow', match.params.clientWorkflowId));
          dispatch(clientTaskResponseActions.invalidateList('_clientWorkflow', match.params.clientWorkflowId));
          dispatch(clientTaskResponseActions.fetchListIfNeeded('_clientWorkflow', match.params.clientWorkflowId));
          this.setState({
            content: ''
            , formEdited: false
            , submitting: false
            , showResponder: false
          });
        }
      })
    } else if(attachedFiles.length > 0) {
      const newClientTaskResponse = {
        _user: loggedInUser._id
        , _clientTask: clientTask._id
        , _clientWorkflow: match.params.clientWorkflowId
        , _files: attachedFiles
      }
      dispatch(clientTaskResponseActions.sendCreateClientTaskResponse(newClientTaskResponse)).then(trRes => {
        if(trRes.success) {
          dispatch(clientTaskActions.invalidateList('_clientWorkflow', match.params.clientWorkflowId));
          dispatch(clientTaskActions.fetchListIfNeeded('_clientWorkflow', match.params.clientWorkflowId));
          dispatch(clientTaskResponseActions.invalidateList('_clientWorkflow', match.params.clientWorkflowId));
          dispatch(clientTaskResponseActions.fetchListIfNeeded('_clientWorkflow', match.params.clientWorkflowId));
        }
        this.setState({
          submitting:false
          , attachedFiles: []
          , showResponder: false 
        })
      })
    }
  }

  _getUserSigningLink() {
    const { clientTask, loggedInUser } = this.props;
    // NOTE: singingLinks is an array of objects. Filter it down by comparing the signatoryEmail with the loggedInUser's email.
    const signingLinkObj = clientTask.signingLinks.filter(link => link.signatoryEmail == loggedInUser.username)[0];
    if(signingLinkObj && signingLinkObj.url) {
      return signingLinkObj.url;
    } else {
      return null
    }
  }

  render() {
    const {
      fileStore
      , firmStore
      , match
      , clientTask 
      , clientTaskResponses
      , clientWorkflowStatus
      , loggedInUser
    } = this.props;

    // const isComplete = (clientTask && clientTask.status == 'completed') || (clientTask && clientTask.type !== "signature-request" && !clientTask.needsApproval && clientTaskResponses && clientTaskResponses.length > 0);
    const isComplete = clientTask && clientTask.status == 'completed';

    const iconClass = classNames(
      '-icon'
      , { '-completed' : isComplete }
    )

    const isEmpty = !clientTask;

    // NOTE: should clientTasks or clientTaskResponse have the rejected field? if a task gets rejected
    //       its hard to display which part or why it was rejected, especially when there might be multiple
    //       attempts going back and forth 

    const signingLink = this._getUserSigningLink();
    const loggedInUserResponse = clientTaskResponses.filter(response => response._user == loggedInUser._id)[0]
    // awaitingSignatures only matters on signature requests that have more than one signer requiring us to show an inbetween state when some signers have signed and others have not.
    const awaitingSignatures = clientTask && clientTask.type === 'signature-request' && clientTask.status === 'open' && clientTask.signingLinks.length > 1 && clientTaskResponses.length > 0;
    return (
      <div>
        { isEmpty ? 
          <div className="loading"></div>
          :
          <div className="task-viewer -portal">
            <div className={iconClass}>
            { clientTask && clientTask.status == 'awaitingApproval'? 
                <span style={{color: '#EFC107'}}>
                  <i class="fas fa-exclamation-circle fa-2x"></i>
                </span>
                : isComplete ?
                <span style={{color: 'green'}}>
                  <i className="fas fa-check-circle fa-2x"/>
                </span>
                : awaitingSignatures ?
                <span style={{color: 'green'}}>
                  <i className="fad fa-spinner-third fa-2x"></i>
                </span>
                :
                <i className="fal fa-circle fa-2x"/>
              }
            </div>
            <div className="-content">
              <strong>{clientTask.title}</strong><br/>
              <span>{clientTask.description}</span>
              { clientTask.status == 'awaitingApproval' ? 
                <b style={{color: '#EFC107'}} className="link danger">Awaiting Approval</b>
              : clientTask.status == 'open' && clientTask.needsApproval ?
                <b style={{color: '#F5684D'}}>Needs Approval</b>
              : null
              }
              <div className="-task-actions">
                { clientTaskResponses.map((tr, i) => 
                  <div key={tr._id + '_' + i}>
                    {tr._files.map((fileId, j) =>
                      <FileMicroListItem
                        key={fileId + '_' + j}
                        file={fileStore.byId[fileId]}
                        filePath={`/portal/${match.params.clientId}/files/${fileId}`}
                      />
                    )}
                    <p>{tr.content}</p>
                  </div>
                )}
                { clientTask.status == 'open' ?
                  <div className="-inputs" style={{textAlign: 'center'}}>
                    { clientTask.type === 'document-request' ?
                      <div className="yt-row">
                        <button className="yt-btn link xx-small" onClick={() => this.setState({uploadFilesModalOpen: true})}>
                          Upload files
                        </button>
                        <button className="yt-btn link xx-small" onClick={() => this.setState({attachFilesModalOpen: true})}>
                          or select existing files...
                        </button>
                        {this.state.attachedFiles && this.state.attachedFiles.length > 0 ?
                          this.state.attachedFiles.map((fileId, i) => 
                            <FileDeliveryListItem
                              key={fileId + '_' + i}
                              file={fileStore.byId[fileId]}
                              filePath={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/files/${fileId}`}
                              removeFile={this._handleRemoveFile}
                              allowRemove={true}
                            />
                          )
                          :
                          null
                        }
                      </div>
                      : 
                      clientTask.type === 'document-delivery' ?
                      clientTask._files.map((fileId, k) => 
                      // TODO: This needs to look different from the regular FileMicroListItem since the client is supposed to download it.
                        <FileMicroListItem
                          key={fileId + '_' + k}
                          file={fileStore.byId[fileId]}
                          // Standard file path
                          filePath={`/portal/${match.params.clientId}/files/${fileId}`}
                        />
                      )
                      :
                      clientTask.type === 'signature-request' ?
                        signingLink ?
                        // Only show the signingLink if the user has not yet signed.
                        !loggedInUserResponse ?
                        // Has signing link and hasn't signed. Show the link.
                        <a href={`${signingLink}`} className="yt-btn xx-small bordered info">View signature request</a>
                        :
                        // Has a signingLink but has already signed.
                        <div>
                          <p style={{textAlign: "left"}}>You've already signed this document</p>
                          <p style={{textAlign: "left"}}><small>Remaining Signer(s):</small></p>
                          {clientTask.signingLinks.map((link, i) => {
                            return (
                              link.signatoryEmail != loggedInUser.username ?
                              <p key={clientTask._id + '_' + i} style={{textAlign: "left"}}><small>{link.signatoryEmail}</small></p>
                              :
                              null
                            )
                          }
                          )}
                        </div>
                        :
                        // Has no signing link. This clientUser isn't required to sign this document.
                        <div>
                          <p style={{textAlign: "left"}}>You are not the requested signer on this task</p>
                          <p style={{textAlign: "left"}}><small>Requested Signer(s):</small></p>
                          {clientTask.signingLinks.map((link, i) => <p key={clientTask._id + '_' + i} style={{textAlign: "left"}}><small>{link.signatoryEmail}</small></p>)}
                        </div>
                      :
                      clientTask.type === 'text' ?
                      <TextAreaInput
                        change={this._handleFormChange}
                        name="content"
                        placeholder={`Type your answer here...`}
                        rows="3"
                        value={this.state.content || ''}
                      />
                      :
                      null
                    }
                  </div>
                  :
                  null 
                }
                { clientTaskResponses.length > 0 && clientWorkflowStatus === 'published' && clientTask.status === 'open' && clientTask.type !== 'signature-request' ?
                // { clientTaskResponses.length > 0 ?
                  <button className="yt-btn xx-small info link" onClick={() => this.setState({showResponder: !this.state.showResponder})}>{this.state.showResponder ? 'Cancel' : clientTask.type === 'file' ? 'Add files' : 'Add response'}</button>
                  : 
                  null 
                }
                { this.state.attachedFiles.length > 0 || this.state.newFiles.length > 0 || this.state.formEdited ?
                  <button className="yt-btn x-small info " disabled={this.state.submitting} onClick={this._handleSubmitForReview}>{this.state.submitting ? 'Submitting...' : 'Submit for review'}</button>
                  :
                  null 
                }
              </div>
            </div>
            <UploadFilesModal
              close={() => this.setState({uploadFilesModalOpen: false})}
              handleUploaded={this._handleUploadedFiles}
              isOpen={this.state.uploadFilesModalOpen}
              filePointers={{
                _client: match.params.clientId
                , _firm: firmStore.selected.id
                , status: 'visible'
              }}
              showStatusOptions={false}
            />
            <AttachFilesModal
              close={() => this.setState({attachFilesModalOpen: false})}
              fileListArgsObj={{'~client': match.params.clientId, 'status': 'visible'}}
              isOpen={this.state.attachFilesModalOpen}
              onSubmit={this._handleAttachFiles}
              viewingAs="client"
              isConfigScreenView={true}
            />
          </div>
        }
      </div>
    )
  }
}

PortalClientTaskViewer.propTypes = {
  dispatch: PropTypes.func.isRequired
  , clientTask: PropTypes.object
  , clientTaskResponses: PropTypes.arrayOf(PropTypes.object)
}

PortalClientTaskViewer.defaultProps = {
  clientTask: null
  , clientTaskResponses: []
}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    fileStore: store.file 
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user 
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PortalClientTaskViewer)
);
