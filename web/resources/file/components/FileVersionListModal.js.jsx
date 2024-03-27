/**
 * View component for /files/new
 *
 * Creates a new file from a copy of the defaultItem in the file reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import moment from 'moment';
import { DateTime } from 'luxon';

// import third-party libraries
import _ from 'lodash';
const async = require('async');

// import actions
import * as fileActions from '../fileActions';
import * as clientNoteActions from '../../clientNote/clientNoteActions';

// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from '../../../global/components/modals/Modal.js.jsx';
import { FileInput, CheckboxInput, SelectFromArray, TextInput } from '../../../global/components/forms';
import downloadsUtil from '../../../global/utils/downloadsUtil';
import fileUtils from '../../../global/utils/fileUtils'; 

// import file components

class FileVersionListModal extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            fileVersionListItem: null
            , allFilesSelected: false
            , selectedFileIds: []
            , onProcess: false
            , objClientNotes: []
        }
        this._bind(
            '_handleClose'
            , '_handleToggleSelectAll'
            , '_handleSelectFile'
            , '_handleArchiveFiles'
            , '_handleDownloadFiles'
            , '_downloadSelectedFiles'
            , '_handleLoad'
        );
    }

    componentDidMount() {
        const file = this.props.file;
        if (file && file._id) {
            this._handleLoad(file._id);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.file && nextProps.file._id) {
            this._handleLoad(nextProps.file._id);
        }
    }

    _handleLoad(id) {
        console.log("handle reload", id)
        const dispatch = this.props.dispatch;
        dispatch(fileActions.fetchVersionListIfNeeded(id)).then(json => {
            console.log("jsoooon", json)
            if (json && json.success && json.list) {
                this.setState({ fileVersionListItem: json.list, objClientNotes: json.objClientNotes });
            } 
        });
    }

    _handleClose() {
        const { close } = this.props;
        this._clearSelectedFileIds();
        if(close) {
            close()
        }
    }

    _handleToggleSelectAll() {
        const file = _.cloneDeep(this.props.file);
        const fileVersionListItem = _.cloneDeep(this.state.fileVersionListItem);
        const { selectedFileIds, allFilesSelected } = this.state; 
        if(selectedFileIds.length > 0 && allFilesSelected) {
          this._clearSelectedFileIds(); 
        } else if(fileVersionListItem) {
          let newSelectedFiles = _.cloneDeep(selectedFileIds); 
          fileVersionListItem.map(item => newSelectedFiles.indexOf(item._id) < 0 ? newSelectedFiles.push(item._id) : null);
          this.setState({selectedFileIds: newSelectedFiles, allFilesSelected: true });
        } else null;
    }

    _clearSelectedFileIds() {
        this.setState({ selectedFileIds: [], allFilesSelected: false, onProcess: false });
    }

    _handleSelectFile(file) {
        const fileId = file && file._id;
        let newFileIds = _.cloneDeep(this.state.selectedFileIds);
        if(newFileIds.indexOf(fileId) === -1) {
          newFileIds.push(fileId)
        } else {
          newFileIds.splice(newFileIds.indexOf(fileId), 1);
        }
        this.setState({
          selectedFileIds: newFileIds
        })
    }

    _handleArchiveFiles() {
        this.setState({ onProcess: true });
        const { selectedFileIds } = this.state; 
        const fileVersionListItem = _.cloneDeep(this.state.fileVersionListItem);
        const { dispatch, match, file, viewingAs } = this.props;
        const sendData = { 
          status: 'archived'
          , filesId: selectedFileIds
          , action: "status"
          , firmId: match.params.firmId
          , viewingAs
        };
    
        const newFileVersionListItem = fileVersionListItem.filter(item => !selectedFileIds.includes(item._id));
        this.setState({ archiveProcess: true, progressOpen: false });
        dispatch(fileActions.sendUBulkupdateFiles(sendData)).then(json => {
            this.setState({ onProcess: false, selectedFileIds: [], fileVersionListItem: newFileVersionListItem }, () => {
                if (this.props.handleSetInvalidList) {
                    this.props.handleSetInvalidList();
                }
            });
        })
    }

    _handleDownloadFiles() {
        this.setState({ onProcess: true });
        const { fileStore, socket, loggedInUser, allFilesFromListArgs, firm } = this.props; 
        const { selectedFileIds } = this.state;
        const sendData = {
          selectedFileIds
          , files: _.cloneDeep(allFilesFromListArgs)
          , filesMap: _.cloneDeep(fileStore.byId)
          , userLevel: 'staffclient'
          , socket
          , loggedInUser
        };
        
        if (selectedFileIds && selectedFileIds.length > 1 && firm && firm.zipFilesDownload) {
          downloadsUtil.bulkZipped(sendData, response => {
            this._clearSelectedFileIds();
          });
        } else if (selectedFileIds && selectedFileIds.length) {
          // download files
          let filesLinks = selectedFileIds.filter(id => id && fileStore.byId[id] && fileStore.byId[id].category !== "folder")
          .map(item => fileUtils.getDownloadLink(fileStore.byId[item]));
          this._downloadSelectedFiles(filesLinks, 0);
    
          // download folders
          let downloadFolders = selectedFileIds.flatMap(id => id && fileStore.byId[id] && fileStore.byId[id].category === "folder" ? [fileStore.byId[id]] : []);
          if (downloadFolders && downloadFolders.length) {
            async.map(downloadFolders, (folder, cb) => {
              downloadsUtil.singleZipped({ ...sendData, folder }, response => {
                cb();
              });
            }, () => {
              this._clearSelectedFileIds();
            });
          } else {
            this._clearSelectedFileIds();
          }
        } else {
          this._clearSelectedFileIds();
        }
    }

    _downloadSelectedFiles(downloadlinks, index) {
        if(index < downloadlinks.length) {
          var a  = document.createElement("a"); 
          a.setAttribute('href', `${downloadlinks[index]}?userLevel=staffclient&type=downloaded`); 
          a.setAttribute('download', '');
          a.setAttribute('target', '_blank');       
          a.click();
          index++;
          setTimeout(() => {
            this._downloadSelectedFiles(downloadlinks, index); 
          }, 500);
        }
      }

    render() {
        const { isOpen, file, userStore, viewingAs, firm, match, fileStore } = this.props;
        const fileVersionListItem = _.cloneDeep(this.state.fileVersionListItem);
        const objClientNotes = _.cloneDeep(this.state.objClientNotes);
        const {
            allFilesSelected
            , selectedFileIds
            , onProcess
        } = this.state;
        const utilFileStore = file && file._id ? fileStore.util.getSelectedStore('file-version', file._id) : null;
    

        const getConsumedStorage = (item) => {
            if (item && item.fileSize) {
                item.consumedStorage = parseInt(item.fileSize.toString()) / 1026;
                item.consumedStorage = item.consumedStorage.toFixed(2);
                item.consumedStorage += " KB";
                return item.consumedStorage;
            } else {
                return "0 KB";
            }
        }
        return (
        <Modal
            closeAction={this._handleClose}
            closeText="Cancel"
            // confirmAction={() => console.log('confirmation')}
            // confirmText={'Save'}
            // disableConfirm={false}
            cardSize="jumbo"
            isOpen={isOpen}
            modalHeader="File Versions"
        >
            <div>
                <div className="-share-link-configuration">
                    <div className="-body">
                        <div className="-setting yt-row space-between">
                            <h3 style={{ margin: 0, wordBreak: 'break-all' }}>
                                { file && file.filename }
                            </h3>
                            <div className="file-list-wrapper" style={{ width: '100%' }}>
                                <div className="yt-toolbar" style={{ position: 'inherit' }}>
                                    <div className="yt-tools space-between">
                                        <div className="-filters -left"></div>
                                        <div className="-options -right">
                                            <button disabled={selectedFileIds.length < 1 || onProcess} onClick={this._handleDownloadFiles} className="yt-btn x-small link info -share-files-option">
                                                Download { selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null}
                                            </button>
                                            {
                                                match.params.firmId || (viewingAs === "portal" && firm.allowDeleteFiles) ?
                                                <button disabled={selectedFileIds.length < 1 || onProcess} onClick={this._handleArchiveFiles} className="yt-btn x-small link info -share-files-option">
                                                    {viewingAs === "portal" ? "Delete" : "Archive"} { selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null}
                                                </button> : null
                                            }
                                        </div>
                                    </div>
                                </div>
                                <hr/>
                                <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table auto-size" style={{ opacity: onProcess ? '0.5' : 1 }}>
                                    <div>
                                        <div className="table-head">
                                            <div className="table-cell">
                                                <CheckboxInput
                                                    name="file"
                                                    value={allFilesSelected}
                                                    change={this._handleToggleSelectAll}
                                                    checked={allFilesSelected}
                                                />
                                            </div>
                                            <div className="table-cell -title">Date Uploaded</div>
                                            <div className="table-cell _15">Comment</div>
                                            <div className="table-cell _15">Size</div>
                                            <div className="table-cell _10">Visibility</div>              
                                            <div className="table-cell _15">Created By</div>
                                        </div>
                                    {
                                        !utilFileStore || utilFileStore.isFetching || !fileVersionListItem ?
                                        <div className="-loading-hero hero">
                                            <div className="u-centerText">
                                                <div className="loading"></div>
                                            </div>
                                        </div>
                                        :
                                        fileVersionListItem && fileVersionListItem.length ? 
                                        fileVersionListItem.map((oldFile, i) =>
                                            <div className="table-row" key={oldFile._id}>
                                                {/* <div className="table-cell _40">{DateTime.fromISO(oldFile.created_at).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}</div> */}
                                                <div className="table-cell">
                                                    <CheckboxInput
                                                        name="file"
                                                        value={selectedFileIds.includes(oldFile._id)}
                                                        change={this._handleSelectFile.bind(this, oldFile)}
                                                        checked={selectedFileIds.includes(oldFile._id)}
                                                    />
                                                </div>
                                                <div className="table-cell">
                                                    <Link to={
                                                        match.params.fileId && match.url ? match.url.replace(match.params.fileId, oldFile._id)
                                                        : match.url + '/' + oldFile._id
                                                    } onClick={this._handleClose}>{DateTime.fromISO(oldFile.created_at).toFormat('LL/dd/yyyy hh:mm:ss')}</Link>
                                                    {
                                                        i === 0 ?
                                                        <span style={{ padding: '0px 9px 3px', border: '1px solid green', color: 'green', borderRadius: '11px', marginLeft: '6px' }}>
                                                            <small>latest</small>
                                                        </span> : null
                                                    }
                                                    {
                                                        file && oldFile && (match.params.fileId == oldFile._id || (!match.params.fileId && file._id === oldFile._id)) ?
                                                        <span style={{ padding: '0px 9px 3px', border: '1px solid green', color: 'green', borderRadius: '11px', marginLeft: '6px' }}>
                                                            <small>current</small>
                                                        </span>
                                                        : null
                                                    }
                                                </div>
                                                <div className="table-cell">
                                                    {
                                                        objClientNotes && objClientNotes[oldFile._id] && objClientNotes[oldFile._id].content ? 
                                                        objClientNotes[oldFile._id].content.length > 30 ?
                                                        objClientNotes[oldFile._id].content.substr(0, 30) + '...'
                                                        : objClientNotes[oldFile._id].content
                                                        : "n/a"
                                                    }
                                                </div>
                                                <div className="table-cell">{getConsumedStorage(oldFile)}</div>
                                                <div className="table-cell">
                                                    {   oldFile.status == 'locked' ? 
                                                            <i className="fas fa-lock"/>
                                                        : oldFile.status == 'visible' ?
                                                            <i className=" fas fa-eye" />
                                                        : 
                                                            <i  className="u-danger fad fa-eye-slash" />
                                                    }
                                                </div>              
                                                <div className="table-cell">
                                                    { 
                                                        oldFile._user && userStore.byId[oldFile._user] ? 
                                                        `${userStore.byId[oldFile._user].firstname} ${userStore.byId[oldFile._user].lastname}`
                                                        : 
                                                        oldFile.uploadName ? 
                                                        <span>{oldFile.uploadName} <small>(not logged in)</small></span>
                                                        : null
                                                    }
                                                </div>
                                            </div>
                                        )
                                        : <div className="table-row"><div className="table-cell _100">No files</div></div>
                                    }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
        )
    }
}

FileVersionListModal.propTypes = {
    close: PropTypes.func.isRequired
    , dispatch: PropTypes.func.isRequired
    , isOpen: PropTypes.bool.isRequired
    , file: {}
}

FileVersionListModal.defaultProps = {}

const mapStoreToProps = (store) => {
    /**
     * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
     * differentiated from the React component's internal state
     */
    return {
        loggedInUser: store.user.loggedIn.user
        , socket: store.user.socket
        , userStore: store.user 
        , fileStore: store.file
        , clientNoteStore: store.clientNote
    }
}

export default withRouter(
    connect(
        mapStoreToProps
    )(FileVersionListModal)
);
