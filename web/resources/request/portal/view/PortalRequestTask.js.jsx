/**
 * View component for /portal/:clientId/request/:requestListId/:requestTaskStatus 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import { Helmet } from 'react-helmet';
import { DateTime } from 'luxon';

// import actions
import * as clientActions from '../../../client/clientActions';
import * as userActions from '../../../user/userActions';
import * as requestActions from '../../../request/requestActions';
import * as requestTaskActions from '../../../requestTask/requestTaskActions';
import * as firmActions from '../../../firm/firmActions';

// import components
import RequestTaskList from '../../../requestTask/components/RequestTaskList.js.jsx';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import routeUtils from '../../../../global/utils/routeUtils';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import PortalLayout from '../../../../global/portal/components/PortalLayout.js.jsx';

class PortalRequestTask extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      listArgs: { _request: props.match.params.requestId }
      , selectedTaskIds: []
      , requestTaskShowModal: false
      , selectedRequestTask: {}
      , requestTaskBulkEdit: false
      , submitting: false
    }
    this._bind(
      '_setPerPage'
      , '_handleSelectRequestTask'
      , '_handleUpdateRequestTask'
      , '_handleToggleSelectAll'
      , '_handleReset'
    )
  }

  componentDidMount() {
    // redirect if status path element is neither of 'published' and 'completed'.
    let pathElements = this.props.location.pathname.split('/');
    const lastPathElement = pathElements[pathElements.length - 1];
    if(lastPathElement !== 'published' && lastPathElement !== 'completed') {
      pathElements[pathElements.length - 1] = 'published';
      let newPath = pathElements.join('/');
      console.log('Invalid path [' + this.props.location.pathname + '] was requested. Sending to', newPath);
      this.props.history.push(newPath);
    }

    const { dispatch, match, loggedInUser } = this.props;
    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);
    dispatch(requestTaskActions.fetchListIfNeeded(...listArgs));
    dispatch(requestActions.fetchSingleIfNeeded(match.params.requestId));
    dispatch(userActions.fetchListIfNeeded(...['_client', match.params.clientId]));
    dispatch(userActions.fetchListIfNeeded('_clientStaff', match.params.clientId));
    if (match.params.firmId) {
      dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
    }
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then(clientRes => {
      if(clientRes.success) {
        dispatch(firmActions.fetchSingleIfNeeded(clientRes.item._firm));
      }
    });

    // to set pagination
    dispatch(requestTaskActions.setFilter({query: '', sortBy: '-updated_at'}, ...listArgs));
    this._handleSetPagination({ page: 1, per: 50 });
    
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);
    dispatch(requestTaskActions.setPagination(newPagination, ...listArgs));
  }

  _setPerPage(per) {
    var newPagination = {}
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination)
    this.setState({per: per});
  }

  _handleSelectRequestTask(requestTaskId) {
    const selectedTaskIds = _.cloneDeep(this.state.selectedTaskIds);
    if (selectedTaskIds.includes(requestTaskId)) {
      selectedTaskIds.splice(selectedTaskIds.indexOf(requestTaskId), 1);
    } else {
      selectedTaskIds.push(requestTaskId)
    }
    this.setState({ selectedTaskIds });
  }

  _handleToggleSelectAll(paginatedList, allTaskIdsSelected) {
    const { selectedTaskIds } = this.state; 

    if (selectedTaskIds.length > 0 && allTaskIdsSelected) {

      this.setState({ selectedTaskIds: [] });

    } else if (paginatedList) {

      let newSelectedTaskIds = _.cloneDeep(selectedTaskIds); 

      paginatedList.map(item => newSelectedTaskIds.indexOf(item._id) < 0 ? newSelectedTaskIds.push(item._id) : null);

      this.setState({ selectedTaskIds: newSelectedTaskIds }); 

    } else null; 
  }

  _handleUpdateRequestTask(action, requestTask) {
    const { dispatch, match } = this.props;

    if (action === "publish" && requestTask) {

      requestTask["_client"] = match.params.clientId;
      requestTask["_firm"] = match.params.firmId;
      requestTask["status"] = "published";
      requestTask["requestDate"] = DateTime.local() 
      requestTask["action"] = "published";

      this.setState({ submitting: true });

      dispatch(requestTaskActions.sendUpdateRequestTask(requestTask)).then(json => {
          if (!json.success) {
            alert(json.error);
          }
          this.setState({ submitting: false });

      });
    } else {
      this.setState({ selectedRequestTask: requestTask, requestTaskShowModal: true });
    }
  }

  _handleReset() {
    this.setState({
      requestTaskBulkEdit: false
      , requestTaskShowModal: false
      , selectedRequestTask: {}
      , selectedTaskIds: []
      , submitting: false
    });
  }

  render() {
    const {
      location
      , clientStore
      , userStore
      , userMap
      , requestTaskStore
    } = this.props;

    const {
      selectedTaskIds
      , submitting
    } = this.state;

    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);

    const list = requestTaskStore.util.getList(...listArgs);

    const requestTaskItem = list ? list.filter(task => task.status !== 'unpublished') : list;

    const requestTaskList = requestTaskItem ? listArgs.reduce((obj, nextKey) => obj[nextKey], requestTaskStore.lists) : null;

    const isEmpty = (
      requestTaskStore.selected.didInvalidate
      // || requestStore.selected.didInvalidate
      || clientStore.selected.didInvalidate
      || userStore.selected.didInvalidate
      || !requestTaskItem
      || !userMap
    );

    const isFetching = (
      requestTaskStore.selected.isFetching
      // || requestStore.selected.isFetching
      || clientStore.selected.isFetching
      || userStore.selected.isFetching
      || !requestTaskItem
      || !userMap
      || submitting
    );

    const requestStatus = {
      completed: requestTaskItem ? requestTaskItem.filter(task => task.status === "completed") : []
      , published: requestTaskItem ? requestTaskItem.filter(task => task.status === "published") : []
    }


    return (
      <PortalLayout>
        <Helmet><title>Request List Tasks</title></Helmet>
        <div className="yt-row center-vert space-between">
          <Breadcrumbs links={location.state.breadcrumbs} />
        </div>
        <h1>Tasks</h1>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>
            :
            <h2>No tasks</h2>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <RequestTaskList
              requestTaskList={requestTaskList}
              sortedAndFilteredList={requestTaskItem}
              setPerPage={this._setPerPage}
              requestStatus={requestStatus}
              handleToggleSelectAll={this._handleToggleSelectAll}
              clearSelectedTaskIds={() => this.setState({ selectedTaskIds: [] })}
              handleSetPagination={this._handleSetPagination}
              userMap={userMap}
              handleUpdateRequestTask={this._handleUpdateRequestTask}
              handleSelectRequestTask={this._handleSelectRequestTask}
              handleRequestTaskShowModal={() => this.setState({ requestTaskShowModal: true })}
              selectedTaskIds={selectedTaskIds}
              handleTaskBulkEdit={() => this.setState({ requestTaskBulkEdit: true, requestTaskShowModal: true, selectedRequestTask: {} })}
              isViewing="portal"
            />
          </div>
        }
      </PortalLayout>
    )
  }
}

PortalRequestTask.propTypes = {
  dispatch: PropTypes.func.isRequired
}

PortalRequestTask.defaultProps = {

}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    loggedInUser: store.user.loggedIn.user
    , requestTaskStore: store.requestTask
    , requestStore: store.request
    , clientStore: store.client
    , userStore: store.user
    , userMap: store.user.byId
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PortalRequestTask)
);
