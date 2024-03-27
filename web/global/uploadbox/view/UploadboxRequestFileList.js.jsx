import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

import _ from 'lodash';
import Auth from '../../utils/auth';
import Binder from '../../components/Binder.js.jsx';

// import actions 
import * as quickTaskActions from '../../../resources/quickTask/quickTaskActions';
import * as clientActions from '../../../resources/client/clientActions';
import * as shareLinkActions from '../../../resources/shareLink/shareLinkActions';
import * as fileActions from '../../../resources/file/fileActions';
import * as firmActions from '../../../resources/firm/firmActions';
import * as userActions from '../../../resources/user/userActions';

// import global
import { FileInput } from '../../components/forms';
import PracticeTopNav from '../../practice/components/PracticeTopNav.js.jsx';

// import views
import ViewFileRequest from '../../../resources/shareLink/views/ViewFileRequest.js.jsx';

// import components 
import UploadboxLoading from '../components/UploadboxLoading.js.jsx';
import UploadboxAccount from '../components/UploadboxAccount.js.jsx';
import { shareLink } from '../../../config/resourceReducers';

class UploadboxRequestFileList extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            list: []
            , selected: null
            , files: []
            , preparing: false
            , progressPercent: []
            , progressError: []
            , submitting: false
            , submitted: false
            , errorMessage: ''
            , firm: null
            , showMenuBar: false
            , logout: false
        }

        this._bind(
            '_handleFilesChange'
            , '_handleSubmitFiles'
            , '_handleReload'
            , '_logout'
        );
        const { dispatch, match, loggedInUser, socket } = this.props;

        socket.on('disconnect', reason => {
            // We've been disconnected for some reason. Reconnect.
            socket.open();
        });

        // The connect event also fires on reconnect. That's when this will be hit since this component will not
        // yet be mounted when the socket first connects (when layout.pug is loaded).
        socket.on('connect', () => {
            console.log('SUBSCRIBE', socket);
            // console.log('Connected!');
            if (loggedInUser && loggedInUser._id) {
                // file progress is sent to req.user._id if the user is logged in.
                socket.emit('subscribe', loggedInUser._id);
            }
        });

        socket.on('upload_progress', (progress, index) => {
            let progressPercent = _.update(_.cloneDeep(this.state.progressPercent), index, () => {
                return progress;
            });
            this.setState({ progressPercent });
        })
    
        // Used to display an error on a single file upload.
        socket.on('upload_progress_error', (error, index) => {
            // console.log('Upload progress error', error);
            // let progressError = _.update(_.cloneDeep(this.state.progressError), index, () => {
            //     return error;
            // });
            // this.setState({ progressError });
        })
    
        socket.on('upload_finished', (files) => {
            let quickTask = this.state.selected;

            if (quickTask) {
                const newFileIds = files.map(file => file._id);

                // add the files to the quickTask files array and update the quickTask.
                quickTask._returnedFiles =  quickTask._returnedFiles.concat(newFileIds);
                dispatch(quickTaskActions.sendUpdateQuickTaskWithPermission(quickTask));    
                this.setState({
                    progressPercent: []
                    , submitting: false
                    , submitted: true
                });
            } else {
                this.setState({
                    progressPercent: []
                    , submitting: false
                    , submitted: true
                });
            }
        });

        // Used to display an overall file upload error.
        socket.on('upload_finished_error', (error) => {
            console.log("UPLOAD FINISHED ERROR!!!", error);
            this.setState({
                progressPercent: []
                , submitting: false
                , submitted: true
                , errorMessage: error
            });
        }); 
    }

    componentDidMount() {
        const { dispatch, match, loggedInUser, socket, computedMatch } = this.props;
        const clientId = match.params.clientId || computedMatch.params.clientId;
        
        // dispatch(quickTaskActions.fetchList('_client', clientId, 'visibility', 'active', ''));
        // dispatch(shareLinkActions.fetchList('_client', clientId));
        dispatch(clientActions.fetchSingleIfNeeded(clientId)).then(json => {
            if (json.success) {
                dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id)).then(resFirm => {
                    let selectedFirm = {};
                    if (resFirm.success) {
                        selectedFirm = resFirm.list.filter(res => res._id === json.item._firm)[0];
                        this.setState({ firm: selectedFirm });
                    } else {
                        selectedFirm.name = 'This firm'; 
                        this.setState({ firm: selectedFirm });
                    }
                });
            }
        });

        dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id)).then(firm => {
            if (firm.success && firm.firms) {
              firm.firms.map(f => {
                dispatch(clientActions.fetchListIfNeeded('_firm', f._id)).then(clientStore => {
      
                });
              })
            }
        });        
        
        if (socket && socket.disconnected) {
            // console.log('socket isnt connected. opening');
            socket.open();
        } else if(socket && socket.connected) {
            
            // User may not be logged in. Check before we try to subscribe to a private channel.
            if(loggedInUser && loggedInUser._id) {
                // file progress is sent to req.user._id if the user is logged in.
                socket.emit('subscribe', loggedInUser._id);
            }
        }
    }

    _logout(e) {
        const { dispatch, history } = this.props;
        this.setState({ logout: true });
        dispatch(userActions.sendLogout()).then((action) => {
            this.setState({ logout: false });
            if (action.success) {
                // redirect to index
                localStorage.clear();
                history.replace('/login');
            } else {
                alert("ERROR LOGGING OUT - " + action.message);
            }
        })
    }

    _handleFilesChange(files) { 
        this.setState({files})
    }

    _handleSubmitFiles() {
        const { dispatch, clientStore } = this.props;
        const { files, selected } = this.state;
        const client = clientStore.selected.getItem();

        this.setState({ preparing: true });

        // convert to a FormData objet to allow uploading file=
        if(files.length < 1) {

          alert("No files present");

        } else {

            // build formdata to upload file
            let formData = new FormData()
            Object.keys(files).forEach(key => {
                console.log("debug", key, files[key]);
                const file = files[key];
                formData.append(key, new Blob([file], { type: file.type }), file.name || 'file');
            });

            let filePointers = {
                _firm: client._firm
                , status: 'visible' // files uploaded by a client should be visible to the client.
                , _client: client._id
            };

            // add file pointers 
            Object.keys(filePointers).forEach(key => {
                formData.append(key, filePointers[key]);
            });

            dispatch(fileActions.sendCreateFiles(formData)).then(json => {
                console.log('after upload', json.success);
                if (json.success) {
                    this.setState({ submitting: true, preparing: false });
                } else {
                    this.setState({
                        errorMessage: json.error
                        , files: []
                        , preparing: false
                        , submitted: true
                    });
                }
            });
        }
    }

    _handleReload() {
        this.setState({
            files: []
            , submitted: false
            , progressPercent: []
            , progressError: []
        });
    }

    render() {

        const { 
            list
            , selected
            , files
            , preparing
            , submitted
            , submitting
            , progressError
            , errorMessage
            , progressPercent
            , firm
            , showMenuBar } = this.state;
        const { 
            clientStore
            // , quickTask
            // , quickTaskStore
            , firmStore
            , history } = this.props;

        const client = clientStore.selected.getItem();
        let secretQuestion = null;

        // loading
        const isLoading = (
            !clientStore
            || clientStore.selected.isFetching
            // || !quickTaskStore
            // || quickTaskStore.selected.isFetching
            || !firmStore
            || firmStore.selected.isFetching
            || !firm
            // || !shareLinkStore
            // || shareLinkStore.selected.isFetching
        )

        // // date format
        // const date = (date) => { return new Intl.DateTimeFormat('en', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(date)); }
        // const time = (date) => { return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date(date)); }

        // if (!isLoading && selected) {
        //     const shareLinks = shareLinkStore.byId;
        //     if (shareLinks && !_.isEmpty(shareLinks)) {
        //         Object.keys(shareLinks).filter(id => {
        //             if (shareLinks[id]._quickTask === selected._id) {
        //                 secretQuestion = shareLinks[id];
        //                 return null;
        //             } else {
        //                 return null;
        //             }
        //         });
        //     }
        // }

        return (
            <div className="practice-layout">
                {/* <div className="-mobile-only -open-nav-icon" onClick={() => this.setState({ showMenuBar: !showMenuBar })}><i className="fal fa-lg fa-bars" aria-hidden="true"></i></div>
                <div className={`sidebar practice-sidebar ${showMenuBar ? '-with-menubar':''}`}>
                    <ul className="side-nav">
                        <li key="key0">
                            <span className="-icon"><i className={`fal fa-upload ${(selected ? '': '-active')}`} aria-hidden="true"></i></span>
                            <p className={'-upload-new ' + (selected ? '' : '-active')} onClick={() => this.setState({ selected: null })}>Upload New Files</p>
                        </li>
                        <li key="key1">
                            <span className="-icon"><i className={`fal fa-file-alt ${(selected ? '-active': '')}`} aria-hidden="true"></i></span>
                            <p className={selected ? '-active' : ''}>Active Request List</p>
                            {
                                isLoading ? <UploadboxLoading />
                                :
                                <div>
                                    {
                                        quickTask.length ?
                                        quickTask.map((currentTask, i) => 
                                            <span className={'request '+(selected ? selected._id===currentTask._id ? '-active': '' : '')}  key={`quicktask${i}`} onClick={() => this.setState({ selected: currentTask })} >
                                                <div className="-icon"><i className="fal fa-circle fa-1x" aria-hidden="true"></i></div>
                                                {`${date(currentTask.updated_at)} - ${time(currentTask.updated_at)}`}
                                            </span>
                                        )
                                        :
                                        <span className="-red">No active request.</span>                                        
                                    }
                                </div>
                            }
                        </li>
                    </ul>
                </div> */}
                <div className="practice-main-content">                  
                    <div className="content">
                        {
                            isLoading || this.state.logout ? <UploadboxLoading />
                            :
                            <div className="yt-container slim">
                                <h3>{ selected ? `${firm.name} is requesting files` : `Upload new files in ${firm.name}` }</h3>
                                <p className="u-muted">for {`${client ? client.name : 'client' }`}</p>
                                <hr/>
                                {
                                    !submitted ?
                                        !submitting ?
                                            preparing ? <span><i className="fas fa-spinner fa-spin"/>{` Preparing file${files.length > 1 ? 's...' : '...'}`}</span>
                                            : 
                                            <div className=" yt-col full m_100">
                                                <div className="-request-file-input">
                                                    <FileInput
                                                        change={this._handleFilesChange}
                                                        multiple={true}
                                                        required={true}
                                                        // label={selected ? selected.prompt ? `Instruction: ${selected.prompt}` : '' : '' }
                                                    />
                                                    <button className="yt-btn small block info" disabled={!files.length} onClick={this._handleSubmitFiles}>
                                                        { selected ? 'Submit' : 'Upload & save' }
                                                    </button>
                                                </div>
                                            </div>                                         
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
                                                        <div className="-complete"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    :
                                    <div className="hero">
                                        { !errorMessage && progressError.length === 0 ?
                                            <div className="u-centerText">
                                                <h3>{ selected ? 'Files submitted successfully.' : 'Successfully uploaded' }</h3>
                                                {/* calling handleReload so we can refetch the shareLink with the updated files array. */}
                                                <button className="yt-btn small info" onClick={this._handleReload}>Upload more files</button>
                                            </div>
                                            :
                                            <div className="u-centerText">
                                                <h3>Something went wrong.</h3>
                                                <p>{errorMessage}</p>
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
                <UploadboxAccount logout={this._logout} />
            </div>
        );
    }
}

UploadboxRequestFileList.propTypes = {
    history: PropTypes.object.isRequired
};

const mapStoreToProps = (store) => {
    /**
    * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
    * differentiated from the React component's internal state
    */

    // const loggedInUser = store.user.loggedIn.user;
    // const clientList = store.client ? store.client.byId : [];


    let quickTask = store.quickTask && store.quickTask.byId ? store.quickTask.byId : [];
    quickTask = Object.keys(quickTask).map(a => store.quickTask.byId[a]);

    return {
        // loggedInUser: store.user.loggedIn.user
        loggedInUser: store.user.loggedIn.user
        , clientStore: store.client 
        , socket: store.user.socket
        , quickTask: quickTask
        , quickTaskStore: store.quickTask
        , firmStore: store.firm
        , shareLinkStore: store.shareLink
    }
  }
  
  export default withRouter(
    connect(
      mapStoreToProps
    )(UploadboxRequestFileList)
  );
  