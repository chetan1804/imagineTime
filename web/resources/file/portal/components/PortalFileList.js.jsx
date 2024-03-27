/**
 * View component for /firm/:firmId/workspaces/:clientId/files 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import queryString from 'query-string';

// import third-party libraries
import ReactTooltip from 'react-tooltip';

// import actions 
import * as fileActions from '../../fileActions'; 
import * as firmActions from '../../../firm/firmActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import FilterBy from '../../../../global/components/helpers/FilterBy.js.jsx';
import PageTabber from '../../../../global/components/pagination/PageTabber.js.jsx';
import DisplayAsButtons from '../../../../global/components/helpers/DisplayAsButtons.js.jsx';
import { CheckboxInput } from '../../../../global/components/forms'
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import ModalProgressLoader from '../../../../global/components/modals/ModalProgressLoader.js.jsx';
import MobileActionsOption from '../../../../global/components/helpers/MobileActionOptions.js.jsx';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';


// import utils
import fileUtils from '../../../../global/utils/fileUtils';
import downloadsUtil from '../../../../global/utils/downloadsUtil';
import permissions from '../../../../global/utils/permissions';

// import resource components
import PortalFileGridListItem from './PortalFileGridListItem.js.jsx';
import PortalFileTableListItem from './PortalFileTableListItem.js.jsx';
import { match } from 'assert';

const async = require('async');

class PortalFileList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      displayAs: 'table'
      , downloadWarningModalOpen: false
      , progressStart: false
      , progressDetail: {}
      , showMobileActionOption: false
      , onProcess: false
    }
    this._bind(
      '_handleSelectedTagsChange'
      , '_handleDownloadFiles'
      , '_handleFilter'
      , '_handleDeleteFiles'
      , '_clearAllState'
      , '_handleCloseMobileOption'
      , '_downloadSelectedFiles'
    )
  }

  componentDidMount() {
    const { dispatch, match, socket, loggedInUser, fileListArgs } = this.props; 

    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    // To make the upload progress meter work this component needs to listen for specific socket events.
    // socket.on('file_update_status', progressDetail => {
    //   this.setState({ progressDetail })
    // });

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
      if (this.props.roleModal != "file_version") {
        this.setState({ progressStart });
      }
    });
    socket.on('file_update_status', progressDetail => {
      if (this.props.roleModal != "file_version") {
        this.setState({ progressDetail });
      }
    });
    socket.on('file_update_progress_end', (action, files) => {
      this.setState({ progressDetail: { filename: "fetch data...", percent: 100 } }, () => {
        if (this.props.roleModal != "file_version") {
          if (action != "move") {
            this.props.handleUpdateList();
          }
          this._clearAllState();  
        }
      });
    });
  }

  componentWillUnmount() {
    const { socket  } = this.props;
    socket.off("disconnect");
    socket.off("connect");
    socket.off("file_update_progress_start");
    socket.off("file_update_status");
    socket.off("file_update_progress_end");
  }

  _clearAllState() {
    const { clearSelectedFileIds } = this.props;
    this.setState({
      downloadWarningModalOpen: false
      , progressStart: false
      , progressDetail: {}
      , onProcess: false
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

  _handleDownloadFiles() {
    this.setState({ onProcess: true });
    const { fileStore, socket, loggedInUser, selectedFileIds, clearSelectedFileIds, firmStore, newSortedAndFilteredList } = this.props; 
    const selectedFirm = firmStore.selected.getItem();
    const sendData = {
      selectedFileIds
      , files: _.cloneDeep(newSortedAndFilteredList)
      , filesMap: _.cloneDeep(fileStore.byId)
      , userLevel: 'clientuser'
      , socket
      , loggedInUser
    };

    if (selectedFileIds && selectedFileIds.length > 1 && selectedFirm && selectedFirm.zipFilesDownload) {
      downloadsUtil.bulkZipped(sendData, response => {
        this._clearAllState();
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
            this._clearAllState();
          });
        } else {
          this._clearAllState();
        }
    } else {
      this._clearAllState();
    }
  }

  _downloadSelectedFiles(downloadlinks, index) {
    if(index < downloadlinks.length) {
      var a  = document.createElement("a"); 
      a.setAttribute('href', `${downloadlinks[index]}?userLevel=clientuser&type=downloaded`); 
      a.setAttribute('download', '');
      a.setAttribute('target', '_blank');       
      a.click();
      index++;
      setTimeout(() => {
        this._downloadSelectedFiles(downloadlinks, index); 
      }, 500);
    }
  }

  _handleFilter(sortBy) {
    const { utilFileStore, dispatch, match } = this.props; 
    let newFilter = utilFileStore.filter;
    if(utilFileStore.filter.sortBy && utilFileStore.filter.sortBy.indexOf("-") < 0) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0)
    }
    newFilter.sortBy = sortBy;

    dispatch(fileActions.setFilter(newFilter, ...["~client", match.params.clientId, 'status', 'portal-view']));
  }

  _handleDeleteFiles() {
    const { dispatch, selectedFileIds, selectedClient, clearSelectedFileIds } = this.props; 
    const sendData = { 
      status: 'archived'
      , filesId: selectedFileIds
      , action: "status"
      , firmId: selectedClient._firm
      , viewingAs: "portal"
    };

    dispatch(fileActions.sendUBulkupdateFiles(sendData)).then(json => {
      if (!json.success) {
        alert("ERROR: " + json.error)
      }
    });
  }

  _handleCloseMobileOption(e) {
    e.stopPropagation();
    this.setState({ showMobileActionOption: false });
  }

  render() {
    const {
      allTags
      , utilFileStore
      , handleSetPagination
      , handleToggleSelectAll
      , paginatedList
      , handleSelectFile
      , selectedFileIds
      , selectedTagIds
      , sortedAndFilteredList
      , totalListInfo
      , fileActivityListItems
      , loggedInUser
      , selectedFirm
      , handleOpenCreateFolderModal
      , handleOpenUploadModal
      , fileStore
      , newSortedAndFilteredList
      , handleOpenMoveFileModal
      , handleOpenMoveSingleFileModal
      , selectedClient
      , handleOpenFileVersionModal
      , match
      , staffStore
      , clientUserStore
      , handleSort
      , sortBy
    } = this.props;

    const {
      downloadWarningModalOpen
      , progressStart
      , progressDetail
      , showMobileActionOption
      , onProcess
    } = this.state;

    const filter = utilFileStore && utilFileStore.filter && utilFileStore.filter.sortBy; 

    const isEmpty = (
      !utilFileStore
      || !utilFileStore.items
    )

    const isFetching = (
      utilFileStore
      && utilFileStore.isFetching
    )

    const isFiltered = (
      totalListInfo
      && utilFileStore
      && utilFileStore.items
      && totalListInfo.items
      && totalListInfo.items.length > utilFileStore.items.length
    )

    let allFilesSelected = paginatedList.every(p => selectedFileIds.includes(p._id)); 

    // folder is not allowed to download

    let selectedFile = {};
    let parentFolder = {};

    if(match.params.folderId) {
      selectedFile = !!fileStore.byId[match.params.folderId] ? fileStore.byId[match.params.folderId] : {};
      parentFolder = selectedFile;
    }

    const role = permissions.getUserRole(loggedInUser, selectedFirm._id, match.params.clientId, staffStore, clientUserStore);
    
    console.log('selectedFile', selectedFile);
    console.log('selectedFirm', selectedFirm);
    console.log('user role', role);

    return (
      <div className="-portal-content">
        <div className="yt-row with-gutters space-between">
          <div className="yt-col full s_60 m_70">
            { isEmpty ?
              (isFetching ? 
                <div className="-loading-hero">
                  <div className="u-centerText">
                    <div className="loading"></div>
                  </div>
                </div>  
                : 
                <h2>Empty.</h2>
              )
              :
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
                        viewingAs="portal-file-list"
                        selectedFileIds={selectedFileIds}
                        handleDownloadFiles={selectedFileIds && selectedFileIds.length <= 10 ? this._handleDownloadFiles :  () => { this.setState({downloadWarningModalOpen: true})}}
                        handleDeleteFiles={this._handleDeleteFiles}
                        handleOpenUploadModal={handleOpenUploadModal}
                        handleOpenCreateFolderModal={handleOpenCreateFolderModal}
                        selectedFirm={selectedFirm}
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
                    <div className="-options -right">
                      {
                        selectedFirm.allowMoveFiles ?
                        <button
                          className="yt-btn x-small link info"
                          disabled={(selectedFileIds ? selectedFileIds.length > 0 ? false : true : true) || onProcess}
                          onClick={handleOpenMoveFileModal}
                        > Move { selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null} </button>
                        // <button className="yt-btn x-small info" onClick={handleOpenMoveFileModal} disabled={onProcess}>Move</button>
                        : null
                      }
                      {
                        permissions.hasPermission(selectedFirm, parentFolder, selectedFile, `${role}Download`) ?
                        <button
                          className="yt-btn x-small link info"
                          disabled={(selectedFileIds ? selectedFileIds.length > 0 ? false : true : true) || onProcess}
                          onClick={selectedFileIds && selectedFileIds.length <= 10 ? this._handleDownloadFiles :  () => { this.setState({downloadWarningModalOpen: true})}}
                        > Download { selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null} </button>
                        :
                        <div data-tip data-for="PFL_DisableDownload">
                          <button
                            className="yt-btn x-small link info"
                            disabled={true}
                            onClick={null}
                          >
                            <i className="fas fa-lock"/> Download
                          </button>
                          <ReactTooltip id="PFL_DisableDownload" place="top" type="warning" effect="solid">
                            <span className="tooltipMessage">You don't have permission to <br/> download files and folders</span>
                          </ReactTooltip>
                        </div>
                      }
                      {
                        selectedFirm.allowDeleteFiles ?
                        //permissions.hasPermission(selectedFirm, parentFolder, selectedFile, `${role}Delete`) ?
                        <button
                          className="yt-btn x-small link info"
                          disabled={(selectedFileIds ? selectedFileIds.length > 0 ? false : true : true) || onProcess}
                          onClick={this._handleDeleteFiles}
                        > Delete { selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null} </button>
                        : 
                        <div data-tip data-for="PFL_DisableDelete">
                          <button
                            className="yt-btn x-small link info"
                            disabled={true}
                            onClick={null}
                          >
                            <i className="fas fa-lock"/> Delete
                          </button>
                          <ReactTooltip id="PFL_DisableDelete" place="top" type="warning" effect="solid">
                            <span className="tooltipMessage">You don't have permission to <br/> delete files and folders</span>
                          </ReactTooltip>
                        </div>
                      }
                      <DisplayAsButtons
                        displayAs={this.state.displayAs}
                        displayGrid={() => this.setState({displayAs: 'grid'})}
                        displayTable={() => this.setState({displayAs: 'table'})}
                      />
                      {
                        permissions.hasPermission(selectedFirm, parentFolder, selectedFile, `${role}Upload`) ?
                        <button className="yt-btn x-small info" onClick={handleOpenUploadModal} disabled={onProcess}>Upload new files</button>
                        :
                        <div data-tip data-for="PFL_DisableUpload">
                          <button
                            className="yt-btn x-small info"
                            disabled={true}
                            onClick={null}
                          >
                            <i className="fas fa-lock"/> Upload new files
                          </button>
                          <ReactTooltip id="PFL_DisableUpload" place="top" type="warning" effect="solid">
                            <span className="tooltipMessage">You don't have permission to <br/> upload files</span>
                          </ReactTooltip>
                       </div>
                      }
                      {
                        //selectedFirm.allowCreateFolder ?
                        //permissions.hasPermission(selectedFirm, parentFolder, selectedFile, `${role}Create`)
                        selectedFirm.allowCreateFolder ?
                        <button className="yt-btn x-small info" onClick={handleOpenCreateFolderModal} disabled={onProcess}>New folder</button>
                        :
                        <div data-tip data-for="PFL_DisableCreate">
                          <button
                            className="yt-btn x-small info"
                            disabled={true}
                            onClick={null}
                          >
                            <i className="fas fa-lock"/> New Folder
                          </button>
                          <ReactTooltip id="PFL_DisableCreate" place="top" type="warning" effect="solid">
                            <span className="tooltipMessage">You don't have permission to <br/> create new folder</span>
                          </ReactTooltip>
                      </div>
                      }
                    </div>
                  </div>
                </div>
                { this.state.displayAs === 'grid' ?
                  <div className="file-grid" >
                    <div>
                      <strong className="u-muted">
                        { isFiltered ?
                          <small>Matching Files &mdash; {newSortedAndFilteredList.length}</small>
                          :
                          <small>All Files &mdash; {newSortedAndFilteredList.length}</small>
                        }
                      </strong>
                      <strong>
                        <small className="per-page-select u-pullRight u-muted">
                          <label>Show per page: </label>
                          <select
                            name="numPerPage"
                            onChange={(e) => this.props.setPerPage(e.target.value)}
                            value={utilFileStore.pagination.per}
                          >
                            <option value={25}> 25 </option>
                            <option value={50}> 50 </option>
                            <option value={100}> 100 </option>
                          </select>
                        </small>
                      </strong>
                    </div>
                    { paginatedList.length > 0 ?
                      <div className="yt-row with-gutters">
                        {paginatedList.map((file, i) => 
                          // (file && file.permission && !!file.permission.showFolderClientPortal) ?
                          <PortalFileGridListItem 
                            key={'file_' + file._id + '_' + i}
                            file={file}
                            handleSelectFile={this.props.handleSelectFile}
                            checked={this.props.selectedFileIds.includes(file._id)}
                            fileActivityListItems={fileActivityListItems}
                          />
                        )}
                      </div>
                      :
                      <div className="empty-state">
                        <em>No files</em>
                      </div>
                    }
                  </div>
                  : 
                  <div className="yt-table table firm-table -workspace-table truncate-cells" style={{ opacity: onProcess ? '0.5' : 1 }}>
                    <div className="table-caption">
                      <PageTabber
                        totalItems={utilFileStore.totalFiles}
                        totalPages={Math.ceil(parseInt(utilFileStore.totalFiles) / (utilFileStore.pagination && parseInt(utilFileStore.pagination.per)))}
                        pagination={utilFileStore.pagination}
                        setPagination={handleSetPagination}
                        setPerPage={this.props.setPerPage}
                        viewingAs="top"
                        itemName="portal"
                        searchText="Search..."
                        isChanged={true}
                        clientId={selectedClient && selectedClient._id}
                        folderId={match.params.folderId}
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
                          { sortBy == 'filename' ? 
                            <i className="fad fa-sort-down"></i>
                          : sortBy == '-filename' ?
                            <i className="fad fa-sort-up"></i>
                          : 
                            <i className="fad fa-sort"></i>
                          }
                        </div>
                        {
                          selectedFirm && selectedFirm.fileVersionType === "enable" ? 
                          <div className="table-cell">Versions</div> 
                          : null 
                        }
                        <div className="table-cell _20">Tags</div>
                        {/* <div className="-date sortable" onClick={null}>Year</div> */}
                        <div className="table-cell -date sortable" onClick={() => handleSort('updated_at')}>Last Updated
                          { sortBy == 'updated_at' ? 
                            <i className="fad fa-sort-up"></i>
                          : sortBy == '-updated_at' ?
                            <i className="fad fa-sort-down"></i>
                          : 
                            <i className="fad fa-sort"></i>
                          }
                        </div>
                        {/* <th className="-comments"/> */}
                      </div>
                      { paginatedList.length > 0 ? 
                        paginatedList.map((file, i) => 
                          // (file.category != 'folder') || (file && file.permission && !!file.permission.showFolderClientPortal) ?
                          <PortalFileTableListItem 
                            key={'file_' + file._id + '_' + i}
                            file={file}
                            handleSelectFile={this.props.handleSelectFile}
                            checked={this.props.selectedFileIds.includes(file._id)}
                            fileActivityListItems={fileActivityListItems}
                            handleOpenMoveSingleFileModal={handleOpenMoveSingleFileModal}
                            selectedClient={selectedClient}
                            selectedFirm={selectedFirm}
                            handleOpenFileVersionModal={() => handleOpenFileVersionModal(file)}
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
                }
                <PageTabber
                  totalItems={utilFileStore.totalFiles}
                  totalPages={Math.ceil(parseInt(utilFileStore.totalFiles) / (utilFileStore.pagination && parseInt(utilFileStore.pagination.per)))}
                  pagination={utilFileStore.pagination}
                  setPagination={handleSetPagination}
                  setPerPage={this.props.setPerPage}
                  viewingAs="bottom"
                  itemName="portal"
                  searchText="Search..."
                  isChanged={true}
                  clientId={selectedClient && selectedClient._id}
                  folderId={match.params.folderId}
                />
              </div>
            }
          </div>
          <div className="yt-col full s_40 m_25 portal-info-helper">
            <div className="-content-box">
              <div className="-icon">
                <i className="fal fa-lightbulb-on"/>
              </div>
              <p>You can find all your files associated with your client account here. </p>
            </div>
            {/* <div className="-need-help" style={{marginTop: '32px'}}>
              <p className="u-centerText">Need to chat?</p>
              <button className="yt-btn bordered block x-small info">Schedule a call</button>
            </div> */}
          </div>
        </div>
        <AlertModal
          alertTitle="More than ten files have been selected"
          alertMessage="While ImagineShare allows you to download unlimited files simultaneously, certain browsers may limit you to downloading 10 separate files at one time. If you experience this, please select a maximum of 10 files per download attempt."
          closeAction={() => this.setState({downloadWarningModalOpen: false})}
          confirmAction={this._handleDownloadFiles}
          confirmText="Continue downloading"
          isOpen={downloadWarningModalOpen}
          type="warning"
        />
        <ModalProgressLoader
          isOpen={progressStart} // app.js.jsx?93ea:56 Warning: Failed prop type: Invalid prop `isOpen` of type `string` supplied to `ModalProgressLoader`, 
          cardSize='standard'
          modalHeader="Processing..."
          progressDetail={progressDetail}
        >
          <p></p>
        </ModalProgressLoader>
      </div>
    )
  }
}

PortalFileList.propTypes = {
  allFilesSelected: PropTypes.bool
  , dispatch: PropTypes.func.isRequired
  , utilFileStore: PropTypes.object.isRequired
  , allTags: PropTypes.array.isRequired
  , selectedTagIds: PropTypes.array
  , handleFilter: PropTypes.func.isRequired
  , handleOpenUploadModal: PropTypes.func 
  , handleQuery: PropTypes.func.isRequired 
  , handleSetPagination: PropTypes.func.isRequired
  , handleSort: PropTypes.func.isRequired 
  , sortedAndFilteredList: PropTypes.array 
}

PortalFileList.defaultProps = {
  allFilesSelected: false
  , handleOpenShareModal: null 
  , handleOpenUploadModal: null 
  , sortedAndFilteredList: []
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
   let { utilFileStore, fileListItems, fileListArgs } = props;
   let paginatedList = [];
   let orderedList = []; 
   const filter = utilFileStore.filter 
   const query = filter ? filter.query : '';
   // const sortBy = filter ? filter.sortBy : 'date'; 
   paginatedList = fileListItems;
   
   let sortBy = fileListArgs && fileListArgs.searchSortName;
   if (fileListArgs.searchSortAsc === "desc") {
     sortBy = '-' + sortBy;
   } 
  
  return {
    paginatedList: paginatedList
    , fileStore: store.file
    , loggedInUser: store.user.loggedIn.user
    , socket: store.user.socket
    , firmStore: store.firm
    , clientUserStore: store.clientUser
    , staffStore: store.staff
    , newSortedAndFilteredList: fileListItems
    , sortBy
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PortalFileList)
);
