/**
 * Resuable component for an actionable file list used by both /admin and /firm users 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import Select from 'react-select'; 
import queryString from 'query-string';
import print from 'print-js'
import { PDFDocument } from 'pdf-lib'
import ReactTooltip from 'react-tooltip';

const async = require('async');

// import third-party libraries

// import actions 
import * as fileActions from '../fileActions'; 
import * as tagActions from '../../tag/tagActions'; 

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import FilterBy from '../../../global/components/helpers/FilterBy.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';
import { CheckboxInput } from '../../../global/components/forms'
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';
import AlertModal from '../../../global/components/modals/AlertModal.js.jsx';
import Modal from '../../../global/components/modals/Modal.js.jsx';
import ModalProgressLoader from '../../../global/components/modals/ModalProgressLoader.js.jsx';
import DropdownButton from '../../../global/components/helpers/DropdownButton.js.jsx';

// import resource components
import FileTableListItem from './FileTableListItem.js.jsx';
import FileListOptions from '../practice/components/FileListOptions.js.jsx'; 
import FileLocation from './FileLocation.js.jsx';
import MobileActionsOption from '../../../global/components/helpers/MobileActionOptions.js.jsx';
import FilesOptions from '../practice/components/FilesOptions.js.jsx';

// import utils
import routeUtils from '../../../global/utils/routeUtils';
import fileUtils from '../../../global/utils/fileUtils'; 
import filterUtils from '../../../global/utils/filterUtils'; 
import permissions from '../../../global/utils/permissions';
import downloadsUtil from '../../../global/utils/downloadsUtil';
import _ from 'lodash';

const fileActionListItems = [
  {label: 'Upload new files', name: "file_upload", value: "file_upload" }
  //, {label: 'Apply document template', name: "document_template_apply", value: "document_template_apply" }
];

const folderActionListItems = [
  {label: 'Create new folder', name: "file_create_folder", value: "file_create_folder" }
  , {label: 'Apply folder template', name: "file_folder_template_apply", value: "file_folder_template_apply"}
];

const linkActionListItems = (eSigAccess, selectedFileIds, fileMap) => {
  let disabledSignatureRequest = true;

  if (eSigAccess && selectedFileIds && selectedFileIds.length === 1 && fileMap) {
    const fileId = selectedFileIds && selectedFileIds[0];
    const file = fileMap && fileMap[fileId];
    let contentType = file && file.contentType;
    if (file && file.category != 'folder' && file.fileExtension) {
      if (file.fileExtension.toLowerCase().indexOf('.pdf') > -1) {
        contentType = 'application/pdf';
      } else if (file.fileExtension.toLowerCase().indexOf('.doc') > -1) {
        contentType = 'application/doc';
      } else {
        contentType = file.fileExtension;
      }
      if (contentType && (contentType.indexOf('pdf') > -1 || contentType.indexOf('doc') > -1)) {
        disabledSignatureRequest = false;
      }
    }
  }

  return [
    {label: 'Share files', name: "file_share_file", value: "file_share_file" }
    , {label: 'Request files', name: "file_request_file", value: "file_request_file" }
    , {label: 'Request signature', name: "file_signature", value: "file_signature", disabled: disabledSignatureRequest}
  ];
}  

class FileList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      tagQuery: ''
      , fileOptionsOpen: false
      , downloadWarningModalOpen: false
      , showClientList: false
      , bulkMoveSubmit: false
      , archiveProcess: false
      , checked: false
      , progressStart: false
      , progressOpen: false
      , progressDetail: {}
      , progressText: ""
      , showMobileActionOption: false
      , listArgsObj: props.listArgsObj

      , onProcess: false
    }
    this._bind(
      '_handleSelectedTagsChange'
      , '_handleFilter'
      , '_handleCloseFileListOptions'
      , '_handleOpenFileListOptions'
      , '_handleDownloadFiles'
      , '_handleBulkArchiveFiles'
      , '_clearAllState'
      , '_handleOpenShareModal'
      , '_handleContextMenuSubmit'
    )
  }

  componentDidMount() {
    console.log("connected")
    const { dispatch, match, socket, loggedInUser, clearSelectedFileIds, selectedFileIds, listArgs, listArgsObj } = this.props; 
    const { progressText } = this.state;

    //To make the upload progress meter work this component needs to listen for specific socket events.
    socket.on('file_update_status', progressDetail => {
      this.setState({ progressDetail })
    });

    //To make the upload progress meter work this component needs to listen for specific socket events.
    socket.on('connect', () => {
      console.log('socket connected!!!');
      if(loggedInUser && loggedInUser._id) {
       console.log('subscribing to userid');
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
      this.setState({ progressDetail });
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

    const { clearSelectedFileIds, match  } = this.props;
    this.setState({
      fileOptionsOpen: false
      , downloadWarningModalOpen: false
      , showClientList: false
      , bulkMoveSubmit: false
      , archiveProcess: false
      , checked: false
      , progressStart: false
      , progressOpen: false
      , progressDetail: {}
      , progressText: ""
      , onProcess: false
    }, () => {
      clearSelectedFileIds();
    });
  }

  _handleFormChange(e) {
    const { dispatch, match } = this.props; 
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });

    dispatch(tagActions.setQuery(e.target.value.toLowerCase(), '~firm', match.params.firmId));
    this.setState({tagQuery: e.target.value.toLowerCase()});
  }

  _handleSelectedTagsChange(e) {
    // additional logic here if we want to break out tags into multiple filters, ie years
    // for now e.target.value contains all of the filters, but may only contain a subset
    // the output to the parent should be the entire list of tags
    this.props.handleFilter(e)
  }

  _handleFilter(sortBy) {
    console.log("eyy", sortBy);
  }

  _handleCloseFileListOptions(e) {
    e.stopPropagation();
    this.setState({
      fileOptionsOpen: false
      , showMobileActionOption: false
    })
  }

  _handleOpenFileListOptions(e) {
    e.stopPropagation();
    this.setState({
      fileOptionsOpen: false
    }, () => this.props.handleOpenQuickTaskModal())
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
      }, 700);
    }
  }

  async _handleDownloadFiles() {
    this.setState({ onProcess: true });
    const { selectedFileIds, selectedFirm, socket, loggedInUser, fileStore } = this.props; 
    
    if (selectedFileIds && selectedFileIds.length > 1 && selectedFirm && selectedFirm.zipFilesDownload) {
      
      // download files and folders as zip
      await downloadsUtil.downloadFilesAndFoldersAsZip(selectedFileIds, selectedFirm._id)

    } else if (selectedFileIds && selectedFileIds.length) {
      
      socket.emit('start_progress', loggedInUser._id, 'Downloading');

      const files = selectedFileIds.map(id => id && fileStore && fileStore.byId && fileStore.byId[id]);
      
      let downloadedCount = 0;
      // iterate through selected file ids to download each file content
      for (let file of files) {
        // download file or download folder as zip
        if (file && file._id && file.category === 'folder') {
          await downloadsUtil.downloadFileOrFolder(file._id);
        } else {
          const fileLink = fileUtils.getDownloadLink(file);
          var a  = document.createElement("a"); 
          a.setAttribute('href', `${fileLink}?userLevel=staffclient&type=downloaded`); 
          a.setAttribute('download', '');
          a.setAttribute('target', '_blank');       
          a.click();
        }
        downloadedCount++
        const downloadPercentage = Math.ceil((downloadedCount / selectedFileIds.length) * 100)
        socket.emit('progress_status', loggedInUser._id, downloadPercentage);
      }
      socket.emit('finish_progress', loggedInUser._id, 'Download completed');
    } 

    this._clearAllState()
  }

  _handleBulkArchiveFiles() {
    const { dispatch, selectedFileIds, handleUpdateList, match } = this.props; 

    const sendData = { 
      status: 'archived'
      , filesId: selectedFileIds
      , action: "status"
      , firmId: match.params.firmId
    };

    this.setState({ archiveProcess: true, progressOpen: false });
    dispatch(fileActions.sendUBulkupdateFiles(sendData)).then(json => {
      if (handleUpdateList) {
        handleUpdateList();
      }
      this._clearAllState();
    })
  }

  _handleOpenShareModal() {
    const { handleOpenShareModal } = this.props;
    this.setState({ progressOpen: false, progressText: "" }, () => {
      if (handleOpenShareModal) {
        handleOpenShareModal();
      }
    });
  }

  _handleContextMenuSubmit(action, showWarningModal) {
    if (action === "move") {
      if (showWarningModal) {
        this.setState({ progressOpen: true, progressText: "move" });
      } else {
        this.props.handleOpenMoveModal();
      }
    } else if (action === "download") {
      this._handleDownloadFiles();
    } else if (action === "print") { 
      this._handleBulkPrintFiles();
    } else if (action === "archive") {
      if (showWarningModal) {
        this.setState({ progressOpen: true, progressText: "archive" });
      } else {
        this._handleBulkArchiveFiles();
      }
    } else if (action === "share") {
      if (showWarningModal) {
        this.setState({ progressOpen: true, progressText: "share" });
      } else {
        this.props.handleOpenShareModal();
      }
    } else if (action == "permission") {
      console.log('click permission folder');
      this.props.handleOpenFolderPermissionModal();
    } else {
      if (showWarningModal) {
        this.setState({ progressOpen: true, progressText: "move", showClientList: false });
      } else {
        this.setState({ showClientList: true, progressOpen: false, progressText: "" });
      }
    }
  }

  render() {
    const {
      allTags
      , firmStore
      , clientStore
      , utilFileStore
      , listArgs
      , handleSetPagination
      , handleToggleSelectAll
      , handleOpenQuickTaskModal
      , handleOpenFolderPermissionModal
      , handleOpenShareModal
      , handleOpenFolderModal
      , handleOpenUploadModal
      , handleOpenRequestModal
      , handleOpenTemplateModal
      , handleOpenMoveModal
      , match
      // , orderedList // Use this list to get matching file count after filters.
      , paginatedList
      , selectedTagIds
      , selectedFileIds
      , showActions
      , sortedAndFilteredList // Use this list to get total file count minus archived and deleted files.
      , tagStore
      , totalListInfo
      , viewingAs
      , staffClientStore
      , loggedInUser
      , staffStore
      , clearSelectedFileIds
      , userMap
      , fileStore
      , handleQuery
      , handleSearch
      , fileQuery
      , folderListItems
      , allFilesFromListArgs
      , staffListItem
      , isFirmStaff
      , sortBy
      , selectedFirm
      , loggedInStaff
      , isFirmOwner
      , fIds
      , handleOpenFileVersionModal
      , handleOpenDocumentTemplateModal
      , handleChangeRoleModal
      , fileMap
      , clientUserStore
      , listArgsObj
      , handleSort
    } = this.props;

    const {
      archiveProcess
      , progressDetail
      , progressOpen
      , progressStart
      , bulkMoveSubmit
      , showClientList
      , progressText
      , showMobileActionOption
      , fileOptionsOpen
      , onProcess
    } = this.state;

    let selectedFile = {};
    let parentFolder = {}

    if(match.params.folderId) {
      selectedFile = !!fileStore.byId[match.params.folderId] ? fileStore.byId[match.params.folderId] : {};
      parentFolder = selectedFile;
    }

    const role = permissions.getUserRole(loggedInUser, match.params.firmId, match.params.clientId, staffStore, clientUserStore);

    const isEmpty = (
      !utilFileStore
      || !sortedAndFilteredList
      || utilFileStore.isFetching
    );

    const isFetching = (
      !utilFileStore
      || utilFileStore.isFetching
      || !sortedAndFilteredList
    );

    const allFilesSelected = selectedFileIds && selectedFileIds.length ? paginatedList.every(p => selectedFileIds.includes(p._id)) : false; 
    const eSigAccess = selectedFirm && selectedFirm.eSigAccess && loggedInStaff && loggedInStaff.eSigAccess;

    // filter tag list stuff
    let tagListArgs = ['~firm', match.params.firmId]; // so reduce func below will work
    const tagListItems = tagStore.util.getList('~firm', match.params.firmId); 
    const tagList = tagListItems ? tagListArgs.reduce((obj, nextKey) => obj[nextKey], tagStore.lists) : null
    let filteredByQuery = [];
    let sortedTagListItems = [];
    let tagNameList = []; 
    let query = tagList && tagList.query; 
    var queryTestString = ("" + query).toLowerCase().trim();
    queryTestString = queryTestString.replace(/[^a-zA-Z0-9]/g,''); // replace all non-characters and numbers
    filteredByQuery = tagList && tagList.items && queryTestString && query ? tagList.items.filter((tagId) => {
      return filterUtils.filterTag(queryTestString, tagStore.byId[tagId]);
    }) : [];
    sortedTagListItems = filteredByQuery.map((item) => {
      var newItem = tagStore.byId[item];
      tagNameList.push(newItem.name); 
      return newItem;
    });

    // progress loader only show when the warning modal appears
    let showWarningModal = false;

    if (selectedFileIds && selectedFileIds.length && allFilesFromListArgs) {
      showWarningModal = allFilesFromListArgs
      // filter first
      .some(file => file && selectedFileIds.includes(file._id) && file.category === "folder" && allFilesFromListArgs.some(file2 => file2._folder == file._id)) ?
      "A folder has been selected "
      : selectedFileIds && selectedFileIds.length > 10  ? // or more than ten file is selected 
      "More than 10 files have been selected"
      : false;
    }
    let progressPresentText = progressText;

    switch (progressText) {
      case "move": progressPresentText = "moving"; break;
      case "archive": progressPresentText = "archiving"; break;
      case "share": progressPresentText = "sharing"; break;
      default: progressPresentText = progressText; break;
    }
    
    return (
      <div className="file-list-wrapper">
          <div className={`-options -mobile-layout yt-toolbar`} onClick={() => this.setState({ showMobileActionOption: !showMobileActionOption })}>
            <div>
              <CloseWrapper
                isOpen={showMobileActionOption}
                closeAction={this._handleCloseFileListOptions}
              />
              <i className="far fa-ellipsis-h"></i>
              <MobileActionsOption
                isOpen={showMobileActionOption}
                closeAction={() => this.setState({showMobileActionOption: false})}
                viewingAs="file-list"
                selectedFileIds={selectedFileIds}
                showWarningModal={showWarningModal}
                handleContextMenuSubmit={this._handleContextMenuSubmit}
                handleOpenShareModal={handleOpenShareModal}
                handleOpenRequestModal={handleOpenRequestModal}
                handleOpenUploadModal={handleOpenUploadModal}
                handleOpenFolderModal={handleOpenFolderModal}
                handleOpenTemplateModal={handleOpenTemplateModal}
              />
            </div>
          </div>
          <div className="yt-toolbar">
          <div className="yt-tools space-between">
            <div className="-filters -left _19">
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
                  disabled={selectedFileIds.length < 1 || onProcess} 
                  className="yt-btn x-small link info -move-option"
                  onClick={this._handleContextMenuSubmit.bind(this, "move", showWarningModal)}
                >
                  Move { selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null} 
                </button>
                {
                  // (selectedFile && selectedFile.permission && !!selectedFile.permission[`${role}Download`]) ||
                  // (selectedFirm && selectedFirm.permission && !!selectedFirm.permission[`${role}Download`]) ?
                  permissions.hasPermission(selectedFirm, parentFolder, selectedFile, `${role}Download`) ?
                  <button 
                    disabled={selectedFileIds.length < 1 || onProcess}
                    className="yt-btn x-small link info -download-option" 
                    onClick={this._handleDownloadFiles}>
                    Download { selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length }</span> : null
                    }
                  </button>
                  :
                  <div
                    data-tip
                    data-for="flDisableDownload"
                  >
                    <button 
                      disabled={true}
                      className="yt-btn x-small link info -download-option" 
                      onClick={null}>
                      Download
                    </button>
                    <ReactTooltip id="flDisableDownload" place="top" type="warning" effect="solid">
                      <span className="tooltipMessage">You don't have permission to <br/> download files and folders</span>
                    </ReactTooltip>
                  </div>

                }
                {
                  // (selectedFile && selectedFile.permission && !!selectedFile.permission[`${role}Delete`]) ||
                  // (selectedFirm && selectedFirm.permission && !!selectedFirm.permission[`${role}Delete`]) ?
                  permissions.hasPermission(selectedFirm, parentFolder, selectedFile, `${role}Delete`) ?
                  <button
                    disabled={selectedFileIds.length < 1 || onProcess}
                    className="yt-btn x-small link info -archive-option"
                    onClick={showWarningModal ? () => this.setState({ progressOpen: true, progressText: "archive" }) : this._handleBulkArchiveFiles}
                  >
                    { archiveProcess ? (<p className="-archive-saving">Archiving<span>.</span><span>.</span><span>.</span></p>) : "Archive" }
                    { archiveProcess ? null : selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null }
                  </button>
                  :
                  <div
                    data-tip
                    data-for="FL_DisableArchive"
                  >
                    <button
                      disabled={true}
                      className="yt-btn x-small link info -archive-option"
                      onClick={null}
                    >
                    Archive
                  </button>
                    <ReactTooltip id="FL_DisableArchive" place="top" type="warning" effect="solid">
                      <span className="tooltipMessage">You don't have permission to <br/> archive/delete files and folders</span>
                    </ReactTooltip>
                  </div>
                }
                <DropdownButton
                  label="New Link"
                  selectedCount={selectedFileIds.length}
                  select={(value) => 
                    showWarningModal && value === "file_share_file" ? this.setState({ progressOpen: true, progressText: "share" }) 
                    : value === "file_signature" && selectedFileIds.length === 1 ? handleChangeRoleModal(value, fileMap[selectedFileIds[0]])
                    : handleChangeRoleModal(value)}
                  displayKey="label"
                  items={linkActionListItems(eSigAccess, selectedFileIds, fileMap)}
                  selected={null}
                  valueKey="value"
                  disabled={onProcess}
                />
                {
                  // (selectedFile && selectedFile.permission && !!selectedFile.permission[`${role}Create`]) ||
                  // (selectedFirm && selectedFirm.permission && !!selectedFirm.permission[`${role}Create`]) ? 
                  permissions.hasPermission(selectedFirm, parentFolder, selectedFile, `${role}Create`) ?
                  <DropdownButton
                    label="New Folder"
                    select={(value) => handleChangeRoleModal(value)}
                    displayKey="label"
                    items={folderActionListItems}
                    selected={null}
                    valueKey="value"
                    disabled={onProcess}
                  />
                  :
                  <div
                    data-tip
                    data-for="FL_DisableCreate"
                  >
                    <DropdownButton
                    label="New Folder"
                    select={null}
                    displayKey="label"
                    items={folderActionListItems}
                    selected={null}
                    valueKey="value"
                    disabled={true}
                  />
                    <ReactTooltip id="FL_DisableCreate" place="top" type="warning" effect="solid">
                      <p className="tooltipMessage">You don't have permission to <br/> create folder</p>
                    </ReactTooltip>
                  </div>
                }
                {
                  // (selectedFile && selectedFile.permission && !!selectedFile.permission[`${role}Upload`]) ||
                  // (selectedFirm && selectedFirm.permission && !!selectedFirm.permission[`${role}Upload`]) ?
                  permissions.hasPermission(selectedFirm, parentFolder, selectedFile, `${role}Upload`) ?
                  <DropdownButton
                    label="New File"
                    select={(value) => handleChangeRoleModal(value)}
                    displayKey="label"
                    items={fileActionListItems}
                    selected={null}
                    valueKey="value"
                    disabled={onProcess}
                  />
                  :
                  <div
                    data-tip
                    data-for="FL_DisableUpload"
                  >
                    <DropdownButton
                      label="New File"
                      select={null}
                      displayKey="label"
                      items={fileActionListItems}
                      selected={null}
                      valueKey="value"
                      disabled={true}
                    />
                    <ReactTooltip id="FL_DisableUpload" place="top" type="warning" effect="solid">
                      <p className="tooltipMessage">You don't have permission to <br/> upload files</p>
                    </ReactTooltip>
                  </div>
                }

                <div className="-options -pointer" onClick={() => this.setState({fileOptionsOpen: true})}>
                  <div className="-relative">
                    <CloseWrapper
                      isOpen={(this.state.fileOptionsOpen)}
                      closeAction={this._handleCloseFileListOptions}
                    />
                    <i className="far fa-ellipsis-v"></i>
                    {
                      fileOptionsOpen ? 
                      <FileListOptions
                        isOpen={this.state.fileOptionsOpen}
                        closeAction={() => this.setState({fileOptionsOpen: false})}
                        selectedFileIds={selectedFileIds}
                        showWarningModal={showWarningModal}
                        handleContextMenuSubmit={this._handleContextMenuSubmit}
                        handleOpenShareModal={handleOpenShareModal}
                        handleOpenRequestModal={handleOpenRequestModal}
                        handleOpenUploadModal={handleOpenUploadModal}
                        handleOpenFolderModal={handleOpenFolderModal}
                        handleOpenTemplateModal={handleOpenTemplateModal}
                      />
                      : null
                    }
                  </div>
                </div>
              </div>
              :
              null 
            }
          </div>
        </div>
        <hr className="-mobile-yt-hide" />
        <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table" style={{ opacity: onProcess ? '0.5' : 1 }}>
          <div className="table-caption">
              <PageTabber
                totalItems={utilFileStore.totalFiles}
                totalPages={Math.ceil(parseInt(utilFileStore.totalFiles) / (utilFileStore.pagination && parseInt(utilFileStore.pagination.per)))}
                pagination={utilFileStore.pagination}
                setPagination={handleSetPagination}
                setPerPage={this.props.setPerPage}
                viewingAs="top"
                itemName="files"
                handleQuery={handleQuery}
                handleSearch={handleSearch}
                query={fileQuery}
                searchText="Search..."
                firmId={match.params.firmId}
                clientId={match.params.clientId}
                userId={match.params.userId}
                folderId={match.params.folderId}
                isChanged={true}
                enableSearch={true}
              />
            </div>
            <div className="-table-horizontal-scrolling">
              <div className="table-head">
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
                <div className="table-cell -title sortable _40" onClick={() => handleSort('filename')}>Filename
                  {sortBy && sortBy == 'filename' ? 
                    <i className="fad fa-sort-down"></i>
                  : sortBy && sortBy == '-filename' ?
                    <i className="fad fa-sort-up"></i>
                  : 
                    <i className="fad fa-sort"></i>
                  }
                </div>
                {
                  selectedFirm && selectedFirm.fileVersionType === "enable" ? 
                  <div className="table-cell _10">Versions</div>
                  : null
                }
                <div className="table-cell _10">Size</div>
                <div className="table-cell _10">Folders</div>
                <div className="table-cell _10">Files</div>              
                <div className="table-cell _10">Tags</div>
                <div className="table-cell sortable _10" onClick={() => handleSort('status')}>Visibility
                  {sortBy && sortBy == 'status' ? 
                    <i className="fad fa-sort-up"></i>
                  : sortBy && sortBy == '-status' ?
                    <i className="fad fa-sort-down"></i>
                  : 
                    <i className="fad fa-sort"></i>
                  }
                </div>
                <div className="table-cell sortable _10">Created By</div>
                <div className="table-cell -date sortable _10" onClick={() => handleSort('updated_at')}>Last Updated
                  {sortBy && sortBy == 'updated_at' ? 
                    <i className="fad fa-sort-up"></i>
                  : sortBy && sortBy == '-updated_at' ?
                    <i className="fad fa-sort-down"></i>
                  : 
                    <i className="fad fa-sort"></i>
                  }
                </div>
              </div>
              { isEmpty ?
                (isFetching ? 
                  <div className="-loading-hero hero">
                    <div className="u-centerText">
                      <div className="loading"></div>
                    </div>
                  </div>  
                  : 
                  <div className="hero -empty-hero">
                    <div className="u-centerText">
                      <p>Looks like you don't have any files yet. </p>
                      <p>Let's add some.</p>
                    </div>
                  </div>
                )
                :
                paginatedList && paginatedList.length > 0 ? 
                  paginatedList.map((file, i) => 
                    <FileTableListItem 
                      key={'file_' + file._id + '_' + i} 
                      client={file._client && clientStore.byId[file._client] ? clientStore.byId[file._client] : null }
                      file={file}
                      checked={this.props.selectedFileIds.includes(file._id)}
                      handleSelectFile={this.props.handleSelectFile}
                      handleOpenQuickTaskModal={() => handleOpenQuickTaskModal(file)}
                      handleOpenFolderPermissionModal={() => handleOpenFolderPermissionModal(file)}
                      showOptions={true}
                      viewingAs={viewingAs}
                      listArgs={listArgs}
                      sortedTagListItems={sortedTagListItems}
                      tagNameList={tagNameList}
                      clearSelectedFileIds={clearSelectedFileIds}
                      folderListItems={folderListItems}
                      _handleMoveSelectedChange={this._handleMoveSelectedChange}
                      _handleLocationChange={this._handleLocationChange}
                      // options={options}
                      objFileActivityListItems={this.props.objFileActivityListItems}
                      _isOldFile={true}
                      selectedFileIds={this.props.selectedFileIds}
                      handleContextMenuSubmit={this._handleContextMenuSubmit}
                      showWarningModal={showWarningModal}
                      isFirmStaff={isFirmStaff}
                      handleOpenShareModal={handleOpenShareModal}
                      allFilesFromListArgs={allFilesFromListArgs}
                      selectedFirm={selectedFirm}
                      loggedInStaff={loggedInStaff}
                      isFirmOwner={isFirmOwner}
                      handleBulkAction={(type) => this.setState({ progressOpen: true, progressText: type })}
                      handleOpenFileVersionModal={() => handleOpenFileVersionModal(file)}
                      listArgsObj={listArgsObj}
                      handleUpdateList={this.props.handleUpdateList}
                      role={role}
                      parentFolder={parentFolder}
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
        </div>
        <PageTabber
          totalItems={utilFileStore.totalFiles}
          totalPages={Math.ceil(parseInt(utilFileStore.totalFiles) / (utilFileStore.pagination && parseInt(utilFileStore.pagination.per)))}
          pagination={utilFileStore.pagination}
          setPagination={handleSetPagination}
          setPerPage={this.props.setPerPage}
          viewingAs="bottom"
          itemName="files"
          handleQuery={handleQuery}
          query={fileQuery}
          searchText="Search..."
          firmId={match.params.firmId}
          clientId={match.params.clientId}
          userId={match.params.userId}
          folderId={match.params.folderId}
          isChanged={true}
        />
      <AlertModal
        alertTitle="More than ten files have been selected"
        alertMessage="While ImagineShare allows you to download unlimited files simultaneously, certain browsers may limit you to downloading 10 separate files at one time. If you experience this, please select a maximum of 10 files per download attempt."
        closeAction={() => this.setState({downloadWarningModalOpen: false})}
        confirmAction={this._handleDownloadFiles}
        confirmText="Try downloading anyway"
        isOpen={this.state.downloadWarningModalOpen}
        type="warning"
      />
      <AlertModal
        isOpen={progressOpen && progressText ? true : false} // app.js.jsx?93ea:56 Warning: Failed prop type: Invalid prop `isOpen` of type `string` supplied to `AlertModal`, 
        type="warning"
        confirmText={`Try ${progressPresentText} anyway`}
        alertTitle={showWarningModal ? showWarningModal : "Warning Modal"}
        alertMessage={
          showWarningModal === "A folder has been selected " ? `All files associated with this folder will also be ${progressText}d.`
          : `While ImagineShare allows you to ${progressText} unlimited files simultaneously, certain browsers may limit you to ${progressPresentText} 10 separate files at one time. If you experience this, please select a maximum of 10 files per ${progressText} attempt.`
        }
        closeAction={() => this.setState({ progressOpen: false, progressText: "" })}
        confirmAction={
          progressText === "move" ? () => this.setState({ progressOpen: false }, () => {
            handleOpenMoveModal()
          })
          : progressText === "archive" ? this._handleBulkArchiveFiles 
          : progressText === "share" ? this._handleOpenShareModal : null }
      />
      <ModalProgressLoader
        isOpen={!!(progressStart && progressText)} // app.js.jsx?93ea:56 Warning: Failed prop type: Invalid prop `isOpen` of type `string` supplied to `ModalProgressLoader`, 
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

FileList.propTypes = {
  allFilesSelected: PropTypes.bool 
  , dispatch: PropTypes.func.isRequired
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
  , viewingAs: PropTypes.oneOf(['workspace', 'general', 'admin', 'client', 'staff', 'personal', 'public']) 
}

FileList.defaultProps = {
  allFilesSelected: false 
  , handleOpenRequestModal: null 
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
  let { utilFileStore, sortedAndFilteredList, listArgsObj } = props
  let paginatedList = [];
  // let orderedList = []; 
  const loggedInUser = store.user.loggedIn.user
  const filter = utilFileStore.filter 
  const query = utilFileStore.query;
  const sortBy = listArgsObj && listArgsObj.ordervalue === 'asc' ? listArgsObj.ordername : `-${listArgsObj.ordername}`
  const staffListItem = store.staff.util.getList("_firm", props.match.params.firmId);
  const isFirmStaff = staffListItem && loggedInUser ? staffListItem.some((x) => x._user == loggedInUser._id && x.status == "active") : false;

  let { fIds } = queryString.parse(props.location.search);
  fIds = fIds ? fIds.split(',') : [];

  //  if (fIds && fIds.length && allFilesFromListArgs && allFilesFromListArgs.length) {
  //   sortedAndFilteredList = allFilesFromListArgs.filter((f) => {
  //     return fIds.includes(f._id.toString());
  //   });
  //  }

  //  if (sortedAndFilteredList) {

  //   // FILTER BY QUERY
  //   let queryTestString = ("" + query).toLowerCase().trim();
  //   queryTestString = queryTestString.replace(/[^a-zA-Z0-9]/g,''); // replace all non-characters and numbers

  //   if (queryTestString && query) {
  //     sortedAndFilteredList = sortedAndFilteredList.filter(file => {
  //       const user = store.user && store.user.byId ? store.user.byId[file._user] : ""
  //       file.fullname = user ? `${user.firstname} ${user.lastname}` : "";
  //       file.username = user ? user.username : "";
  //       return filterUtils.filterFile(queryTestString, file);
  //     });
  //   }

  //   // TODO: in future, separate filtering and sorting

  //   // SORT THE LIST
  //   switch(sortBy) {
  //     case 'filename': 
  //       orderedList = _.orderBy(sortedAndFilteredList, [item => item.filename.toLowerCase()], ['asc']); 
  //       break;
  //     case '-filename':
  //       orderedList = _.orderBy(sortedAndFilteredList, [item => item.filename.toLowerCase()], ['desc']); 
  //       break;
  //     case 'user':
  //       orderedList = _.orderBy(sortedAndFilteredList, [item => item._user], ['asc']); 
  //       break;
  //     case '-user':
  //       orderedList = _.orderBy(sortedAndFilteredList, [item => item._user], ['desc']); 
  //       break; 
  //     case 'date':
  //       orderedList = _.orderBy(sortedAndFilteredList, [item => item.updated_at], ['asc']);
  //       break;
  //     case '-date':
  //       orderedList = _.orderBy(sortedAndFilteredList, [item => item.updated_at], ['desc']);
  //       break;
  //     case 'visible':
  //       orderedList = sortedAndFilteredList.filter(file => file.status == "visible");
  //       break;
  //     case '-visible':
  //       orderedList = sortedAndFilteredList.filter(file => file.status == "hidden");
  //       break;
  //     case 'client':
  //       orderedList = _.orderBy(sortedAndFilteredList, [item => item._client], ['asc']);
  //       break;
  //     case '-client':
  //       orderedList = _.orderBy(sortedAndFilteredList, [item => item._client], ['desc']);
  //       break;
  //     default:
  //       orderedList = _.orderBy(sortedAndFilteredList, [item => item.filename.toLowerCase()], ['asc']);
  //       break;
  //   }

  //   if (orderedList) {
  //     orderedList = orderedList.sort((a,b) => {
  //       let aIndex = a.category === "folder" ? 0 : 1;
  //       let bIndex = b.category === "folder" ? 0 : 1;
  //       return aIndex - bIndex;
  //     });
  //   }

  //   // APPLY PAGINATION
  //   const pagination = utilFileStore.pagination || {page: 1, per: 50};
  //   const start = (pagination.page - 1) * pagination.per;
  //   const end = start + pagination.per;
    paginatedList = sortedAndFilteredList;
    
  
  return {
    loggedInUser
    , clientStore: store.client
    , paginatedList: paginatedList
    , fileStore: store.file
    , tagStore: store.tag
    , staffClientStore: store.staffClient
    , staffStore: store.staff
    , clientUserStore: store.clientUser
    , socket: store.user.socket
    , userMap: store.user.byId
    , firmStore: store.firm
    , staffListItem
    , isFirmStaff
    , sortBy
    , fIds
    , newSortedAndFilteredList: sortedAndFilteredList
    , fileMap: store.file.byId
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(FileList)
);
