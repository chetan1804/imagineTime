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
import * as clientActions from '../../../client/clientActions';
import * as userActions from '../../../user/userActions';
import * as requestActions from '../../requestFolderActions';
import * as firmActions from '../../../firm/firmActions';

// import components
import PortalRequestList from '../components/PortalRequestList.js.jsx';
import RequestListForm from '../../components/RequestFolderForm.js.jsx';
import RequestList from '../../components/RequestFolderList.js.jsx';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import routeUtils from '../../../../global/utils/routeUtils';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import WorkspaceLayout from '../../../client/practice/components/WorkspaceLayout.js.jsx';
import PortalLayout from '../../../../global/portal/components/PortalLayout.js.jsx';

class PortalRequest extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      listArgs: props.match.params.clientId ? {"_client": props.match.params.clientId} : {"_personal": props.match.params.staffId}
      , requestListShowModal: false
      , selectedRequestIds: []
      , selectedRequest: {}
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

    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs) 
    dispatch(requestActions.fetchListPortal(match.params.clientId, ...listArgs)).then(json => console.log("fetchListPortal", json));
    dispatch(userActions.fetchListIfNeeded(...listArgs));
    if (match.params.firmId) {
      dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
    }
    dispatch(userActions.fetchListIfNeeded('_clientStaff', match.params.clientId));
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then(clientRes => {
      if(clientRes.success) {
        dispatch(firmActions.fetchSingleIfNeeded(clientRes.item._firm));
      }
    });

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

  _handleToggleSelectAll() {

  }

  _handleUpdateRequest(request) {
    this.setState({ selectedRequest: request, requestListShowModal: true });
  }

  render() {
    const { 
      requestStore 
      , match
      , clientStore
      , userStore
      , userMap
    } = this.props;

    const {
      requestListShowModal
      , selectedRequestIds
      , selectedRequest
    } = this.state;

    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);
    const requestListItem = requestStore.util.getList(...listArgs);
    const requestList = requestListItem ? listArgs.reduce((obj, nextKey) => obj[nextKey], requestStore.lists) : null;

    const selectedClient = clientStore.selected.getItem();
    const selectedUsers = userStore.util.getList(...listArgs);

    const isEmpty = (
      requestStore.selected.didInvalidate
      || clientStore.selected.didInvalidate
      || userStore.selected.didInvalidate
      || !requestListItem
      || !userMap
      || !selectedClient
    );

    const isFetching = (
      requestStore.selected.isFetching
      || clientStore.selected.isFetching
      || userStore.selected.isFetching
      || !requestListItem
      || !userMap
      || !selectedClient
    )

    console.log(
      requestStore.selected.didInvalidate
      , clientStore.selected.didInvalidate
      , userStore.selected.didInvalidate
      , !requestListItem
      , !userMap
      , !selectedClient
    )

    console.log(
      requestStore.selected.isFetching
      , clientStore.selected.isFetching
      , userStore.selected.isFetching
      , !requestListItem
      , !userMap
      , !selectedClient
    )
    
    return (
      <PortalLayout>
        <Helmet><title>Portal Request Lists</title></Helmet>
        <h1>Request Lists</h1>
        <p>The admin has assigned you to this request lists and view the tasks assigned to other assignees.</p>
        {/* <Breadcrumbs // temporary fixed url
         links={[{ display: "Request List", path: `/portal/${match.params.clientId}/request` }]} /> */}
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
              handleRequestListShowModal={() => this.setState({ requestListShowModal: true, selectedRequest: {} })}
              handleToggleSelectAll={this._handleToggleSelectAll}
              requestList={requestList}
              sortedAndFilteredList={requestListItem}
              listArgs={listArgs}
              handleSelectRequest={this._handleSelectRequest}
              selectedRequestIds={selectedRequestIds}
              clearSelectedRequestIds={() => this.setState({ selectedRequestIds: [] })}
              handleSetPagination={this._handleSetPagination}
              setPerPage={this._setPerPage}
              userMap={userMap}
              handleUpdateRequest={this._handleUpdateRequest}
              isViewing="portal"
            />
            {
              !isEmpty && !isFetching ?
              <div>
                <RequestListForm
                  isOpen={requestListShowModal}
                  handleClose={() => this.setState({ requestListShowModal: false, selectedRequest: {} })}
                  selectedClient={selectedClient}
                  selectedUsers={selectedUsers}
                  listArgs={listArgs}
                  selectedRequest={selectedRequest}
                />
              </div> : null
            }
          </div>
        }
      </PortalLayout>
    )
  }
}

PortalRequest.propTypes = {
  dispatch: PropTypes.func.isRequired
}

PortalRequest.defaultProps = {

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
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PortalRequest)
);
