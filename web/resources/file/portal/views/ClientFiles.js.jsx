/**
 * View component for /admin/files
 *
 * Generic file list view. Defaults to 'all' with:
 * this.props.dispatch(fileActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { Helmet } from 'react-helmet';

// import actions
import * as activityActions from '../../../activity/activityActions';
import * as clientActions from '../../../client/clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as fileActions from '../../fileActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';
import * as userActions from '../../../user/userActions';
import * as tagActions from '../../../tag/tagActions';
import * as fileActivityActions from '../../../fileActivity/fileActivityActions'; 

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import PortalLayout from '../../../../global/portal/components/PortalLayout.js.jsx';
import routeUtils from '../../../../global/utils/routeUtils';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';
import RoleModalComponent from '../../../../global/enum/RoleModalComponent.js.jsx';
import fileUtils from '../../../../global/utils/fileUtils';

// import resource components
import PortalFileList from '../components/PortalFileList.js.jsx';
import UploadFilesModal from '../../components/UploadFilesModal.js.jsx';
import CreateFolderModal from '../../components/CreateFolderModal.js.jsx';

class ClientFiles extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      query: ''
      , fileListArgsObj: {
        '~client': props.match.params.clientId
        , status: 'portal-view'
        // , status: 'visible'
      }
      , selectedFileIds: []
      , roleModal: null
      , singleFileId: null
      , selectedFile: null
      , searchListArgs: {
        searchFirmId: props.match.params.firmId
        , searchClientId: props.match.params.clientId
        , searchFolderId: props.match.params.folderId
        , searchPageNumber: 1
        , searchPerPage: 25  
        , searchSortName: 'updated_at'
        , searchSortAsc: 'desc'
        , searchViewingAs: 'portal-view'
      }
      , invalidateList: false
    }
    this._bind(
      '_handleUploadedFiles'
      , '_handleFetch'
      , '_handleSetFilter'
      , '_handleSetPagination'
      , '_handleSelectFile'
      , '_clearSelectedFileIds'
      , '_handleToggleSelectAll'
      , '_setPerPage'
      , '_handleOpenMoveSingleFileModal'
      , '_handleFetchList'
      , '_handleSetInvalidList'
      , '_handleChangeRoleModal'
      , '_handleUpdateList'
      , '_handleSort'
    );

    this.current = null;
  }

  componentWillReceiveProps(nextProps) {
    const { dispatch } = this.props;

    if (nextProps && nextProps.match && nextProps.match.params) {
      const fileId = nextProps.match.params.folderId;
      const fileMap = nextProps.fileMap;

      if (fileId && fileMap && fileMap[fileId] && fileMap[fileId].wasAccessed !== undefined && !fileMap[fileId].wasAccessed) {
        const file = fileMap[fileId];
        file.wasAccessed = true;
        dispatch(fileActions.sendUpdateFile(file));
      }

      if (this.props.match.params.folderId != fileId || (!nextProps.location.search && nextProps.location.search != this.props.location.search)) {
        const searchListArgs = _.cloneDeep(this.state.searchListArgs);
        searchListArgs.searchFolderId = fileId || null;
        delete searchListArgs.searchFIds;
        this.setState({ searchListArgs }, () => {
          this._handleSetPagination({ page: 1, per: 50 });
        });
      }

    }
  }

  componentDidMount() {
   this._handleFetchList();
  }

  _handleFetchList() {
    const { dispatch, loggedInUser, match, location } = this.props;
    const query = new URLSearchParams(location.search);
    const page = query.get('page') || 1;
    const perPage = query.get('per') || 50;
    const fIds = query.get('fIds') || null;

    /**
     * add this to each portal view 
     */

    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then(clientRes => {
      if(clientRes.success) {
        const searchListArgs = _.cloneDeep(this.state.searchListArgs);
        searchListArgs.searchFirmId = clientRes.item._firm;
        const pagination = { page, per: perPage, searchFirmId: clientRes.item._firm }
        if (fIds) {
          pagination.searchFIds = fIds;
        }
        this._handleSetPagination(pagination);  

        dispatch(firmActions.fetchSingleIfNeeded(clientRes.item._firm));

        // fetch a list of your choice
        dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
        dispatch(clientUserActions.fetchClientUserLoggedInByClientIfNeeded(match.params.clientId));
        dispatch(fileActivityActions.fetchListIfNeeded('_client', match.params.clientId, '_user', loggedInUser._id, '_new', true));
        dispatch(staffActions.fetchListIfNeeded('_firm', clientRes.item._firm));
        dispatch(userActions.fetchListIfNeeded('_firmStaff', clientRes.item._firm));
        dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));
        dispatch(tagActions.fetchListIfNeeded('~client',  match.params.clientId));
      }
    });
  }

  _handleSort(sortBy) {
    const searchListArgs = _.cloneDeep(this.state.searchListArgs);
    if (sortBy === searchListArgs.searchSortName) {
      searchListArgs.searchSortAsc = searchListArgs.searchSortAsc === 'asc' ? 'desc' : 'asc';
    } else {
      searchListArgs.searchSortAsc = 'desc';
      searchListArgs.searchSortName = sortBy;
    }
    this.setState({ searchListArgs, selectedFileIds: [] }, () => {
      this._handleSetPagination({});
    });
  }
  // componentDidUpdate(prevProps, prevState) {
  //   const { dispatch } = prevProps;
  //   if(routeUtils.listArgsFromObject(prevState.fileListArgsObj) !== routeUtils.listArgsFromObject(this.state.fileListArgsObj)) {
  //     dispatch(fileActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(this.state.fileListArgsObj)))
  //   }
  // }

  _handleUploadedFiles(files) {
    const { dispatch, loggedInUser, match } = this.props;
    // generate a one-off activity for this file upload that isn't associated with any quickTask or shareLink.
    // dispatch(activityActions.sendCreateActivityOnClientFileUpload({files}))
    const searchListArgs = routeUtils.listArgsFromObject(this.state.searchListArgs) // computed from the object
    dispatch(fileActions.addFilesToList(files.map(f => f._id), ...searchListArgs));
    this.setState({ 
      roleModal: null
    });
  }

  _handleSetFilter(e) {
    console.log("_handleUpdateList 2")

    const { dispatch, history } = this.props;
    history.push({ search: '?page=1&per=50' });
    const searchListArgs = _.cloneDeep(this.state.searchListArgs);
    searchListArgs.searchPageNumber = 1;
    searchListArgs.searchPerPage = 50;
    searchListArgs.searchTags = e.target.value && e.target.value.join(',');
    this.setState({ searchListArgs, selectedFileIds: [] }, () => {
      this._handleFetch(searchListArgs);
    });
  }

  _handleSetPagination(pagination) {
    console.log("_handleUpdateList 3")

    const { dispatch } = this.props;
    const searchListArgs = _.cloneDeep(this.state.searchListArgs);
    searchListArgs.searchPageNumber = pagination.page || searchListArgs.searchPageNumber;
    searchListArgs.searchPerPage = pagination.per || searchListArgs.searchPerPage;
    if (pagination.searchFirmId) {
      searchListArgs.searchFirmId = pagination.searchFirmId;
    }
    if (pagination.searchFIds) {
      searchListArgs.searchFIds = pagination.searchFIds;
    }
    this.setState({ searchListArgs, selectedFileIds: [] }, () => {
      this._handleFetch(searchListArgs);
    });
  }

  _handleFetch(searchListArgs) {
    const { dispatch } = this.props;
    dispatch(fileActions.fetchListIfNeededV2(searchListArgs, ...routeUtils.listArgsFromObject(searchListArgs)));
    dispatch(fileActions.setPagination({ page: searchListArgs.searchPageNumber, per: searchListArgs.searchPerPage }, ...routeUtils.listArgsFromObject(searchListArgs)));
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
    this.setState({
      selectedFileIds: []
    })
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

  _setPerPage(per) {
    this.props.history.push({
      search: `?page=1&per=${per}`
    });
    this._handleSetPagination({ page: 1, per });
  }
  
  _handleOpenMoveSingleFileModal(fileId) {
    this.setState({ roleModal: "file_move_file", singleFileId: fileId });
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

  _handleSetInvalidList() {
    // Added fix from 1.3
    this.setState({ invalidateList: true });
  }

  _handleUpdateList() {
    console.log("_handleUpdateList 1")
    const dispatch = this.props.dispatch;
    const searchListArgs = _.cloneDeep(this.state.searchListArgs) // computed from the object
    this.setState({ selectedFileIds: [] });
    dispatch(fileActions.invalidateList());
    this._handleFetch(searchListArgs);
  }

  render() {
    const { 
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
      , fileActivityStore 
    } = this.props;

    const {
      roleModal
      , selectedFileIds
      , singleFileId
      , selectedFile
    } = this.state;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    const searchListArgs = _.cloneDeep(this.state.searchListArgs);


    // get client 
    const selectedClient = clientStore.selected.getItem();

    // get firm 
    const selectedFirm = firmStore.selected.getItem();

    const tagList = tagStore.util.getList('~client', match.params.clientId);

    // fileActivity list
    const fileActivityListItems = fileActivityStore.util.getList('_client', match.params.clientId, '_user', loggedInUser._id, '_new', true);


    // const searchListArgs = routeUtils.listArgsFromObject(searchListArgs) // computed from the object
    // const visibleFileListItems = fileStore.util.getList(...fileListArgs, 'status', 'visible');
    // // console.log('visibleFileListItems length', visibleFileListItems ? visibleFileListItems.length : 0);
    // const lockedFileListItems = fileStore.util.getList(...fileListArgs, 'status', 'locked'); 
    // console.log(lockedFileListItems);

    let utilFileStore = fileStore.util.getSelectedStore(...routeUtils.listArgsFromObject(searchListArgs));
    let fileListItems = fileStore.util.getList(...routeUtils.listArgsFromObject(searchListArgs));
    const folderListItems = fileListItems ? fileListItems.filter(file => file.category === "folder") : [];
    // console.log('fileListItems length', fileListItems ? fileListItems.length : 0);

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */

    const isEmpty = (
      // files empty? 
      !fileListItems
      || !utilFileStore
      || utilFileStore.isFetching
      // client empty?
      || !selectedClient
      || !selectedClient._id
      || clientStore.selected.didInvalidate
      // firm empty?
      || !selectedFirm
      || !selectedFirm._id
      || firmStore.selected.didInvalidate
      // || fileActivityStore.selected.didInvalidate
    );

    const isFetching = (
      !fileListItems
      || clientStore.selected.isFetching
      || !utilFileStore
      || utilFileStore.isFetching
      || firmStore.selected.isFetching
      // || fileActivityStore.selected.isFetching
    )

    if (isEmpty && isFetching && this.current) {
      utilFileStore = this.current.utilFileStore;
      fileListItems = this.current.fileListItems;
    } else if (!isEmpty && !isFetching) {
      this.current = {
        utilFileStore
        , fileListItems
      };
    }

    const ModalComponent = RoleModalComponent[roleModal];
    
    return (
      <PortalLayout>
        <Helmet><title>My Files</title></Helmet>
        <h1>My Files</h1>
        <hr/>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { !this.current && isEmpty ?
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
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <PortalFileList
              allTags={tagList}
              clearSelectedFileIds={this._clearSelectedFileIds}
              utilFileStore={utilFileStore}
              handleFilter={this._handleSetFilter}
              handleQuery={() => console.log('handle queery')}
              handleSetPagination={this._handleSetPagination}
              handleSort={this._handleSort}
              handleToggleSelectAll={this._handleToggleSelectAll}
              handleSelectFile={this._handleSelectFile}
              selectedFileIds={selectedFileIds}
              selectedTagIds={searchListArgs._tags || []}
              sortedAndFilteredList={fileListItems} // TODO: update this 
              fileActivityListItems={fileActivityListItems}
              selectedClient={selectedClient}
              selectedFirm={selectedFirm}
              setPerPage={this._setPerPage}
              fileListArgs={searchListArgs}
              fileListItems={fileListItems}
              handleOpenMoveSingleFileModal={this._handleOpenMoveSingleFileModal}
              // sortedAndFilteredList={fileListItems} // TODO: update this 

              handleOpenUploadModal={this._handleChangeRoleModal.bind(this, "file_upload")}
              handleOpenCreateFolderModal={this._handleChangeRoleModal.bind(this, "file_create_folder")}
              handleOpenMoveFileModal={this._handleChangeRoleModal.bind(this, "file_move_file")}
              handleOpenFileVersionModal={this._handleChangeRoleModal.bind(this, "file_version")}
              handleUpdateList={this._handleUpdateList}
              handleSetInvalidList={this._handleSetInvalidList}
              roleModal={roleModal}
            />

              {/* isOpen={showFileVersionList}
              file={selectedFile}
              close={() => this.setState({ showFileVersionList: !showFileVersionList })}
              allFilesFromListArgs={selectedFile.olderVersions}
              firm={selectedFirm} */}

            <ModalComponent
              // close={() => this.setState({ roleModal: null, selectedFile: null })}
              close={this._handleChangeRoleModal.bind(this, null)}
              handleUploaded={this._handleUploadedFiles}
              handleUpdateList={this._handleUpdateList}
              handleSetInvalidList={this._handleSetInvalidList}
              isOpen={!!roleModal}
              filePointers={{'_client': match.params.clientId, '_firm': selectedFirm._id, 'status': 'visible'}}
              showVisibilityOption={false}
              // fromPortal={true}
              folderListItems={folderListItems}
              selectedClient={selectedClient}
              viewingAs="portal"
              showStatusOptions={false}
              selectedFirm={selectedFirm}
              listArgs={searchListArgs}
              selectedFileIds={selectedFileIds && selectedFileIds.length ? selectedFileIds : roleModal === "file_move_file" && singleFileId ? [singleFileId] : []}
              options={[]}
              file={selectedFile}
              allFilesFromListArgs={fileListItems}
              firm={selectedFirm}
              getDetail={{ type: "workspace", id: selectedClient && selectedClient._id, name: selectedClient && selectedClient.name, firmId: selectedClient && selectedClient._firm }}
            />
          </div>
        }
      </PortalLayout>
    )
  }
}

ClientFiles.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    clientStore: store.client 
    , clientUserStore: store.clientUser 
    , fileStore: store.file
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , staffStore: store.staff
    , staffClientStore: store.staffClient
    , tagStore: store.tag
    , fileActivityStore: store.fileActivity
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientFiles)
);
