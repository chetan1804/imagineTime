/**
 * View component for portal/:clientId/request/:requestListId/requestTask/:requestTaskId
 *
 * Portal request task single view for uploading files or viewing the details.
 *
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { withRouter, Switch, Route } from 'react-router-dom';

// import third-party libraries
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import YTRoute from '../../../../global/components/routing/YTRoute.js.jsx';

// import actions
import * as requestTaskActions from '../../requestTaskActions';
import * as firmActions from '../../../firm/firmActions';
import * as clientActions from '../../../client/clientActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';
import PortalLayout from '../../../../global/portal/components/PortalLayout.js.jsx';

// import resource components
import PortalRequestTaskList from '../components/PortalRequestTaskList.js.jsx';
import SingleRequestTask from '../../components/SingleRequestTask.js.jsx';
import TaskActivityOverview  from '../../components/TaskActivityOverview.js.jsx';

// import utils
import routeUtils from '../../../../global/utils/routeUtils';

class PortalRequestTask extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      query: ''
      , requestTaskListArgsObj: { _client: props.match.params.clientId }
    }
    this._bind(
      '_handleSetFilter'
      , '_handleSetPagination'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props
    /**
     * add this to each portal view 
     */
    // fetch a list of your choice
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then(clientRes => {
      if(clientRes.success) {
        dispatch(firmActions.fetchSingleIfNeeded(clientRes.item._firm));
      }
    });
    dispatch(userActions.fetchListIfNeeded('_clientStaff', match.params.clientId));
    const requestTaskListArgs = routeUtils.listArgsFromObject(this.state.requestTaskListArgsObj); // computed from the object
    this._handleSetPagination({page: 1, per: 50}); 
    dispatch(requestTaskActions.fetchListPortal(match.params.clientId, ...requestTaskListArgs));
  }
  
  _handleSetFilter(e) {
    let newRequestTaskListArgsObj = { ...this.state.requestTaskListArgsObj }
    newRequestTaskListArgsObj[e.target.name] = e.target.value;
    this.setState({ requestTaskListArgsObj: newRequestTaskListArgsObj });
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    const requestTaskListArgs = routeUtils.listArgsFromObject(this.state.requestTaskListArgsObj);
    dispatch(requestTaskActions.setPagination(newPagination, ...requestTaskListArgs));
  }

  render() {
     const {
        location
        , requestTaskStore
        , clientStore 
        , firmStore
        , match
        , requestTaskMap
    } = this.props;
    
    const requestTaskListArgs = routeUtils.listArgsFromObject(this.state.requestTaskListArgsObj) // computed from the object

    // client & firm 
    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();

    const requestTaskList = requestTaskStore.util.getListInfo(...requestTaskListArgs);
    const requestTaskListItems = requestTaskStore.util.getList(...requestTaskListArgs);
    const requestTask = requestTaskMap && match.params.requestTaskId ? requestTaskMap[match.params.requestTaskId] : null;

    const isEmpty = (
      requestTaskStore.selected.didInvalidate
      || !requestTaskList
      || !requestTaskListItems
      || !selectedClient
      || !selectedClient._id
      || !selectedFirm
      || !selectedFirm._id
      || !requestTaskMap
    );

    const isFetching = (
      requestTaskStore.selected.isFetching
      || !requestTaskList
      || requestTaskList.isFetching
      || !requestTaskListItems
      || !selectedClient
      || !selectedClient._id
      || !selectedFirm
      || !selectedFirm._id
      || !requestTaskMap
    )

    return (
      <PortalLayout>
        <Helmet><title>Request Task</title></Helmet>
        <div className="yt-row center-vert space-between">
          <Breadcrumbs links={location.state.breadcrumbs} />
        </div>
        { match.params.requestTaskId ? null : <h1>Request Tasks</h1>}
        <hr/>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <em>No tasks</em>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="yt-row with-gutters space-between">
              <div className="yt-col full s_60 m_70">
                {
                  match.params.requestTaskId && requestTask ? 
                  <SingleRequestTask requestTask={requestTask} selectedFirm={selectedFirm} />
                  :
                  <PortalRequestTaskList
                    // allTags={allTags}
                    selectedTagIds={[]}
                    requestTaskList={requestTaskList}
                    handleFilter={this._handleSetFilter}
                    handleQuery={() => console.log('handle queery')}
                    handleSetPagination={this._handleSetPagination}
                    handleSort={() => console.log('handle sort')}
                    // Sort the list so the newest tasks are first.
                    sortedAndFilteredList={requestTaskListItems.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))} // TODO: update this 
                  />
                }
              </div>
              <div className="yt-col full s_40 m_25 portal-info-helper">
                <div className="-content-box">
                  <div className="-icon">
                    <i className="fal fa-lightbulb-on"/>
                  </div>
                  <p>Automated Requests are a collection of action items between you and the {selectedFirm ? selectedFirm.name : null} team. They provide you with an easy way to understand exactly what you need to deliver and when you need to deliver it.</p>
                </div>
              </div>
            </div>
            {
              !isEmpty && !isFetching ?
              <div>
                <TransitionGroup>
                  <CSSTransition
                    key={location.key}
                    classNames="slide-from-right"
                    timeout={300}
                  >
                    <Switch location={location}>
                      <YTRoute
                        breadcrumbs={[]}
                        exact
                        path="/portal/:clientId/request/:requestId/requestTask/:requestTaskId/:viewingAs"
                        clientUser={true}
                        component={TaskActivityOverview}
                      />
                      <Route render={() => <div/>} />
                    </Switch>
                  </CSSTransition>
                </TransitionGroup>
              </div> : null
            }
          </div>
        }
      </PortalLayout>
    )
  }
}

PortalRequestTask.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    requestTaskStore: store.requestTask
    , clientStore: store.client
    , firmStore: store.firm
    , requestTaskMap: store.requestTask.byId
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PortalRequestTask)
);
