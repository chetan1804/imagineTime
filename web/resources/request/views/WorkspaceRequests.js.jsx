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
import * as clientActions from '../../client/clientActions';
import * as userActions from '../../user/userActions';
import * as requestActions from '../requestActions';
import * as staffActions from '../../staff/staffActions';

// import components
import RequestList from '../components/RequestList.js.jsx';

// import global components
import RoleModalComponent from '../../../global/enum/RoleModalComponent.js.jsx';
import Binder from '../../../global/components/Binder.js.jsx';
import routeUtils from '../../../global/utils/routeUtils';

// import resource components
import WorkspaceLayout from '../../client/practice/components/WorkspaceLayout.js.jsx';
import PracticeFirmLayout from '../../firm/practice/components/PracticeFirmLayout.js.jsx';

class WorkspaceRequests extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      listArgs: props.match.params.clientId ? {"_client": props.match.params.clientId } : {"_firm": props.match.params.firmId }
      , selectedRequestIds: []
      , selectedRequest: {}
      , roleModal: null
    }
    this._bind(
      '_handleToggleSelectAll'
      , '_handleSetPagination'
      , '_handleSelectRequest'
      , '_setPerPage'
      , '_handleUpdateRequest'
      , '_clearSelectedRequestIds'
    )
  }

  componentDidMount() {
    const { dispatch, match, loggedInUser } = this.props;


    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);
    // const listArgsClient = routeUtils.listArgsFromObject({"_client": match.params.clientId});
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(requestActions.fetchListIfNeeded(...listArgs));
    // dispatch(requestFolderActions.fetchSingleIfNeeded(match.params.requestFolderId)); 
    dispatch(userActions.fetchListIfNeeded(...listArgs));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));

    // to set pagination
    dispatch(requestActions.setFilter({query: '', sortBy: '-date'}, ...listArgs));
    this._handleSetPagination({ page: 1, per: 50 });
    
  }
  
  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);
    dispatch(requestActions.setPagination(newPagination, ...listArgs));
  }

  _setPerPage(per) {
    var newPagination = {}
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination)
    this.setState({per: per});
  }

  _handleSelectRequest(requestId) {
    const selectedRequestIds = _.cloneDeep(this.state.selectedRequestIds);
    if (selectedRequestIds.includes(requestId)) {
      selectedRequestIds.splice(selectedRequestIds.indexOf(requestId), 1);
    } else {
      selectedRequestIds.push(requestId)
    }
    this.setState({ selectedRequestIds });
  }

  _clearSelectedRequestIds() {
    this.setState({
      selectedRequestIds: []
    });
  }

  _handleToggleSelectAll(paginatedList, allRequestIdsSelected) {
    const { selectedRequestIds } = this.state; 
    if(selectedRequestIds.length > 0 && allRequestIdsSelected) {
      this._clearSelectedRequestIds(); 
    } else if(paginatedList) {
      let newSelectedFiles = _.cloneDeep(selectedRequestIds); 
      paginatedList.map(item => newSelectedFiles.indexOf(item._id) < 0 ? newSelectedFiles.push(item._id) : null);
      this.setState({selectedRequestIds: newSelectedFiles});
    } else null; 
  }

  _handleUpdateRequest(request) {
    console.log("updateme", request);
    this.setState({ selectedRequest: request, roleModal: "request_list" });
  }

  render() {
    const { 
      requestStore 
      , match
      , clientStore
      , userStore
      , userMap
      , requestFolderStore
    } = this.props;

    const {
      selectedRequestIds
      , selectedRequest
      , roleModal
    } = this.state;

    const listArgsClient = routeUtils.listArgsFromObject({"_client": match.params.clientId});
    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);
    const requestListItem = requestStore.util.getList(...listArgs);
    const requestList = requestListItem ? listArgs.reduce((obj, nextKey) => obj[nextKey], requestStore.lists) : null;

    const selectedClient = clientStore.selected.getItem();
    const selectedUsers = userStore.util.getList(...listArgsClient);

    const isEmpty = (
      requestStore.selected.didInvalidate
      || clientStore.selected.didInvalidate
      || userStore.selected.didInvalidate
      || requestFolderStore.selected.didInvalidate
      || !requestListItem
      || !userMap
    );

    const isFetching = (
      requestStore.selected.isFetching
      || clientStore.selected.isFetching
      || requestFolderStore.selected.isFetching
      || userStore.selected.isFetching
      || !requestListItem
      || !userMap
    );

    const ModalComponent = RoleModalComponent[roleModal];
    const ComponentLayout = match.params.clientId ? WorkspaceLayout : PracticeFirmLayout;
    
    return (
      <ComponentLayout>
        <Helmet><title>Workspace Request Lists</title></Helmet>
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
            <RequestList
              requestListItem={requestListItem}
              handleRequestListShowModal={() => this.setState({ roleModal: "request_list", selectedRequest: {} })}
              handleToggleSelectAll={this._handleToggleSelectAll}
              requestList={requestList}
              sortedAndFilteredList={requestListItem}
              listArgs={listArgs}
              handleSelectRequest={this._handleSelectRequest}
              selectedRequestIds={selectedRequestIds}
              clearSelectedRequestIds={this._clearSelectedRequestIds}
              handleSetPagination={this._handleSetPagination}
              setPerPage={this._setPerPage}
              userMap={userMap}
              handleUpdateRequest={this._handleUpdateRequest}
            />
            <ModalComponent 
              isOpen={!!roleModal}
              close={() => this.setState({ roleModal: null, selectedRequest: {} })}
              selectedClient={match.params.clientId && selectedClient || {}}
              selectedUsers={selectedUsers}
              listArgs={listArgs}
              selectedRequest={selectedRequest}
            />
          </div>
        }
      </ComponentLayout>
    )
  }
}

WorkspaceRequests.propTypes = {
  dispatch: PropTypes.func.isRequired
}

WorkspaceRequests.defaultProps = {

}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    loggedInUser: store.user.loggedIn.user
    , requestStore: store.request
    , clientStore: store.client
    , userStore: store.user
    , userMap: store.user.byId
    , requestFolderStore: store.requestFolder
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(WorkspaceRequests)
);
