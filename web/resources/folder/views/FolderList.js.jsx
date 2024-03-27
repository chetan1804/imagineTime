/**
 * Resuable component for an actionable file list used by both /admin and /firm users 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import Select from 'react-select'; 

// import third-party libraries
import { DateTime } from 'luxon';

// import actions 
import * as fileActions from '../../file/fileActions'; 
import * as tagActions from '../../tag/tagActions'; 

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import FilterBy from '../../../global/components/helpers/FilterBy.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';
import { CheckboxInput } from '../../../global/components/forms'
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';
import AlertModal from '../../../global/components/modals/AlertModal.js.jsx';
import Modal from '../../../global/components/modals/Modal.js.jsx';

// import resource components
import FileTableListItem from '../../file/components/FileTableListItem.js.jsx';
import FileListOptions from '../../file/practice/components/FileListOptions.js.jsx'; 
import FolderTableListItem from '../components/FolderTableListItem.js.jsx';

// import utils
import routeUtils from '../../../global/utils/routeUtils';
import fileUtils from '../../../global/utils/fileUtils'; 
import filterUtils from '../../../global/utils/filterUtils'; 
import permissions from '../../../global/utils/permissions';

class FolderList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      tagQuery: ''
      , fileOptionsOpen: false
      , downloadWarningModalOpen: false
      , showClientList: false
      , clientId: 0
      , bulkMoveSubmit: false
      , archiveProcess: false
      , checked: false
    }
    this._bind(
      '_handleSelectedTagsChange'
      , '_handleFilter'
      , '_handleCloseFileListOptions'
      , '_handleOpenFileListOptions'
      , '_handleDownloadFiles'
      , '_handleBulkArchiveFiles'
      , '_selectedFilesMove'
    )
  }

  componentDidMount() {
    const { dispatch, match } = this.props; 
    dispatch(tagActions.fetchListIfNeeded('~firm', match.params.firmId));
    dispatch(tagActions.fetchDefaultTag()); 
    dispatch(tagActions.setQuery('', '~firm', match.params.firmId)); 
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
    console.log("handleSelectedTagsChange", e)
    // additional logic here if we want to break out tags into multiple filters, ie years
    // for now e.target.value contains all of the filters, but may only contain a subset
    // the output to the parent should be the entire list of tags
    this.props.handleFilter(e)
  }

  _handleFilter(sortBy) {
    const { fileList, dispatch, fileListArgs } = this.props; 
    let newFilter = fileList.filter;
    if(fileList.filter.sortBy && fileList.filter.sortBy.indexOf("-") < 0) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0)
    }
    newFilter.sortBy = sortBy;
    dispatch(fileActions.setFilter(newFilter, fileListArgs));
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

  _handleDownloadFiles() {
    const { fileStore, selectedFileIds, clearSelectedFileIds } = this.props; 
    let downloadLinks = selectedFileIds.map(item => fileUtils.getDownloadLink(fileStore.byId[item]));

    downloadLinks.map(link => {
      var a  = document.createElement("a"); 
      a.setAttribute('href', `${link}?userLevel=staffclient&type=downloaded`); 
      a.setAttribute('download', '');
      a.setAttribute('target', '_blank');       
      a.click(); 
    })
    clearSelectedFileIds();
    this.setState({downloadWarningModalOpen: false})
  }

  _handleBulkArchiveFiles() {
    console.log("bulk update status");

    const { dispatch, selectedFileIds, clearSelectedFileIds } = this.props; 

    const data = { status: 'archived', filesId: selectedFileIds };

    this.setState({ archiveProcess: true });
    dispatch(fileActions.sendBulkUpdateFilesStatus(data)).then(json => {
      clearSelectedFileIds();
      this.setState({ archiveProcess: false, selectedFileIds: [], checked: false });
    })
  }

  _selectedFilesMove() {
    const { dispatch, selectedFileIds, fileListArgs, clearSelectedFileIds, match } = this.props; 

    this.setState({ bulkMoveSubmit: true });

    // const { dispatch, file, fileListArgs } = this.props; 
    dispatch(fileActions.sendUBulkupdateFiles(this.state.clientId, selectedFileIds)).then(json => {
      console.log('RES', ...fileListArgs);
      if (json.success) {
        dispatch(fileActions.fetchList('~firm', match.params.firmId)).then(json => {
          console.log('test', json);
          clearSelectedFileIds();
          this.setState({ bulkMoveSubmit: false, showClientList: false });
        });
      }
    });
  }

  render() {
    const {
      allTags
      , clientStore
      , fileList
      , fileListArgs
      , handleSetPagination
      , handleToggleSelectAll
      , handleOpenQuickTaskModal
      , handleOpenShareModal
      , match
      , orderedList // Use this list to get matching file count after filters.
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
      , handleOpenCreateFolderModal
      , handleOpenUploadModal
      , folderList
      , folderListInfo
    } = this.props;

    const {
      archiveProcess
    } = this.state;

    console.log("folderList", folderList);
    console.log("folderListInfo", folderListInfo);

    /**
     * NOTE: Normally we would use fileList.items.length for the total file count. However, that list
     * includes files that have a status of 'archived', 'deleted', and null. sortedAndFilteredList is all
     * files that have a status of 'hidden' and 'visible' (and also 'none'). So we'll use sortedAndFiltered 
     * list to track totalfile count.
     * 
     * orderedList is created below in mapStoreToProps. It is the list after it is modified by filters. We'll
     * use it to keep track of matching file count.
     */
    const isFiltered = (
      sortedAndFilteredList
      && orderedList
      && sortedAndFilteredList.length !== orderedList.length
    )
    const filter = fileList && fileList.filter && fileList.filter.sortBy; 

    let allFilesSelected = paginatedList.every(p => selectedFileIds.includes(p._id)); 

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
    filteredByQuery = tagList && tagList.items ? tagList.items.filter((tagId) => {
      return filterUtils.filterTag(queryTestString, tagStore.byId[tagId]);
    }) : [];

    sortedTagListItems = filteredByQuery.map((item) => {
      var newItem = tagStore.byId[item];
      tagNameList.push(newItem.name); 
      return newItem;
    });

    const staffClientList = staffClientStore.util.getList('_firm', match.params.firmId, '_user', loggedInUser._id + "", '~staff.status', 'active'); 
    const clientList = staffClientList && staffClientList.map(sf => clientStore.byId[sf._client]); 

    const ownerClientList = clientStore.util.getList('_firm', match.params.firmId); 
    const isFirmOwner = permissions.isStaffOwner(staffStore, loggedInUser, match.params.firmId); 
    const clients = isFirmOwner ? ownerClientList : clientList; 
    
    let options = [];
    if (clients) {
      for (const client of clients) {
        if(client && client._id) {
          if (client.status === "visible") {
            let newObj = {
              value: client._id
              , label: client.name
            }
            options.push(newObj);
          }
        }
      }  
    }

    console.log("paginatedList", paginatedList)

    return (
      <div className="file-list-wrapper">
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
                <button disabled={selectedFileIds.length < 1} className="yt-btn x-small link info" onClick={() => this.setState({ showClientList: true })}>Move { selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null} </button>
                <button disabled={selectedFileIds.length < 1} className="yt-btn x-small link info" onClick={selectedFileIds && selectedFileIds.length <= 10 ? this._handleDownloadFiles : () => { this.setState({downloadWarningModalOpen: true})}}>Download { selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null}</button>
                <button
                  disabled={selectedFileIds.length < 1}
                  className="yt-btn x-small link info"
                  style={{display: "inline-flex"}}
                  onClick={this._handleBulkArchiveFiles}
                >
                  { archiveProcess ? (<p className="-archive-saving">Archiving<span>.</span><span>.</span><span>.</span></p>) : "Archive" }
                  { archiveProcess ? null : selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null }
                </button>
                { handleOpenShareModal ? 
                  <button className="yt-btn x-small link info" onClick={handleOpenShareModal}>Share files { selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null} </button>
                  :
                  null 
                }
                { this.props.handleOpenRequestModal ?
                  <button className="yt-btn x-small link info" onClick={this.props.handleOpenRequestModal}>Request files</button>
                  :
                  null 
                }
                <button className="yt-btn x-small info" onClick={handleOpenCreateFolderModal}>New Workspace</button>
              </div>
              :
              null 
            }
          </div>
        </div>
        <hr/>
        <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table">
          <div className="table-caption">
            { isFiltered ?
              <small>Matching Files &mdash; {orderedList.length} of {sortedAndFilteredList.length}</small>
              :
              <small>All Files &mdash; {sortedAndFilteredList.length}</small>
            }
            <div className="per-page-select u-pullRight">
              <label>Show per page: </label>
              <select
                name="numPerPage"
                onChange={(e) => this.props.setPerPage(e.target.value)}
                value={fileList.pagination && fileList.pagination.per || 50}
              >
                <option value={25}> 25 </option>
                <option value={50}> 50 </option>
                <option value={100}> 100 </option>
              </select>
            </div>
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
              <div className="table-cell -title sortable" onClick={() => this._handleFilter('filename')}>Name
                {filter && filter == 'filename' ? 
                  <i className="fad fa-sort-down"></i>
                : filter && filter == '-filename' ?
                  <i className="fad fa-sort-up"></i>
                : 
                  <i className="fad fa-sort"></i>
                }
              </div>
              <div className="table-cell _20">Tags</div>
              { viewingAs === "general" || viewingAs === "admin" ? 
                <div className="table-cell -client sortable" onClick={() => this._handleFilter('client')}>Client
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
              }
              {/* ??ND <div className="table-cell sortable" onClick={() => this._handleFilter('visible')}>Visibility</div>  */}
              <div className="table-cell -date sortable" onClick={() => this._handleFilter('date')}>Last Updated
                {filter && filter == 'date' ? 
                  <i className="fad fa-sort-up"></i>
                : filter && filter == '-date' ?
                  <i className="fad fa-sort-down"></i>
                : 
                  <i className="fad fa-sort"></i>
                }
              </div>
            </div>
            { paginatedList && paginatedList.length > 0 ? 
              paginatedList.sort((a, b) => a.created_at - b.created_at).map((file, i) => 
              <FolderTableListItem 
                key={'file_' + file._id + '_' + i} 
                client={file._client && clientStore.byId[file._client] ? clientStore.byId[file._client] : null }
                file={file}
                checked={this.props.selectedFileIds.includes(file._id)}
                handleSelectFile={this.props.handleSelectFile}
                handleOpenQuickTaskModal={() => handleOpenQuickTaskModal(file)}
                showOptions={true}
                viewingAs={viewingAs}
                fileListArgs={fileListArgs}
                sortedTagListItems={sortedTagListItems}
                tagNameList={tagNameList}
              />
            )
            :
            <div className="table-head empty-state">
              <div className="table-cell" colSpan="5">
                <em>No workspaces</em>
              </div>
            </div>
            }
        </div>
        <PageTabber
          totalItems={isFiltered ? orderedList.length : sortedAndFilteredList.length}
          totalPages={Math.ceil(isFiltered ? orderedList.length / fileList.pagination.per : sortedAndFilteredList.length / fileList.pagination.per)}
          pagination={fileList.pagination}
          setPagination={handleSetPagination}
          setPerPage={this.props.setPerPage}
          viewingAs="bottom"
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
      <Modal
        cardSize='standard'
        closeAction={() => this.setState({ showClientList: false })}
        isOpen={this.state.showClientList}
        modalHeader={'Move files new client'}
        showButtons={true}
        confirmAction={this._selectedFilesMove}
        confirmText={this.state.bulkMoveSubmit ? 'Submitting' : 'Save'}
        disableConfirm={!this.state.clientId || this.state.bulkMoveSubmit}
      >
        <Select 
          options={options.length ? options.sort((a, b) => (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0)) : null}
          onChange={(e) => this.setState({ clientId: e.value })}
          value={options.length ? options.find(o => o.value == this.state.clientId) : null}
        />
      </Modal>           
      </div>
    )
  }
}

FolderList.propTypes = {
  allFilesSelected: PropTypes.bool 
  , dispatch: PropTypes.func.isRequired
  , fileList: PropTypes.object.isRequired
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

FolderList.defaultProps = {
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
   const { fileList, sortedAndFilteredList, folderList } = props;
   let paginatedList = [];
   let orderedList = []; 
   const filter = folderList.filter 
   const query = filter ? filter.query : '';
   const sortBy = filter ? filter.sortBy : 'date'; 

   if(sortedAndFilteredList) {

    // TODO: in future, separate filtering and sorting 

    // SORT THE LIST
    switch(sortBy) {
      case 'filename': 
        orderedList = _.orderBy(sortedAndFilteredList, [item => item.filename.toLowerCase()], ['asc']); 
        break;
      case '-filename':
        orderedList = _.orderBy(sortedAndFilteredList, [item => item.filename.toLowerCase()], ['desc']); 
        break;
      case 'user':
        orderedList = _.orderBy(sortedAndFilteredList, [item => item._user], ['asc']); 
        break;
      case '-user':
        orderedList = _.orderBy(sortedAndFilteredList, [item => item._user], ['desc']); 
        break; 
      case 'date':
        orderedList = _.orderBy(sortedAndFilteredList, [item => item.updated_at], ['asc']);
        break;
      case '-date':
        orderedList = _.orderBy(sortedAndFilteredList, [item => item.updated_at], ['desc']);
        break;
      case 'visible':
        orderedList = sortedAndFilteredList.filter(file => file.status == "visible");
        break;
      case '-visible':
        orderedList = sortedAndFilteredList.filter(file => file.status == "hidden");
        break;
      case 'client':
        orderedList = _.orderBy(sortedAndFilteredList, [item => item._client], ['asc']);
        break;
      case '-client':
        orderedList = _.orderBy(sortedAndFilteredList, [item => item._client], ['desc']);
        break;
      default:
        orderedList = _.orderBy(sortedAndFilteredList, [item => item.filename.toLowerCase()], ['asc']);
    }
    

    // default workspace update_at same value in client created_at
    const client = store.client && store.client.selected ? store.client.selected.getItem() : { created_at: "2020-01-01T19:58:28.288Z" };

    // add default workspace
    const workspace = {
        _id: 0
        , filename: "workspace (default)"
        , updated_at: client.created_at  // DateTime.fromISO(new Date())
    }
    orderedList.unshift(workspace);
    console.log('orderedList', store.client)

    // APPLY PAGINATION
    const pagination = {page: 1, per: 50} // folderList.pagination ? _.isEmpty(folderList.pagination) ? folderList.pagination : {page: 1, per: 50} : {page: 1, per: 50};
    const start = (pagination.page - 1) * pagination.per;
    const end = start + pagination.per;
    paginatedList = _.slice(orderedList, start, end);
   }
  
  return {
    loggedInUser: store.user.loggedIn.user
    , clientStore: store.client
    , orderedList
    , paginatedList: paginatedList
    , fileStore: store.file
    , tagStore: store.tag
    , staffClientStore: store.staffClient
    , staffStore: store.staff
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(FolderList)
);
