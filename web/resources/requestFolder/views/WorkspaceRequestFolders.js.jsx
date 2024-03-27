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
import * as requestFolderActions from '../requestFolderActions';
import * as firmActions from '../../firm/firmActions';
import * as staffActions from '../../staff/staffActions';
import * as staffClientActions from '../../staffClient/staffClientActions';

// import components
import RequestFolderList from '../components/RequestFolderList.js.jsx';
import RequestFolderForm from '../components/RequestFolderForm.js.jsx';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import routeUtils from '../../../global/utils/routeUtils';

// import resource components
import WorkspaceLayout from '../../client/practice/components/WorkspaceLayout.js.jsx';

class WorkspaceRequestFolders extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      listArgs: props.match.params.clientId ? {"_client": props.match.params.clientId} : {"_personal": props.match.params.staffId}
      , selectedRequestsFolderIds: []
      , requestFolderShowModal: false
    }
    this._bind(
      '_handleToggleSelectAll'
      , '_handleSetPagination'
      , '_handleSelectRequest'
      , '_setPerPage'
      , '_handleUpdateRequest'
    )
  }

  componentDidMount() {
    const { dispatch, match, loggedInUser } = this.props;


    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(requestFolderActions.fetchListIfNeeded(...listArgs));
    dispatch(userActions.fetchListIfNeeded(...listArgs));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));

    // // to set pagination
    dispatch(requestFolderActions.setFilter({query: '', sortBy: '-date'}, ...listArgs));
    this._handleSetPagination({ page: 1, per: 50 });
  }
  
  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);
    dispatch(requestFolderActions.setPagination(newPagination, ...listArgs));
  }

  _setPerPage(per) {
    console.log("per", per)
    var newPagination = {}
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination)
    this.setState({per: per});
  }

  _handleSelectRequest(requestId) {
    // const selectedRequestIds = _.cloneDeep(this.state.selectedRequestIds);
    // if (selectedRequestIds.includes(requestId)) {
    //   selectedRequestIds.splice(selectedRequestIds.indexOf(requestId), 1);
    // } else {
    //   selectedRequestIds.push(requestId)
    // }
    // this.setState({ selectedRequestIds });
  }

  _handleToggleSelectAll() {

  }

  _handleUpdateRequest(request) {
    console.log("updateme", request);
    this.setState({ selectedRequest: request, requestListShowModal: true });
  }

  render() {
    const {
      requestFolderStore
      , clientStore
      , userStore
      , userMap
    } = this.props;

    const {
      selectedRequestsFolderIds
      , requestFolderShowModal
    } = this.state;

    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);
    const requestFolderListItem = requestFolderStore.util.getList(...listArgs);
    const requestFolderList = requestFolderListItem ? listArgs.reduce((obj, nextKey) => obj[nextKey], requestFolderStore.lists) : null;

    const selectedClient = clientStore.selected.getItem();
    // const selectedUsers = userStore.util.getList(...listArgs);

    const isEmpty = (
      requestFolderStore.selected.didInvalidate
      || !requestFolderListItem
      || clientStore.selected.didInvalidate
      || userStore.selected.didInvalidate
      || !userMap
    );

    const isFetching = (
      requestFolderStore.selected.isFetching
      || !requestFolderListItem
      || clientStore.selected.isFetching
      || userStore.selected.isFetching
      || !userMap
    )

    console.log("requestFolderList", requestFolderStore, requestFolderList, requestFolderListItem)
    
    return (
      <WorkspaceLayout>
        <Helmet><title>Workspace Shared Folders</title></Helmet>
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
            <RequestFolderList
              requestFolderListItem={requestFolderListItem}
              requestFolderList={requestFolderList}
              sortedAndFilteredList={requestFolderListItem}
              listArgs={listArgs}
              selectedRequestsFolderIds={selectedRequestsFolderIds}
              userMap={userMap}
              handleRequestFolderShowModal={() => this.setState({ requestFolderShowModal: true })}
              handleSetPagination={this._handleSetPagination}
              setPerPage={this._setPerPage}
              // handleRequestListShowModal={() => this.setState({ requestListShowModal: true, selectedRequest: {} })}
              // handleToggleSelectAll={this._handleToggleSelectAll}
              // handleSelectRequest={this._handleSelectRequest}
              // selectedRequestIds={selectedRequestIds}
              // clearSelectedRequestIds={() => this.setState({ selectedRequestIds: [] })}
              // handleSetPagination={this._handleSetPagination}
              // setPerPage={this._setPerPage}
              // userMap={userMap}
              // handleUpdateRequest={this._handleUpdateRequest}
            />
          </div>
        }
        <div>
          <RequestFolderForm
            isOpen={requestFolderShowModal}
            handleClose={() => this.setState({ requestFolderShowModal: false })}
            selectedClient={selectedClient}
            listArgs={listArgs}
          />
        </div>
      </WorkspaceLayout>
    )
  }
}

WorkspaceRequestFolders.propTypes = {
  dispatch: PropTypes.func.isRequired
}

WorkspaceRequestFolders.defaultProps = {

}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    loggedInUser: store.user.loggedIn.user
    , requestFolderStore: store.requestFolder
    , clientStore: store.client
    , userStore: store.user
    , userMap: store.user.byId
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(WorkspaceRequestFolders)
);
