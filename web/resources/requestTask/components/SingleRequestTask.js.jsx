/**
 * View component for /firm/:firmId/workspaces/:clientId/files 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import { Helmet } from 'react-helmet';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { DateTime } from 'luxon';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import FileInput from '../../../global/components/forms/FileInput.js.jsx';

import * as fileActions from '../../file/fileActions';
import * as requestTaskActions from '../requestTaskActions';
import * as taskActivityActions from '../../taskActivity/taskActivityActions';
import * as userActions from '../../user/userActions';

class SingleRequestTask extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            files: []
            , preparing: false
            , refetch: null
            , submitted: false 
            , submitting: false
            , progressPercent: []
            , progressError: []
        }
        this._bind(
            '_handleFilesChange'
            , '_handleSubmitFiles'
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
        });

        socket.on('upload_progress', (progress, index) => {
            let newProgress = _.update(_.cloneDeep(this.state.progressPercent), index, () => {
                return progress;
            });
            this.setState({progressPercent: newProgress});
        });

        // Used to display an error on a single file upload.
        socket.on('upload_progress_error', (error, index) => {
            let newProgressError = _.update(_.cloneDeep(this.state.progressError), index, () => {
                return error;
            });
            this.setState({progressError: newProgressError});
        });

        socket.on('upload_finished', (files) => {
            const { dispatch, match, requestTask, selectedFirm, fromShareLink, userEmail } = this.props;
            requestTask["_firm"] = selectedFirm._id;
            files.map(file => {
                if (requestTask && requestTask._returnedFiles && !requestTask._returnedFiles.includes(file._id)) {
                    requestTask._returnedFiles.push(file._id);
                }
            });
            if (fromShareLink && !(loggedInUser && loggedInUser.username)) {
                requestTask["user"] = { username: userEmail };
            }
            dispatch(requestTaskActions.sendUpdateRequestTaskbyClientUser(requestTask)).then(json => {
                if (!json.success) {
                  alert(json.error);
                } else {

                    dispatch(fileActions.fetchNewFileList({ files, success: true }, ['~client', match.params.clientId, 'status', 'visible']));
                    dispatch(fileActions.fetchListIfNeeded('~client', match.params.clientId, 'status', 'visible'));
                    this.setState({
                        submitted: true
                        , submitting: false
                        , progressPercent: []
                    }, () => {
                        if (json.taskActivity) {
                            dispatch(taskActivityActions.addSingleTaskActivityToMap(json.taskActivity));
                            dispatch(taskActivityActions.addTaskActivityToList(json.taskActivity, ...['_requestTask', requestTask._id]));        
                        }
                    });
                }
            });
        });
      
        // Used to display an overall file upload error.
        socket.on('upload_finished_error', (error) => {
            // console.log("UPLOAD FINISHED ERROR!!!", error);
            this.setState({
                progressPercent: []
                , submitted: true
                , submitting: false
                , errorMessage: error
            })
        });
    }

    componentDidMount() {
        const { dispatch, loggedInUser, match, socket, requestTask } = this.props
        if (socket && socket.disconnected) {
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

        const clientId = match.params.clientId ? match.params.clientId
        : requestTask && requestTask._client ? requestTask._client: null;
    }

    _handleFilesChange(files) {
        // console.log('-------- files -----');
        // console.log(files);
        this.setState({files});
    }

    _handleSubmitFiles(e) {
        const { dispatch, requestTask, selectedFirm = {}, userEmail, fromShareLink, loggedInUser } = this.props;
        if(e) {
            e.preventDefault();
        }

        if (requestTask && requestTask.status !== "published") {
            return;
        }
        
        this.setState({ preparing: true });

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
                _client: requestTask._client
                , _firm: selectedFirm._id
                , status: 'visible' // files uploaded by a client should be visible to the client.
            }
            if (requestTask && requestTask._folder) {
                filePointers._folder = requestTask._folder;
            }
            if (userEmail && fromShareLink && !(loggedInUser && loggedInUser.username) && requestTask && requestTask.assignee && requestTask.assignee.length) {
                let user = requestTask.assignee.filter(assignee => _.lowerCase(assignee.username) == (_.lowerCase(userEmail)));
                console.log("user 1", user);
                user = user && user.length ? user[0] : null;
                if (user && user.firstname && user.lastname) {
                    filePointers.uploadName = `${user.firstname} ${user.lastname}`;
                } else if (user && user.username) {
                    filePointers.uploadName = `${user.username}`;
                } else {
                    filePointers.uploadName = `(not verified user)`;
                }
            }
            // add file pointers 
            Object.keys(filePointers).forEach(key => {
                formData.append(key, filePointers[key]);
            });
            dispatch(requestTaskActions.sendUploadFiles(requestTask.hex, formData)).then((result) => {
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

    render() {
        const { 
            requestTask
            , match
            , selectedFirm
            , fromShareLink
        } = this.props;
        const {
            files
            , preparing
            , submitted
            , submitting
            , progressError
            , progressPercent
            , errorMessage
        } = this.state;

        const statusText = requestTask ? requestTask.status === "published" ? "In Progress" : requestTask.status === "completed" ? "Completed" : "Please wait..." : "";
        const statusClassIcon = requestTask ? requestTask.status === "published" ? "fal fa-check-circle fa-2x" : "fas fa-check-circle fa-2x" : "fal fa-circle fa-2x";
    
        if (!requestTask) {
            return null;
        }
        // const viewActivityLink = fromShareLink ? `/request/request-task/${requestTask.hex}/${requestTask._id}/activity` : `/portal/${match.params.clientId}/request-task/${requestTask._id}/activity`;

        return (
            <div className="-overview-content" style={{ margin: 0 }}>
                <div className="content-detail">
                    {
                        fromShareLink ? null :
                        <div className="yt-row center-vert">
                            <Link className="-back-link" to={{ pathname: `/portal/${match.params.clientId}/request/${requestTask._request}/requestTask/${requestTask._id}/activity`, isViewing: "portal" }}>
                                View Task Activity
                            </Link>
                        </div>
                    }
                    <div className="yt-row center-vert">
                        <label className="-ov-title">Status:</label>
                        <i className={statusClassIcon} aria-hidden="true"></i>
                        <label>{statusText}</label>
                    </div>
                    {
                        requestTask.status === "published" ?
                        <div className="yt-row center-vert">
                            <label className="-ov-title">Request Date:</label>
                            <label>{DateTime.fromISO(requestTask.requestDate).toLocaleString(DateTime.DATE_SHORT)}</label>
                        </div> : null
                    }
                    <div className="yt-row center-vert">
                        <label className="-ov-title">Category:</label>
                        <label>{requestTask.category}</label>
                    </div>
                    <div className="yt-row center-vert">
                        <label className="-ov-title">Due Date:</label>
                        <label>{DateTime.fromISO(requestTask.dueDate).toLocaleString(DateTime.DATE_SHORT)}</label>
                    </div>
                    <div className="yt-row center-vert">
                        <label className="-ov-title">Description:</label>
                        <label>{requestTask.description}</label>
                    </div>
                    <div className="yt-row center-vert">
                        <label className="-ov-title -hide">Assignee:</label>
                        <div className="left-title-list">
                            <label className="-ov-title">Assignee:</label>
                            {requestTask.assignee.map((assignee, i) => 
                                <label key={i}>{assignee.firstname} {assignee.lastname}</label>
                            )}
                        </div>
                    </div>
                </div>
                {
                    requestTask && requestTask.status !== "published" ? null
                    :
                    !submitted ?
                    !submitting ?
                    !preparing ?
                    <div className="-request-file-input">
                        <FileInput
                            change={this._handleFilesChange}
                            multiple={true}
                            required={true}
                        />
                        <button className="yt-btn small block info" onClick={this._handleSubmitFiles} disabled={!files || files.length < 1 || submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>
                    </div>
                    : 
                    <div className="hero" style={{ paddingTop: "50px" }}>
                        <span><i className="fas fa-spinner fa-spin"/>{` Preparing file${files.length > 1 ? 's...' : '...'}`}</span>
                    </div>
                    : 
                    files.map((file, i) => 
                        <div className="yt-col full" key={file.name + "_" + i} style={{padding: '1em'}}>
                        {   progressError[i] ?
                            <p><small><strong>{file.name}</strong></small>{` - ${progressError[i]}`}</p>
                            :
                            <p><small><strong>{file.name}</strong></small>{` - ${progressPercent[i] || 0}%`}</p>
                        }
                            <div className={`progress-bar-${progressPercent[i] || 0}`} >
                                <div className="-progress"><div className="-complete"></div></div>
                            </div>
                        </div>
                    )
                    :
                    <div className="hero" style={{ paddingTop: "50px" }}>
                        { !errorMessage && progressError.length === 0 ?
                          <div className="u-centerText">
                            <h3>Submitted successfully.</h3>
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
            </div>
        )
    }
}

SingleRequestTask.propTypes = {
  dispatch: PropTypes.func.isRequired
}

SingleRequestTask.defaultProps = {

}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    loggedInUser: store.user.loggedIn.user
    , socket: store.user.socket
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(SingleRequestTask)
);
