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

// import actions
import * as activityActions from '../../activity/activityActions';
import * as clientActions from '../../client/clientActions';
import * as clientUserActions from '../../clientUser/clientUserActions';
import * as fileActions from '../../file/fileActions';
import * as firmActions from '../../firm/firmActions';
import * as staffActions from '../../staff/staffActions';
import * as staffClientActions from '../../staffClient/staffClientActions';
import * as userActions from '../../user/userActions';
import * as tagActions from '../../tag/tagActions';
import * as clientWorkflowActions from '../../clientWorkflow/clientWorkflowActions';
import * as folderActions from '../folderActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import routeUtils from '../../../global/utils/routeUtils';

// import resource components
import FolderList from './FolderList.js.jsx';
import CreateFolderModal from '../components/CreateFolderModal.js.jsx';
import UploadFilesModal from '../../file/components/UploadFilesModal.js.jsx';
import WorkspaceLayout from '../../client/practice/components/WorkspaceLayout.js.jsx';
import ShareMultipleFilesModal from '../../shareLink/practice/components/ShareMultipleFilesModal.js.jsx';
import ShareRequestFilesModal from '../../shareLink/practice/components/ShareRequestFilesModal.js.jsx';
import CreateQuickTaskModal from '../../quickTask/practice/components/CreateQuickTaskModal.js.jsx';

class WorkspaceFiles extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      page: 1
      , per: 50
      , isUploadFilesModalOpen: false 
      , query: ''
      , fileListArgsObj: {
        '~client': props.match.params.clientId
      }
      , requestFilesModalOpen: false
      , selectedFileIds: []
      , shareFilesModalOpen: false 
      , viewingAs: 'grid'
      , createQuickTaskModalOpen: false
      , fileForSignature: null
      , isCreateFolderModalOpen: false
      // , fileListArgs: ['_client', props.match.params.clientId]
      , folderListArgsObj: {
        '_client': props.match.params.clientId
      }
    }
    this._bind(
      '_handleUploadedFiles'
      , '_handleSelectFile'
      , '_handleToggleSelectAll'
      , '_handleSetFilter'
      , '_handleSetPagination'
      , '_setPerPage'
      , '_clearSelectedFileIds'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal
    // necessary for the move file action. If you reload this view without this fetch it will crash.
    dispatch(clientActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
    dispatch(clientUserActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));

    const fileListArgs = routeUtils.listArgsFromObject(this.state.fileListArgsObj) // computed from the object
    const folderListArgs = routeUtils.listArgsFromObject(this.state.folderListArgsObj) // computed from the object
    dispatch(fileActions.fetchListIfNeeded('~client', match.params.clientId));  
    dispatch(fileActions.setFilter({query: '', sortBy: '-date'}, "~client", match.params.clientId));
    dispatch(folderActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(folderActions.setFilter({query: '', sortBy: '-date'}, "~client", match.params.clientId));
    this._handleSetPagination({page: 1, per: 50});

    // dispatch(fileActions.fetchListIfNeeded('_client', this.props.match.params.clientId, 'visibleToClient', false));  
    
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    // dispatch(staffClientActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(tagActions.fetchListIfNeeded('~firm', match.params.firmId));
    dispatch(clientWorkflowActions.fetchListIfNeeded('_client', match.params.clientId));

    dispatch(staffClientActions.fetchListIfNeeded('_firm', match.params.firmId, '_user', loggedInUser._id, '~staff.status', 'active')); 
  }

  componentDidUpdate(prevProps, prevState) {
    // catch for state change and re-fetch file list if it happens
    // compare computed listArgs object
    if(routeUtils.listArgsFromObject(prevState.fileListArgsObj) !== routeUtils.listArgsFromObject(this.state.fileListArgsObj)) {
      this.props.dispatch(fileActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(this.state.fileListArgsObj)))
    }

    if(routeUtils.listArgsFromObject(prevState.folderListArgsObj) !== routeUtils.listArgsFromObject(this.state.folderListArgsObj)) {
      this.props.dispatch(folderActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(this.state.folderListArgsObj)))
    }
  }

  _handleUploadedFiles(files) {
    // Added fix from 1.3
    const { dispatch, loggedInUser, match } = this.props;
    // generate a one-off activity for this file upload that isn't associated with any quickTask or shareLink.
    // dispatch(activityActions.sendCreateActivityOnStaffFileUpload({files}))
    const fileListArgs = routeUtils.listArgsFromObject(this.state.fileListArgsObj) // computed from the object
    dispatch(fileActions.invalidateList(...fileListArgs));

    dispatch(fileActions.fetchListIfNeeded(...fileListArgs))
    
    this.setState({fileListArgsObj: {'~client': match.params.clientId}}) // reset the filters
    this.setState({isUploadFilesModalOpen: false});


  }

  _handleSetFilter(e) {
    let nextFileListArgsObj = { ...this.state.fileListArgsObj }
    nextFileListArgsObj[e.target.name] = e.target.value;

    // console.log("next obj: ", nextFileListArgsObj)
    // console.log(routeUtils.listArgsFromObject(nextFileListArgsObj))
    this.setState({ fileListArgsObj: nextFileListArgsObj }
    , () => this._handleSetPagination({page: 1, per: this.state.per})
    )
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    const fileListArgs = routeUtils.listArgsFromObject(this.state.fileListArgsObj);
    dispatch(fileActions.setPagination(newPagination, ...fileListArgs));
  }

  _setPerPage(per) {
    var newPagination = {}
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination)
    this.setState({per: per});
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

  render() {
    // console.log("RENDERING")
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
      , userStore 
      , folderStore
    } = this.props;
    
    const fileListArgs = routeUtils.listArgsFromObject(this.state.fileListArgsObj) // computed from the object
    const folderListArgs = routeUtils.listArgsFromObject(this.state.folderListArgsObj) // computed from the object

    // client & firm 
    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();

    // clientUsers(contacts) list 
    const clientUserList = clientUserStore.lists && clientUserStore.lists._client ? clientUserStore.lists._client[match.params.clientId] : null;
    const clientUserListItems = clientUserStore.util.getList('_client', match.params.clientId);

    // staffClient  list 
    // const staffClientList = staffClientStore.lists && staffClientStore.lists._client ? staffClientStore.lists._client[match.params.clientId] : null;
    // const staffClientListItems = staffClientStore.util.getList('_client', match.params.clientId);

    const allTags = tagStore.util.getList('~firm', match.params.firmId) || []

    // activity  list
    // const fileListItems = fileStore.util.getList('_client', this.props.match.params.clientId, 'visibleToClient', true);
    // ^ hard coding this breaks the tag filtering on the lists. this is a good candidate to be filtered on the front end rather than the server side

    // totalListInfo is the original fetched list. We'll use it to keep track of total item quantity.
    const totalListInfo = fileStore.lists && fileStore.lists._client ? fileStore.lists._client[match.params.clientId] : null;
    const fileListItems = fileStore.util.getList(...fileListArgs);

    // console.log("filelistitems", fileListItems)
    // TODO: this is a good way to do this arbitrarily going forward. if fileListItems isn't null, then we know the list is at least defined
    const fileList = fileListItems ? fileListArgs.reduce((obj, nextKey) => obj[nextKey], fileStore.lists) : null
    // const fileList = fileStore.lists && fileStore.lists._client ? fileStore.lists._client[match.params.clientId] : null;


    // totalListInfo is the original fetched list.
    const folderListInfo = folderStore.lists && folderStore.lists._client ? folderStore.lists._client[match.params.clientId] : null;
    const folderListItems = folderStore.util.getList(...folderListArgs);
    const folderList = folderListItems ? folderListArgs.reduce((obj, nextKey) => obj[nextKey], folderStore.lists) : null;

    const isEmpty = (
      clientStore.selected.didInvalidate
      || !fileListItems
      || !fileList
      || firmStore.selected.didInvalidate
      || !selectedClient
      || !selectedClient._id
      || !selectedFirm
      || !selectedFirm._id
      || folderStore.selected.didInvalidate
      || !folderList
      || !folderListItems
    );

    const isFetching = (
      !fileListItems
      || !fileList
      || fileList.isFetching
      || clientStore.selected.isFetching
      || !clientUserListItems
      || !clientUserList
      || clientUserList.isFetching
      || firmStore.selected.isFetching
      || folderStore.selected.isFetching
      || !folderList
      || !folderListItems
      // || !staffClientListItems
      // || !staffClientList
      // || staffClientList.isFetching
    )

    return (
      <WorkspaceLayout>
        <Helmet><title>Workspace Files</title></Helmet>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>
            : 
            <h2>Empty.</h2>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            {fileList && fileListItems && folderList && folderListItems ? 
              <FolderList
                allTags={allTags}
                clearSelectedFileIds={this._clearSelectedFileIds}
                fileList={fileList}
                handleFilter={this._handleSetFilter}
                handleOpenRequestModal={() => this.setState({requestFilesModalOpen: true})}
                handleOpenQuickTaskModal={file => this.setState({createQuickTaskModalOpen: true, fileForSignature: file})}
                handleOpenShareModal={() => this.setState({shareFilesModalOpen: true})}
                handleOpenUploadModal={() => this.setState({isUploadFilesModalOpen: true})}
                handleToggleSelectAll={this._handleToggleSelectAll}
                handleQuery={() => console.log('handle queery')}
                handleSetPagination={this._handleSetPagination}
                handleSelectFile={this._handleSelectFile}
                handleSort={() => console.log('handle sort')}
                selectedFileIds={this.state.selectedFileIds}
                selectedTagIds={this.state.fileListArgsObj._tags || []}
                setPerPage={this._setPerPage}
                // sortedAndFilteredList={fileListItems.sort((a,b) => a.created_at < b.created_at ? -1 : 1).filter((file => file && file.status && file.status != 'archived')).filter((file => file && file.status && file.status != 'deleted'))} // TODO: update this 
                sortedAndFilteredList={folderListItems.sort((a,b) => a.created_at < b.created_at ? -1 : 1).filter((folder => folder && folder.status && folder.status === "visible"))} // TODO: update this 
                totalListInfo={totalListInfo}
                viewingAs="workspace"
                fileListArgs={fileListArgs}
                handleOpenCreateFolderModal={() => this.setState({ isCreateFolderModalOpen: true })}
                folderList={folderList}
                folderListInfo={folderListInfo}
              />
            : null
            }
            { !isEmpty && !isFetching ?
              <div>
                <UploadFilesModal
                  close={() => this.setState({isUploadFilesModalOpen: false})}
                  handleUploaded={this._handleUploadedFiles}
                  isOpen={this.state.isUploadFilesModalOpen}
                  filePointers={{_client: match.params.clientId, _firm: match.params.firmId}}
                  showStatusOptions={true}
                  viewingAs="workspace"
                  firm={selectedFirm}
                />
                <CreateFolderModal
                  close={() => this.setState({isCreateFolderModalOpen: false})}
                  handleUploaded={this._handleUploadedFiles}
                  isOpen={this.state.isCreateFolderModalOpen}
                  filePointers={{_client: match.params.clientId, _firm: match.params.firmId}}
                  showStatusOptions={true}
                  selectedFirm={selectedFirm}
                />                
                <ShareMultipleFilesModal
                  client={selectedClient}
                  close={() => this.setState({shareFilesModalOpen: false})}
                  fileListArgsObj={this.state.fileListArgsObj}
                  firm={selectedFirm}
                  handleSelectFile={this._handleSelectFile}
                  isOpen={this.state.shareFilesModalOpen}
                  selectedFileIds={this.state.selectedFileIds}
                />
                <ShareRequestFilesModal
                  client={selectedClient}
                  close={() => this.setState({requestFilesModalOpen: false})}
                  firm={selectedFirm}
                  isOpen={this.state.requestFilesModalOpen}
                />
                <CreateQuickTaskModal
                  clientId={match.params.clientId}
                  close={() => this.setState({createQuickTaskModalOpen: false, fileForSignature: null})}
                  file={this.state.fileForSignature}
                  firmId={match.params.firmId}
                  isOpen={this.state.createQuickTaskModalOpen && !!this.state.fileForSignature}
                  type={'signature'}
                  firm={selectedFirm}
                />
              </div>
              :
              null
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

const mapStoreToProps = (store) => {
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
    , folderStore: store.folder
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(WorkspaceFiles)
);
