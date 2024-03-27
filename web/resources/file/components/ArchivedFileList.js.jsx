/**
 * Resuable component for an actionable file list used by both /admin and /firm users 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
const async = require('async');

// import third-party libraries

// import actions 
import * as fileActions from '../fileActions'; 

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import FilterBy from '../../../global/components/helpers/FilterBy.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';
import { CheckboxInput } from '../../../global/components/forms'
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';
import AlertModal from '../../../global/components/modals/AlertModal.js.jsx';
import ModalProgressLoader  from '../../../global/components/modals/ModalProgressLoader.js.jsx';
import MobileActionsOption from '../../../global/components/helpers/MobileActionOptions.js.jsx';

// import resource components
import ArchivedFileListItem from './ArchivedFileListItem.js.jsx';
import FileListOptions from '../practice/components/FileListOptions.js.jsx'; 

// import utils
import routeUtils from '../../../global/utils/routeUtils';

class ArchivedFileList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      queryText: ''
      , fileOptionsOpen: false
      , archiveProcess: false
      , reinstateProcess: false
      , showAlertModal: false
      , checked: false
      , progressStart: false
      , progressOpen: false
      , progressDetail: {}
      , progressText: ""
      , progressSubmit: false
      , showMobileActionOption: false
    }
    this._bind(
      '_handleSelectedTagsChange'
      , '_handleFilter'
      , '_handleCloseFileListOptions'
      , '_handleOpenFileListOptions'
      , '_handleBulkDeleteFiles'
      , '_toggleAlertModal'
      , '_handleBulkReinstateFiles'
      , '_clearAllState'
      , '_handleContextMenuSubmit'
      , '_handleCloseMobileOption'
    )
  }

  componentDidMount() {
    const { dispatch, match, socket, loggedInUser, listArgs, listArgsObj } = this.props; 

    // To make the upload progress meter work this component needs to listen for specific socket events.
    socket.on('connect', () => {
      // console.log('socket connected!!!');
      if(loggedInUser && loggedInUser._id) {
        // console.log('subscribing to userid');
        socket.emit('subscribe', loggedInUser._id);
      }
    });
    socket.on('disconnect', reason => {
      // console.log('socket disconnected!!!');
      // console.log(reason);
      socket.open();
    });
    socket.on('file_update_progress_start', progressStart => {
      this.setState({ progressStart });
    });
    socket.on('file_update_status', progressDetail => {
      this.setState({ progressDetail, showAlertModal: false });
    });
    socket.on('file_update_progress_end', (action, files) => {

      
    });    
  }

  componentWillUnmount() {
    const { socket  } = this.props;
    socket.off("disconnect");
    socket.off("connect");
    socket.off("file_update_progress_start");
    socket.off("file_update_status");
    socket.off("file_update_progress_end");
    this._clearAllState();
  }

  _clearAllState() {
    const { clearSelectedFileIds } = this.props;
    this.setState({
      archiveProcess: false
      , reinstateProcess: false
      , showAlertModal: false
      , checked: false
      , progressStart: false
      , progressOpen: false
      , progressDetail: {}
      , progressText: ""
      , progressSubmit: false
      , showAlertModal: false
    }, () => {
      clearSelectedFileIds();
    })
  }

  _handleSelectedTagsChange(e) {
    console.log("handleSelectedTagsChange", e)
    // additional logic here if we want to break out tags into multiple filters, ie years
    // for now e.target.value contains all of the filters, but may only contain a subset
    // the output to the parent should be the entire list of tags
    this.props.handleFilter(e)
  }

  _handleFilter(sortBy) {
    const { utilFileStore, dispatch, listArgs } = this.props; 
    let newFilter = utilFileStore.filter;
    if(utilFileStore.filter.sortBy && utilFileStore.filter.sortBy.indexOf("-") < 0) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0)
    }
    newFilter.sortBy = sortBy;
    dispatch(fileActions.setFilter(newFilter, listArgs));
  }

  _handleCloseFileListOptions(e) {
    e.stopPropagation();
    this.setState({
      fileOptionsOpen: false
    })
  }

  _handleOpenFileListOptions(e) {
    e.stopPropagation();
    this.setState({
      fileOptionsOpen: false
    }, () => this.props.handleOpenQuickTaskModal())
  }

  _handleBulkReinstateFiles() {
    console.log("props", this.props);

    const { dispatch, selectedFileIds, handleUpdateList, match } = this.props; 

    const sendData = { 
      status: 'visible'
      , filesId: selectedFileIds
      , action: "status" 
      , firmId: match.params.firmId
    };

    this.setState({ reinstateProcess: true, progressOpen: false });
    dispatch(fileActions.sendUBulkupdateFiles(sendData)).then(json => {
      if (handleUpdateList) {
        handleUpdateList();
      }
      this._clearAllState();
    });
  }


  _handleBulkDeleteFiles() {
    console.log("bulk update status");

    const { dispatch, selectedFileIds, handleUpdateList, match } = this.props; 
    this.setState({ archiveProcess: true, progressText: "delete", progressSubmit: true });
    const sendData = { 
      status: "deleted"
      , filesId: selectedFileIds
      , action: "status" 
      , firmId: match.params.firmId
    };
    dispatch(fileActions.sendUBulkupdateFiles(sendData)).then(json => {
      if (handleUpdateList) {
        handleUpdateList();
      }
      this._clearAllState();
    });    
  }

  _toggleAlertModal() {
    this.setState({showAlertModal: !this.state.showAlertModal }); 
  }

  _handleContextMenuSubmit(action, showWarningModal) {
    console.log("action", action, showWarningModal)
    if (action === "delete") {
      this._toggleAlertModal();
    } else if (action === "reinstate") {
      if (showWarningModal) {
        this.setState({ progressOpen: true, progressText: "reinstate" });
      } else {
        this._handleBulkReinstateFiles();
      }
    }
  }

  _handleCloseMobileOption(e) {
    e.stopPropagation();
    this.setState({ showMobileActionOption: false });
  }

  render() {
    const {
      allTags
      , clientStore
      , utilFileStore
      , listArgs
      , handleSetPagination
      , handleToggleSelectAll
      , handleOpenQuickTaskModal
      , match
      , paginatedList
      , selectedTagIds
      , showActions
      , totalListInfo
      , viewingAs
      , selectedFileIds
      , sortedAndFilteredList
      , handleSort
    } = this.props;

    const {
      archiveProcess
      , reinstateProcess
      , showAlertModal
      , progressOpen
      , progressText
      , progressStart
      , progressDetail
      , progressSubmit
      , showMobileActionOption
    } = this.state

    const filter = utilFileStore && utilFileStore.filter && utilFileStore.filter.sortBy;
    const allFilesSelected = selectedFileIds.length ? paginatedList.every(p => selectedFileIds.includes(p._id)) : false;

    const showWarningModal = 
    sortedAndFilteredList    
      // filter first
      .some(file => selectedFileIds.includes(file._id) && file.category === "folder" && sortedAndFilteredList.some(file2 => file2._folder == file._id && file2.status === "archived")) ?
      "A folder has been selected"
      : selectedFileIds && selectedFileIds.length > 10  ? // or more than ten file is selected 
      "More than 10 files have been selected"
      : false;
    const progressPresentText = progressText === "delete" ? "deleting" : progressText;
  
    return (
      <div className="file-list-wrapper">
        <div className={`-options -mobile-layout yt-toolbar`} onClick={() => this.setState({ showMobileActionOption: !showMobileActionOption })}>
            <div>
            <CloseWrapper
              isOpen={showMobileActionOption}
              closeAction={this._handleCloseMobileOption}
            />
            <i className="far fa-ellipsis-h"></i>
            <MobileActionsOption
              isOpen={showMobileActionOption}
              closeAction={() => this.setState({showMobileActionOption: false})}
              viewingAs="file-list-archived"
              selectedFileIds={selectedFileIds}
              handleContextMenuSubmit={this._handleContextMenuSubmit}
              showWarningModal={showWarningModal}
            />
            </div>
        </div>
        <div className="yt-toolbar">
          <div className="yt-tools space-between">
            <div className="-filters -left">
              <strong>Filter files by: </strong>
              <FilterBy
                applyFilter={this._handleSelectedTagsChange}
                displayKey="name"
                items={allTags || []}
                label="Tags"
                name="_tags"
                selected={selectedTagIds}
                valueKey="_id"
              />
            </div>
            { showActions ?
              <div className="-options -right">
                <button
                  disabled={selectedFileIds.length < 1}
                  className="yt-btn x-small link info"
                  style={{display: "inline-flex"}}
                  onClick={showWarningModal ? () => this.setState({ progressOpen: true, progressText: "reinstate" }) : this._handleBulkReinstateFiles}
                >
                  { reinstateProcess ? (<p className="-archive-saving">Reinstating<span>.</span><span>.</span><span>.</span></p>) : "Reinstate" }
                  { reinstateProcess ? null : selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null }
                </button>
                <button
                  disabled={selectedFileIds.length < 1}
                  className="yt-btn x-small link info"
                  style={{display: "inline-flex"}}
                  onClick={this._toggleAlertModal}
                >
                  { archiveProcess ? (<p className="-archive-saving">Deleting<span>.</span><span>.</span><span>.</span></p>) : "Delete" }
                  { archiveProcess ? null : selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null }
                </button>
                <div className="-options" onClick={() => this.setState({fileOptionsOpen: true})} style={{ cursor:"pointer" }}>
                  <div style={{position: "relative", height: "100%", width: "100%"}}>
                    <CloseWrapper
                      isOpen={(this.state.fileOptionsOpen)}
                      closeAction={this._handleCloseFileListOptions}
                    />
                    <i className="far fa-ellipsis-v"></i>
                    <FileListOptions
                      isOpen={this.state.fileOptionsOpen}
                      isArchive={true}
                      closeAction={() => this.setState({fileOptionsOpen: false})}
                    />
                  </div>
                </div>
              </div>
              :
              null 
            }
          </div>
        </div>
        <hr className="-mobile-yt-hide" />
        <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table">
          <div className="table-caption">
              <PageTabber
                totalItems={utilFileStore.totalFiles}
                totalPages={Math.ceil(parseInt(utilFileStore.totalFiles) / (utilFileStore.pagination && parseInt(utilFileStore.pagination.per)))}
                pagination={utilFileStore.pagination}
                setPagination={handleSetPagination}
                setPerPage={this.props.setPerPage}
                viewingAs="top"
                itemName="archived files"
                searchText="Search..."
                firmId={match.params.firmId}
                clientId={match.params.clientId}
                userId={match.params.userId}
                folderId={match.params.folderId}
                isChanged={true}
              />
            </div>
            <div className="table-head" >
              <div className="table-cell">
                { handleToggleSelectAll ? 
                  <CheckboxInput
                    name="file"
                    value={allFilesSelected}
                    change={() => handleToggleSelectAll(paginatedList, allFilesSelected)}
                    checked={allFilesSelected}
                  />
                  :
                  null
                }
              </div>
              <div className="table-cell"></div>
              <div className="table-cell -title sortable _50" onClick={() => handleSort('filename')}>Filename
                {filter && filter == 'filename' ? 
                    <i className="fad fa-sort-down"></i>
                : filter && filter == '-filename' ?
                  <i className="fad fa-sort-up"></i>
                : 
                  <i className="fad fa-sort"></i>
                }
              </div>
              {/* { viewingAs === "general" || viewingAs === "admin" ? 
                <div className="table-cell -client _30">Client
                  {filter && filter == 'client' ? 
                      <i className="fad fa-sort-down"></i>
                  : filter && filter == '-client' ?
                    <i className="fad fa-sort-up"></i>
                  : 
                  <i className="fad fa-sort"></i>
                  }
                </div>
                :
                null
              } */}
              <div className="table-cell _30">Created By</div>
              <div className="table-cell -date sortable _15" onClick={() => handleSort('updated_at')}>Date
                {filter && filter == 'date' ? 
                  <i className="fad fa-sort-up"></i>
                : filter && filter == '-date' ?
                  <i className="fad fa-sort-down"></i>
                : 
                <i className="fad fa-sort"></i>
                }
              </div>
            </div>
            { paginatedList.length > 0 ? 
              paginatedList.map((file, i) => 
              <ArchivedFileListItem 
                key={'file_' + file._id + '_' + i} 
                client={file._client && clientStore.byId[file._client] ? clientStore.byId[file._client] : null }
                file={file}
                checked={this.props.selectedFileIds.includes(file._id)}
                handleSelectFile={this.props.handleSelectFile}
                handleOpenQuickTaskModal={() => handleOpenQuickTaskModal(file)}
                showOptions={true}
                viewingAs={viewingAs}
                sortedAndFilteredList={sortedAndFilteredList}
                selectedFileIds={this.props.selectedFileIds}
                showWarningModal={showWarningModal}
                handleContextMenuSubmit={this._handleContextMenuSubmit}
                listArgs={listArgs}
                handleUpdateList={this.props.handleUpdateList}
              />
            )
            : 
            <div className="table-head empty-state">
              <div className="table-cell" colSpan="5">
                <em>No files</em>
              </div>
            </div>
            }
        </div>
        <PageTabber
          totalItems={utilFileStore.totalFiles}
          totalPages={Math.ceil(parseInt(utilFileStore.totalFiles) / (utilFileStore.pagination && parseInt(utilFileStore.pagination.per)))}
          pagination={utilFileStore.pagination}
          setPagination={handleSetPagination}
          setPerPage={this.props.setPerPage}
          viewingAs="bottom"
          itemName="archived files"
          searchText="Search..."
          firmId={match.params.firmId}
          clientId={match.params.clientId}
          userId={match.params.userId}
          folderId={match.params.folderId}
          isChanged={true}
        />
        <AlertModal
          alertMessage={"Are you sure? This cannot be undone."}
          alertTitle={selectedFileIds.length > 1 ? `Delete ${selectedFileIds.length} files?` : "Delete this file?"}
          closeAction={this._toggleAlertModal}
          confirmAction={this._handleBulkDeleteFiles}
          confirmText={"Delete"}
          declineAction={this._toggleAlertModal}
          declineText={"Cancel"}
          isOpen={showAlertModal}
          type={'danger'}
        >
        </AlertModal>
        <AlertModal
          isOpen={progressOpen && progressText ? true : false} // app.js.jsx?93ea:56 Warning: Failed prop type: Invalid prop `isOpen` of type `string` supplied to `AlertModal`, 
          type="warning"
          confirmText={`Try ${progressPresentText} anyway`}
          alertTitle={showWarningModal ? showWarningModal : "Warning Modal"}
          alertMessage={
            showWarningModal === "A folder has been selected" ? `All files associated with this folder will also be ${progressText}d.`
            : `While ImagineShare allows you to ${progressText} unlimited files simultaneously, certain browsers may limit you to ${progressPresentText} 10 separate files at one time. If you experience this, please select a maximum of 10 files per ${progressText} attempt.`
          }
          closeAction={() => this.setState({ progressOpen: false, progressText: "" })}
          confirmAction={
            progressText === "reinstate" ? this._handleBulkReinstateFiles
            : progressText === "archive" ? this._handleBulkArchiveFiles : null}
          disableConfirm={progressSubmit}
        />
        <ModalProgressLoader
          isOpen={progressStart && progressText ? true : false} // app.js.jsx?93ea:56 Warning: Failed prop type: Invalid prop `isOpen` of type `string` supplied to `ModalProgressLoader`, 
          cardSize='standard'
          modalHeader={`${progressPresentText}...`}
          progressDetail={progressDetail}
        >
          <p></p>
        </ModalProgressLoader>
      </div>
    )
  }
}

ArchivedFileList.propTypes = {
  // allFilesSelected: PropTypes.bool 
  dispatch: PropTypes.func.isRequired
  , utilFileStore: PropTypes.object.isRequired
  , allTags: PropTypes.array.isRequired
  , handleFilter: PropTypes.func.isRequired
  , handleOpenRequestModal: PropTypes.func 
  , handleOpenShareModal: PropTypes.func 
  , handleOpenUploadModal: PropTypes.func 
  , handleQuery: PropTypes.func.isRequired 
  , handleSelectFile: PropTypes.func.isRequired
  , handleSetPagination: PropTypes.func.isRequired
  , handleToggleSelectAll: PropTypes.func
  , handleSort: PropTypes.func.isRequired 
  , selectedFileIds: PropTypes.array
  , selectedTagIds: PropTypes.array
  , showActions: PropTypes.bool 
  , sortedAndFilteredList: PropTypes.array 
  , viewingAs: PropTypes.oneOf(['workspace', 'general', 'admin', 'client', 'staff']) 
}

ArchivedFileList.defaultProps = {
  // allFilesSelected: false 
  handleOpenRequestModal: null 
  , handleOpenShareModal: null 
  , handleOpenUploadModal: null 
  , handleToggleSelectAll: null
  , selectedFileIds: []
  , selectedTagIds: []
  , showActions: true 
  , sortedAndFilteredList: []
  , viewingAs: 'workspace'
}


const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

   /**
   * REGARDING PAGINATION: Pagination would normally be handled on the parent component WorkspaceFiles.
   * The listArgs in WorkspaceFiles.state are not accessible from that component's mapStoreToProps
   * function. We have to paginate the list here instead since it is passed to this component as a prop
   * with no need to be aware of the listArgs.
   */
   const { utilFileStore, sortedAndFilteredList } = props;
   let paginatedList =sortedAndFilteredList;
   let orderedList = []; 
   const filter = utilFileStore.filter 
   const query = filter ? filter.query : '';
   const sortBy = filter ? filter.sortBy : 'date'; 

  return {
    clientStore: store.client 
    , paginatedList: paginatedList
    , loggedInUser: store.user.loggedIn.user
    , socket: store.user.socket
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(ArchivedFileList)
);
