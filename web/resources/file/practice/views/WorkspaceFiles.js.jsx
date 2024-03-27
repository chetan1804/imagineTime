/**
 * View component for /firm/:firmId/workspaces/:clientId/files 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter, Switch, Route } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import third-party libraries
import { Helmet } from 'react-helmet';
import YTRoute from '../../../../global/components/routing/YTRoute.js.jsx';

// import actions
import * as clientActions from '../../../client/clientActions';
import * as fileActions from '../../fileActions';
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../../user/userActions';
import * as tagActions from '../../../tag/tagActions';
import * as firmActions from '../../../firm/firmActions';
import * as fileActivityActions from '../../../fileActivity/fileActivityActions';
import * as folderPermissionActions from "../../../folderPermission/folderPermissionActions";

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import { permissions, routeUtils } from '../../../../global/utils';
import sortUtils from '../../../../global/utils/sortUtils';
import fileUtils from '../../../../global/utils/fileUtils';
import { FeedbackMessage  } from '../../../../global/components/helpers/FeedbackMessage.js.jsx';

// import resource components
import FileList from '../../components/FileList.js.jsx';
import WorkspaceLayout from '../../../client/practice/components/WorkspaceLayout.js.jsx';
import FileActivityOverview from '../../../fileActivity/views/FileActivityOverview.js.jsx';

import RoleModalComponent from '../../../../global/enum/RoleModalComponent.js.jsx';

class WorkspaceFiles extends Binder {
  feedbackMessage = React.createRef();

  constructor(props) {
    super(props);
    this.state = {
      page: 1
      , per: 50
      , query: ''
      , selectedFileIds: []
      , roleModal: null
      , selectedFile: null
      , listArgs: {
        '~firm': props.match.params.firmId
        , _client: props.match.params.clientId || 'null'
        , status: 'not-archived'
      }
      , searchListArgs: {
        searchFirmId: props.match.params.firmId
        , searchClientId: props.match.params.clientId
        , searchFolderId: props.match.params.folderId
        , searchPersonalId: props.match.params.userId
        , searchPageNumber: 1
        , searchPerPage: 25
        , searchSortName: 'updated_at'
        , searchSortAsc: 'desc'
        , searchViewingAs: 'workspace-view'
        , searchText: ''
      }
      , fileActivityArgs: {
        _firm:  props.match.params.firmId
        , _client: props.match.params.clientId || 'null'
        , _user: props.loggedInUser._id
        , action: "get-viewed-log"
      }
      , invalidateList: false
      , objFileActivityListItems: {}
    }
    this._bind(
      '_handleUploadedFiles'
      , '_handleSelectFile'
      , '_handleToggleSelectAll'
      , '_handleSetFilter'
      , '_handleSetPagination'
      , '_setPerPage'
      , '_clearSelectedFileIds'
      , '_handleQuery'
      , '_handleReload'
      , '_handleChangeRoleModal'
      , '_handleSelectedFileIds'
      , '_handleSort'
      , '_handleSetInvalidList'
      , '_handleUpdateList'
      , '_handleFileList'
      , '_handleSearch'
    );

    this.current = null;
  }

  componentDidMount() {
    this._handleReload(this.props.match.params.clientId);
  }

  componentWillReceiveProps(nextProps) {
    const { dispatch, match, location } = this.props;

    if (nextProps && nextProps.match && nextProps.match.params) {

      const fileId = nextProps.match.params.folderId;
      const fileMap = nextProps.fileMap;

      if (fileId && fileMap && fileMap[fileId] && fileMap[fileId].wasAccessed !== undefined && !fileMap[fileId].wasAccessed) {
        const file = fileMap[fileId];
        file.wasAccessed = true;
        dispatch(fileActions.sendUpdateFile(file));
      }

      if (this.props.match.params.folderId != fileId) {
        const searchListArgs = _.cloneDeep(this.state.searchListArgs);
        searchListArgs.searchFolderId = fileId || null;
        delete searchListArgs.searchFIds;
        this.setState({ searchListArgs }, () => {
          this._handleSetPagination({ page: 1, per: 50 });
        });
      }
    }

    const nextClientId = nextProps.match.params.clientId;
    const clientId = match.params.clientId;
    if (nextClientId !== clientId) {
      const searchArgs = {
        searchFirmId: match.params.firmId
        , searchClientId: nextClientId
        , searchPageNumber: 1
        , searchPerPage: 25  
        , searchSortName: 'updated_at'
        , searchSortAsc: 'desc'
        , searchViewingAs: 'workspace-view'
      }

      this.setState({ searchListArgs: searchArgs, selectedFileIds: [] }, () => {
        this._handleReload(nextClientId);
      });
    }

    if (nextProps && nextProps.match && nextProps.match.params && nextProps.match.params.folderId != match.params.folderId) {
      this.setState({ selectedFileIds: [] });
    }
  }

  _handleFileList(newState) {
    const dispatch = this.props.dispatch;
    const searchListArgs = newState.searchListArgs;
    dispatch(fileActions.fetchListIfNeededV2(searchListArgs, ...routeUtils.listArgsFromObject(searchListArgs))).then(json => {
      this.setState(newState, () => {
        dispatch(fileActions.setPagination({ page: searchListArgs.searchPageNumber, per: searchListArgs.searchPerPage }, ...routeUtils.listArgsFromObject(searchListArgs)));
      });
      if (json && json.success && json.list && json.list.length) {
        const fileIds = [];
        const folderIds = [];
        const allFileIds = [];
        json.list.map(item => {
          allFileIds.push(item._id)
          if (item && item.category === 'folder') {
            folderIds.push(item._id);
          } else {
            fileIds.push(item._id);
          }
        });
        const data = {
          firmId: searchListArgs.searchFirmId
          , clientId: searchListArgs.searchClientId
          , personalId: searchListArgs.searchPersonalId
          , searchViewingAs: searchListArgs.searchViewingAs
          , fileIds
          , folderIds
        }
        if (folderIds && folderIds.length) {
          const associatedFileArgs = { ...searchListArgs , action: 'files' };
          dispatch(fileActions.fetchTotalChildFileIfNeeded(data, ...routeUtils.listArgsFromObject(associatedFileArgs)));
          const associatedFolderArgs = { ...searchListArgs , action: 'folder' };
          dispatch(fileActions.fetchTotalChildFolderIfNeeded(data, ...routeUtils.listArgsFromObject(associatedFolderArgs)));
        }
      }
    });
  }

  _handleReload(clientId) {
    const { dispatch, loggedInUser, match, location } = this.props;
    const query = new URLSearchParams(location.search);

    const page = query.get('page') || 1;
    const perPage = query.get('per') || 50;
    const fIds = query.get('fIds') || null;
    const pagination = { page, per: perPage };

    if (fIds) {
      pagination.searchFIds = fIds;
    }
    this._handleSetPagination(pagination);
    if (clientId) {
      dispatch(userActions.fetchListIfNeeded('_client', clientId));
    }
    dispatch(fileActivityActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(this.state.fileActivityArgs))).then(json => {
      if (json && json.list && json.list.length) {
        const objFileActivityListItems = {};
        json.list.forEach(item => {
          if (item && item._file && !objFileActivityListItems[item._file]) {
            objFileActivityListItems[item._file] = true;
          }
        });
        this.setState({ objFileActivityListItems });
      }
    });
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(clientActions.fetchSingleIfNeeded(clientId));
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches contacts 
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
    dispatch(tagActions.fetchListIfNeeded('~firm', match.params.firmId));
    dispatch(tagActions.fetchDefaultTag()); 
    dispatch(tagActions.setQuery('', '~firm', match.params.firmId));
    dispatch(clientActions.fetchListIfNeeded('_firm', match.params.firmId, 'status', 'visible'));
  }
  
  componentWillUnmount() {
    const { dispatch } = this.props;
    const searchListArgs = routeUtils.listArgsFromObject(this.state.searchListArgs);
    dispatch(fileActions.setPagination({page: 1, per: 50}, ...searchListArgs));
    dispatch(fileActions.setFilter({query: '', sortBy: '-updated_at'}, ...searchListArgs));
    dispatch(fileActions.setQuery('', ...searchListArgs));
  }

  componentDidUpdate(prevProps, prevState) {
    console.log('check did update', prevProps, this.props);
  }

  _handleUploadedFiles(files) {
    // console.log('heeloo', files)

    // // Added fix from 1.3
    // const { dispatch } = this.props;
    // const searchListArgs = routeUtils.listArgsFromObject(this.state.searchListArgs) // computed from the object
    // dispatch(fileActions.invalidateList());
    // dispatch(fileActions.fetchListIfNeededV2(...searchListArgs)).then(res => {
    //   this.setState({ roleModal: null });
    // });
  }

  _handleSetFilter(e) {
    const { dispatch, history } = this.props;
    history.push({ search: '?page=1&per=50' });
    const searchListArgs = _.cloneDeep(this.state.searchListArgs);
    searchListArgs.searchPageNumber = 1;
    searchListArgs.searchPerPage = 50;
    searchListArgs.searchTags = e.target.value && e.target.value.join(',');
    const newState = { searchListArgs, selectedFileIds: [] };
    this._handleFileList(newState);
  }

  _handleSetPagination(pagination) {
    const { dispatch } = this.props;
    const searchListArgs = _.cloneDeep(this.state.searchListArgs);
    searchListArgs.searchPageNumber = pagination.page || searchListArgs.searchPageNumber;
    searchListArgs.searchPerPage = pagination.per || searchListArgs.searchPerPage;
    if (pagination.searchFIds) {
      searchListArgs.searchFIds = pagination.searchFIds;
    }
    const newState = { searchListArgs, selectedFileIds: [] };
    this._handleFileList(newState);
  }

  _handleSort(sortBy) {
    const { dispatch } = this.props;
    const searchListArgs = _.cloneDeep(this.state.searchListArgs);
    if (sortBy === searchListArgs.searchSortName) {
      searchListArgs.searchSortAsc = searchListArgs.searchSortAsc === 'asc' ? 'desc' : 'asc';
    } else {
      searchListArgs.searchSortAsc = 'desc';
      searchListArgs.searchSortName = sortBy;
    }
    const newState = { searchListArgs, selectedFileIds: [] };
    this._handleFileList(newState);
  }

  _setPerPage(per) {
    this.props.history.push({
      search: `?page=1&per=${per}`
    });
    this._handleSetPagination({ page: 1, per });
  }

  _handleSelectFile(fileId) {
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

  _clearSelectedFileIds() {
    // console.log("clearSelectedFileIds", this.state)
    this.setState({
      selectedFileIds: []
    });
  }

  _handleToggleSelectAll(paginatedList, allFilesSelected) {
    const { selectedFileIds } = this.state; 
    if(selectedFileIds.length > 0 && allFilesSelected) {
      this._clearSelectedFileIds(); 
    } else if(paginatedList) {
      let newSelectedFiles = _.cloneDeep(selectedFileIds); 
      paginatedList.map(item => newSelectedFiles.indexOf(item._id) < 0 ? newSelectedFiles.push(item._id) : null);
      this.setState({selectedFileIds: newSelectedFiles});
    } else null; 
  }

  _handleQuery(e) {
    this.setState({query: e.target.value.toLowerCase()});
  }

  _handleChangeRoleModal(roleModal, selectedFile) {
    // console.log(roleModal, selectedFile);
    const invalidateList = _.cloneDeep(this.state.invalidateList);
    if (invalidateList) {
      this._handleUpdateList();
    }
    if (selectedFile && selectedFile._id && selectedFile.filename) {
      this.setState({ roleModal, selectedFile, invalidateList: false });
    } else {
      this.setState({ roleModal, invalidateList: false });
    }
  }

  _handleSelectedFileIds(selectedFileIds) {
    this.setState({ selectedFileIds });
  }

  _handleSetInvalidList() {
    // Added fix from 1.3
    this.setState({ invalidateList: true });
  }

  _handleUpdateList() {
    const dispatch = this.props.dispatch;
    const searchListArgs = _.cloneDeep(this.state.searchListArgs) // computed from the object
    this.setState({ selectedFileIds: [] });
    dispatch(fileActions.invalidateList());
    const newState = { searchListArgs, selectedFileIds: [] };
    this._handleFileList(newState);
  }

  _handleSearch() {
    this.props.history.push({
      search: `?page=1&per=50`
    });
    const searchListArgs = _.cloneDeep(this.state.searchListArgs);
    searchListArgs.searchText = _.cloneDeep(this.state.query);
    searchListArgs.searchPageNumber = 1;
    searchListArgs.searchPerPage = 50;
    const newState = { searchListArgs, selectedFileIds: [] };
    this._handleFileList(newState);
  }

  render() {
    console.log("RENDERING")

    let {
      clientStore 
      , clientUserStore 
      , fileStore
      , firmStore
      , location 
      , loggedInUser
      , match 
      , staffStore 
      , staffClientStore 
      , tagStore
      , userStore
      , userMap
      , allFilesFromListArgs
      , folderListItems
      , fileActivityStore
    } = this.props;

    const {
      query
      , roleModal
      , selectedFileIds
      , selectedFile
      , listArgs
    } = this.state;

    const searchListArgs = routeUtils.listArgsFromObject(this.state.searchListArgs);
    const objFileActivityListItems = _.cloneDeep(this.state.objFileActivityListItems);
    

    const selectedFirm = firmStore.selected.getItem();
    console.log('get the selectedFirm', selectedFirm);
    
    const selectedClient = clientStore.byId[match.params.clientId];
    const loggedInStaff = staffStore.loggedInByFirm[selectedFirm && selectedFirm._id] ? staffStore.loggedInByFirm[selectedFirm._id].staff : null;

    const isFirmOwner = permissions.isStaffOwner(staffStore, loggedInUser, match.params.firmId); 

    // const headerTitle = selectedStaff ? `${selectedStaff.firstname} ${selectedStaff.lastname} | Personal Files` : "General Files";
    const allTags = tagStore.util.getList('~firm', match.params.firmId) || [];
    let utilFileStore = fileStore.util.getSelectedStore(...searchListArgs);
    const viewingAs = match.params.userId ? "personal" : "public";

    let sortedAndFilteredList = fileStore.util.getList(...searchListArgs);

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

    if (isEmpty && isFetching && this.current) {
      utilFileStore = this.current.utilFileStore;
      sortedAndFilteredList = this.current.sortedAndFilteredList;
    } else if (!isEmpty && !isFetching) {
      this.current = {
        utilFileStore
        , sortedAndFilteredList
      };
    }

    let options = [];
    const clientListItem = clientStore.util.getList('_firm', match.params.firmId, 'status', 'visible');
    if (!isEmpty && !isFetching && roleModal === "file_move_file") {
      options.push({ value: "public", label: "(General Files)" }); // General Location)

      const staffListItem = staffStore.util.getList("_firm", match.params.firmId);
      if (isFirmOwner && staffListItem) {
        staffListItem.map(staff => {
            if (staff.status === "active" && userMap[staff._user]) {
                const displayName = `${userMap[staff._user].firstname}${userMap[staff._user].firstname ? " " : ""}${userMap[staff._user].lastname}` || `${userMap[staff._user].username}`;
                options.push({ value: `personal${staff._user}`, label: `${displayName} | Personal files`  });
            }
        });
      } else {
        options.push({
            value: `personal${loggedInUser._id}`, label: "(Personal Files)"
        });
      }

      options = sortUtils._object(options, "label");
      if (clientListItem && options && options.length > 1) {
        let clientOptions = [];
        for (const client of clientListItem) {
            if(client && client._id) {
                if (client.status === "visible") {
                    let newObj = {
                        value: client._id
                        , label: client.name
                    }
                    clientOptions.push(newObj);
                }
            }
        }
        clientOptions = sortUtils._object(clientOptions, "label");
        options = options.concat(clientOptions);
      }
    }

    const ModalComponent = RoleModalComponent[roleModal];
    const headerTitle = match.params.clientId ? "Workspace" : match.params.userId ? "Personal" : "General";

    return (
      <WorkspaceLayout isSidebarOpen={true}>
        <Helmet><title>{`${headerTitle} Files`}</title></Helmet>
        { !this.current && isEmpty ?
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
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            {utilFileStore && utilFileStore.items && sortedAndFilteredList ? 
              <FileList
                allTags={allTags}
                viewingAs={viewingAs}
                searchListArgs={searchListArgs}
                listArgsObj={this.state.searchListArgs}
                selectedClient={selectedClient}
                selectedFirm={selectedFirm}
                loggedInStaff={loggedInStaff}
                isFirmOwner={isFirmOwner}
                // file
                // fileList={utilFileStore}
                sortedAndFilteredList={sortedAndFilteredList} // TODO: update this
                folderListItems={folderListItems}
                selectedFileIds={selectedFileIds}
                selectedTagIds={[]} // this.state.listArgs._tags || []}
                utilFileStore={utilFileStore}
                allFilesFromListArgs={allFilesFromListArgs}
                objFileActivityListItems={objFileActivityListItems}

                // checkbox
                clearSelectedFileIds={this._clearSelectedFileIds}
                handleSelectFile={this._handleSelectFile}
                handleToggleSelectAll={this._handleToggleSelectAll} // should we allow this for All Files?

                // file list control
                fileQuery={query}
                handleFilter={this._handleSetFilter}
                handleQuery={this._handleQuery}
                handleSetPagination={this._handleSetPagination}
                setPerPage={this._setPerPage}
                handleSort={this._handleSort}
                handleSearch={this._handleSearch}

                // modal
                handleOpenRequestModal={this._handleChangeRoleModal.bind(this, "file_request_file")}
                handleOpenShareModal={this._handleChangeRoleModal.bind(this, "file_share_file")}
                handleOpenUploadModal={this._handleChangeRoleModal.bind(this, "file_upload")}
                handleOpenQuickTaskModal={(file) => this._handleChangeRoleModal("file_signature", file)}
                handleOpenFolderModal={this._handleChangeRoleModal.bind(this, "file_create_folder")}
                handleOpenTemplateModal={this._handleChangeRoleModal.bind(this, "file_folder_template_apply")}
                handleOpenMoveModal={this._handleChangeRoleModal.bind(this, "file_move_file")}
                handleOpenFolderPermissionModal={(file) => this._handleChangeRoleModal("folder_permission", file)}
                handleOpenFileVersionModal={(file) => this._handleChangeRoleModal("file_version", file)}
                handleOpenDocumentTemplateModal={this._handleChangeRoleModal.bind(this, "document_template_apply")}
                handleChangeRoleModal={this._handleChangeRoleModal}
                handleUpdateList={this._handleUpdateList}
              />
            : 
            null
            }
            {
              !isEmpty && !isFetching && roleModal ?
              <ModalComponent 
                close={this._handleChangeRoleModal.bind(this, null)}
                isOpen={!!roleModal}
                match={match}
                viewingAs="workspace"

                options={options}
                clientListItem={clientListItem}

                listArgs={searchListArgs}
                type={roleModal === "file_signature" ? "signature" : roleModal}
                firmId={match.params.firmId}

                firm={selectedFirm}
                fileListArgsObj={{}}
                sortedAndFilteredList={sortedAndFilteredList}
                allFilesFromListArgs={allFilesFromListArgs}
                selectedFileIds={selectedFileIds}
                folderListItems={folderListItems}
                file={selectedFile}
                filePointers={{_client: match.params.clientId, _firm: match.params.firmId}}

                showStatusOptions={roleModal === "file_upload"}

                selectedClient={selectedClient}
                client={selectedClient}
                clientId={match.params.clientId}

                handleSelectFile={this._handleSelectFile}
                handleUploaded={this._handleUploadedFiles}
                handleUpdateSelectedFile={this._handleSelectedFileIds}
                handleSetInvalidList={this._handleSetInvalidList}
                handleUpdateList={this._handleUpdateList}
                getDetail={{ type: headerTitle && headerTitle.toLocaleLowerCase(), id: match.params.clientId || match.params.userId, firmId: match.params.firmId }}
              />
              : null
            }
            {
              !isEmpty && !isFetching ?
              <TransitionGroup>
                <CSSTransition
                  key={location.key}
                  classNames="slide-from-right"
                  timeout={300}
                >
                  <Switch location={location}>
                    <YTRoute
                      breadcrumbs={location && location.state ? location.state.breadcrumbs : [{display: 'Workspaces', path: `/firm/${match.params.firmId}/workspaces` }]}
                      exact
                      // path="/firm/:firmId/workspaces/:clientId/files/:fileId/folder/file-activity/:fileActivityId"
                      path="/firm/:firmId/files/:clientId/workspace/:folderId/folder/file-activity/:fileId"
                      staff={true}
                      component={FileActivityOverview}
                    />
                    <YTRoute
                      breadcrumbs={location && location.state ? location.state.breadcrumbs : [{display: 'Files', path: `/firm/${match.params.firmId}/files` }, {display: 'File Activity', path: null }]}
                      exact
                      path="/firm/:firmId/files/:clientId/workspace/file-activity/:fileId"
                      staff={true}
                      component={FileActivityOverview}
                    />
                    <YTRoute
                      breadcrumbs={location && location.state ? location.state.breadcrumbs : [{display: 'Workspaces', path: `/firm/${match.params.firmId}/workspaces` }, {display: 'Files', path: `/firm/${match.params.firmId}/workspaces/${match.params.clientId}/files` }, {display: "File Activity", path: null}]}
                      exact
                      path="/firm/:firmId/workspaces/:clientId/files/file-activity/:fileId"
                      staff={true}
                      component={FileActivityOverview}
                    />  
                    <YTRoute
                      breadcrumbs={location && location.state ? location.state.breadcrumbs : [{display: 'Workspaces', path: `/firm/${match.params.firmId}/workspaces` }]}
                      exact
                      path="/firm/:firmId/workspaces/:clientId/files/:folderId/folder/file-activity/:fileId"
                      staff={true}
                      component={FileActivityOverview}
                    />
                    <YTRoute
                      breadcrumbs={location && location.state ? location.state.breadcrumbs : [{display: 'Folder', path: `/firm/${match.params.firmId}/files` }, {display: 'General Files', path: `/firm/${match.params.firmId}/files/public` }, {display: "File Activity", path: null}]}
                      exact
                      path="/firm/:firmId/files/public/file-activity/:fileId"
                      staff={true}
                      component={FileActivityOverview}
                    />
                    <YTRoute
                      breadcrumbs={location && location.state ? location.state.breadcrumbs : [{display: 'Folder', path: `/firm/${match.params.firmId}/files` }, {display: 'General Files', path: `/firm/${match.params.firmId}/files/public` }, {display: "File Activity", path: null}]}
                      exact
                      path="/firm/:firmId/files/:userId/personal/file-activity/:fileId"
                      staff={true}
                      component={FileActivityOverview}
                    />
                    <YTRoute
                      breadcrumbs={location && location.state ? location.state.breadcrumbs : [{display: 'Folder', path: `/firm/${match.params.firmId}/files` }, {display: 'General Files', path: `/firm/${match.params.firmId}/files/public` }, {display: "File Activity", path: null}]}
                      exact
                      path="/firm/:firmId/files/public/:folderId/folder/file-activity/:fileId"
                      staff={true}
                      component={FileActivityOverview}
                    />
                    <YTRoute
                      breadcrumbs={location && location.state ? location.state.breadcrumbs : [{display: 'Folder', path: `/firm/${match.params.firmId}/files` }, {display: 'General Files', path: `/firm/${match.params.firmId}/files/public` }, {display: "File Activity", path: null}]}
                      exact
                      path="/firm/:firmId/files/:userId/personal/:folderId/folder/file-activity/:fileId"
                      staff={true}
                      component={FileActivityOverview}
                    />
                    <Route render={() => <div/>} />
                  </Switch>
                </CSSTransition>
              </TransitionGroup>
              : null
            }
          </div>
        }
      </WorkspaceLayout>
    )
  }
}

WorkspaceFiles.propTypes = {
  dispatch: PropTypes.func.isRequired
}

WorkspaceFiles.defaultProps = {

}

const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  
  return {
    clientStore: store.client
    , clientUserStore: store.clientUser
    , fileStore: store.file
    , firmStore: store.firm
    , loggedInUser: store.user.loggedIn.user
    , staffStore: store.staff
    , staffClientStore: store.staffClient
    , tagStore: store.tag
    , userStore: store.user
    , userMap: store.user.byId
    , allFilesFromListArgs: []
    , folderListItems: []
    , fileActivityStore: store.fileActivity
    , fileMap: store.file.byId
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(WorkspaceFiles)
);
