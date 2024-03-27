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

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import { permissions, routeUtils } from '../../../../global/utils';
import sortUtils from '../../../../global/utils/sortUtils';
import fileUtils from '../../../../global/utils/fileUtils';

// import resource components
import FileList from '../../components/FileList.js.jsx';
import WorkspaceLayout from '../../../client/practice/components/WorkspaceLayout.js.jsx';
import FileActivityOverview from '../../../fileActivity/views/FileActivityOverview.js.jsx';
import ArchivedFileList from '../../components/ArchivedFileList.js.jsx';

import RoleModalComponent from '../../../../global/enum/RoleModalComponent.js.jsx';

class ArchivedFiles extends Binder {
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
        , searchViewingAs: 'workspace-archived-view'
      }
      , tagsFilter: null
      , fileActivityArgs: {
        _firm:  props.match.params.firmId
        , _client: props.match.params.clientId || 'null'
        , _user: props.loggedInUser._id
        , _new: true
      }
      , invalidateList: false
    }
    this._bind(
      '_handleSelectFile'
      , '_handleToggleSelectAll'
      , '_handleSetFilter'
      , '_handleSetPagination'
      , '_setPerPage'
      , '_clearSelectedFileIds'
      , '_handleQuery'
      , '_handleFetchList'
      , '_handleSort'
      , '_handleUpdateList'
    );

    this.current = null;
  }

  componentDidMount() {
    this._handleFetchList();
  }

  componentWillReceiveProps(nextProps) {
    const { dispatch, match } = this.props;

    if (nextProps && nextProps.match && nextProps.match.params) {

      const fileId = nextProps.match.params.folderId;
      const fileMap = nextProps.fileMap;

      if (fileId && fileMap && fileMap[fileId] && fileMap[fileId].wasAccessed !== undefined && !fileMap[fileId].wasAccessed) {
        const file = fileMap[fileId];
        file.wasAccessed = true;
        dispatch(fileActions.sendUpdateFile(file));
      }

      if (this.props.match.params.folderId != fileId) {
        const searchListArgs = this.state.searchListArgs;
        searchListArgs.searchFolderId = fileId || null;
        delete searchListArgs.searchFIds;
        this.setState({ searchListArgs }, () => {
          this._handleSetPagination({ page: 1, per: 50 });
        });
      }
    }

    if (nextProps && nextProps.match && nextProps.match.params && nextProps.match.params.folderId != match.params.folderId) {
      this.setState({ selectedFileIds: [] });
    }
  }

  _handleFetchList() {
    const { dispatch, loggedInUser, match, location } = this.props;
    const query = new URLSearchParams(location.search);
    const page = query.get('page') || 1;
    const perPage = query.get('per') || 50;
    const fIds = query.get('fIds') || null;

    if (fIds) {
      const searchListArgs = _.cloneDeep(this.state.searchListArgs);
      searchListArgs.searchFIds = fIds;
      this.setState({ searchListArgs }, () => {
        this._handleSetPagination({ page, per: perPage });
      });
    } else {
      this._handleSetPagination({ page, per: perPage });
    }

    if (match.params.clientId) {
      dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));
    }
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
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

  _handleSetFilter(e) {
    const { dispatch, history } = this.props;
    history.push({ search: '?page=1&per=50' });
    let tagsFilter = _.cloneDeep(this.state.tagsFilter);
    const searchListArgs = _.cloneDeep(this.state.searchListArgs);
    tagsFilter = e.target.value;
    searchListArgs.searchPageNumber = 1;
    searchListArgs.searchPerPage = 50;
    searchListArgs.searchTags = e.target.value && e.target.value.join(',')
    this.setState({ tagsFilter, searchListArgs, selectedFileIds: [] }, () => {
      dispatch(fileActions.fetchListIfNeededV2(searchListArgs, ...routeUtils.listArgsFromObject(searchListArgs)));
      dispatch(fileActions.setPagination({ page: searchListArgs.searchPageNumber, per: searchListArgs.searchPerPage }, ...routeUtils.listArgsFromObject(searchListArgs)));
    });
  }

  _handleSetPagination(pagination) {
    console.log("eyyy 1", pagination)
    const { dispatch } = this.props;
    const searchListArgs = _.cloneDeep(this.state.searchListArgs);
    searchListArgs.searchPageNumber = pagination.page || searchListArgs.searchPageNumber;
    searchListArgs.searchPerPage = pagination.per || searchListArgs.searchPerPage;
    this.setState({ searchListArgs, selectedFileIds: [] }, () => {
      dispatch(fileActions.fetchListIfNeededV2(searchListArgs, ...routeUtils.listArgsFromObject(searchListArgs)));
      dispatch(fileActions.setPagination({ page: searchListArgs.searchPageNumber, per: searchListArgs.searchPerPage }, ...routeUtils.listArgsFromObject(searchListArgs)));
    });
  }

  _handleSort(sortBy) {
    console.log('sortBy', sortBy)
    const { dispatch } = this.props;
    const searchListArgs = _.cloneDeep(this.state.searchListArgs);
    if (sortBy === searchListArgs.searchSortName) {
      searchListArgs.searchSortAsc = !(searchListArgs.searchSortAsc === 'asc' ? 'desc' : 'asc');
    } else {
      searchListArgs.searchSortAsc = 'desc';
      searchListArgs.searchSortName = sortBy;
    }
    this.setState({ searchListArgs, selectedFileIds: [] }, () => {
      dispatch(fileActions.fetchListIfNeededV2(searchListArgs, ...routeUtils.listArgsFromObject(searchListArgs)));
      dispatch(fileActions.setPagination({ page: searchListArgs.searchPageNumber, per: searchListArgs.searchPerPage }, ...routeUtils.listArgsFromObject(searchListArgs)));
    });
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
    const { dispatch } = this.props;
    const searchListArgs = _.cloneDeep(this.state.searchListArgs);

    // always defaulting the page to page 1 so we can see our results
    searchListArgs.searchPageNumber = 1;
    this._handleSetPagination(searchListArgs);
    // continue query logic
    dispatch(fileActions.setQuery(e.target.value.toLowerCase(), ...routeUtils.listArgsFromObject(searchListArgs)));
    this.setState({query: e.target.value.toLowerCase()});
  }

  _handleUpdateList() {
    const dispatch = this.props.dispatch;
    const searchListArgs = _.cloneDeep(this.state.searchListArgs) // computed from the object
    this.setState({ selectedFileIds: [] });
    dispatch(fileActions.invalidateList());
    dispatch(fileActions.fetchListIfNeededV2(searchListArgs, ...routeUtils.listArgsFromObject(searchListArgs)))
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
      , tagsFilter
      , listArgs
    } = this.state;

    const searchListArgs = routeUtils.listArgsFromObject(this.state.searchListArgs);
    

    const selectedFirm = firmStore.selected.getItem();
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
      // || firmStore.selected.didInvalidate
      // || !selectedFirm
      // || !selectedFirm._id
      // || userStore.selected.didInvalidate
      || !sortedAndFilteredList
      // || fileActivityStore.selected.didInvalidate
      // || !fileActivityListItems
      || utilFileStore.isFetching
      // || !fileActivityListItems
    );

    console.log('testtt', !utilFileStore, !sortedAndFilteredList, utilFileStore.isFetching)

    const isFetching = (
      !utilFileStore
      || utilFileStore.isFetching
      // || firmStore.selected.isFetching
      // || userStore.selected.isFetching
      || !sortedAndFilteredList
      // || fileActivityStore.selected.isFetching
      // || !fileActivityListItems
    );

    console.log('isEyyy', isEmpty, isFetching)

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

    return (
      <WorkspaceLayout isSidebarOpen={true}>
        <Helmet><title>Archived Files List</title></Helmet>
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
              <ArchivedFileList
                clearSelectedFileIds={this._clearSelectedFileIds}
                allTags={allTags}
                utilFileStore={utilFileStore}
                handleFilter={this._handleSetFilter}
                handleQuery={() => console.log('handle queery')}
                handleSetPagination={this._handleSetPagination}
                handleSelectFile={this._handleSelectFile}
                handleSort={this._handleSort}
                selectedFileIds={this.state.selectedFileIds}
                selectedTagIds={this.state.listArgs._tags || []}
                setPerPage={this._setPerPage}
                sortedAndFilteredList={sortedAndFilteredList}
                viewingAs="general"
                listArgs={listArgs}
                listArgsObj={this.state.listArgs}
                handleToggleSelectAll={this._handleToggleSelectAll}
                handleUpdateList={this._handleUpdateList}
              />
            : 
            null
            }
          </div>
        }
      </WorkspaceLayout>
    )
  }
}

ArchivedFiles.propTypes = {
  dispatch: PropTypes.func.isRequired
}

ArchivedFiles.defaultProps = {

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
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(ArchivedFiles)
);
