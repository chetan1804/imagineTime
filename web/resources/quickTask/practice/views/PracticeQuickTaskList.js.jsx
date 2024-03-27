/**
 * View component for /quick-tasks
 *
 * Generic quickTask list view. Defaults to 'all' with:
 * this.props.dispatch(quickTaskActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter, Switch, Route } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Helmet } from 'react-helmet';

// import actions
import * as clientActions from '../../../client/clientActions';
import * as quickTaskActions from '../../quickTaskActions';
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import YTRoute from '../../../../global/components/routing/YTRoute.js.jsx';

// import resource components
import QuickTaskLayout from '../../components/QuickTaskLayout.js.jsx';
import PracticeQuickTaskListItem from '../components/PracticeQuickTaskListItem.js.jsx';
import WorkspaceLayout from '../../../client/practice/components/WorkspaceLayout.js.jsx';
import PracticeQuickTaskQuickView from './PracticeQuickTaskQuickView.js.jsx'; 

class PracticeQuickTaskList extends Binder {
  constructor(props) {
    super(props);
    this._bind(
      '_archiveQuickTask'
      , '_reinstateQuickTask'
      , '_handleFilter'
    )
  }

  componentDidMount() {
    // fetch a list of your choice
    const { dispatch, match } = this.props;
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(quickTaskActions.fetchList('_client', match.params.clientId, 'visibility', 'active')); // defaults to 'all'
    dispatch(quickTaskActions.setFilter({query: '', sortBy: '-date'}, '~client', match.params.clientId, 'visibility', 'active'));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
  }

  _archiveQuickTask(quickTask) {
    const { dispatch, match } = this.props; 
    let newQuickTask = _.cloneDeep(quickTask); 
    newQuickTask.visibility = 'archived'; 
    // newQuickTask.status = 'closed'; 
    dispatch(quickTaskActions.sendUpdateQuickTask(newQuickTask)).then((json) => {
      dispatch(quickTaskActions.removeQuickTaskFromList(json.id, '_client', match.params.clientId, 'visibility', 'active'));
    })
  }

  _reinstateQuickTask(quickTask) {
    const { dispatch, match } = this.props; 
    let newQuickTask = _.cloneDeep(quickTask); 
    newQuickTask.visibility = 'active'; 
    dispatch(quickTaskActions.sendUpdateQuickTask(newQuickTask)).then((json) => {
      dispatch(quickTaskActions.fetchListIfNeeded('_client', match.params.clientId, 'visibility', 'active'));
    })
  }

  _handleFilter(sortBy) {
    const { dispatch, quickTaskStore, match } = this.props; 
    const quickTaskList = quickTaskStore.util.getListInfo('_client', match.params.clientId, 'visibility', 'active');
    let newFilter = quickTaskList.filter; 
    if(quickTaskList.filter.sortBy && quickTaskList.filter.sortBy.indexOf("-") < 0) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0)
    }
    newFilter.sortBy = sortBy;
    dispatch(quickTaskActions.setFilter(newFilter, '~client', match.params.clientId, 'visibility', 'active')); 
  }

  render() {
    const { quickTaskStore, match, location } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the quickTaskList meta info here so we can reference 'isFetching'
    const quickTaskList = quickTaskStore.util.getListInfo('_client', match.params.clientId, 'visibility', 'active');

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual quickTask objetcs
     */
    const quickTaskListItems = quickTaskStore.util.getList('_client', match.params.clientId, 'visibility', 'active');

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !quickTaskListItems
      || !quickTaskList
    );

    const isFetching = (
      !quickTaskListItems
      || !quickTaskList
      || quickTaskList.isFetching
    )

    const filter = quickTaskList && quickTaskList.filter; 
    let sortedList = []; 
    const sortBy = filter ? filter.sortBy : 'date'; 

    switch(sortBy) {
      case 'date':
        sortedList = _.orderBy(quickTaskListItems, [item => item.created_at], ['asc']);
        break;
      case '-date':
        sortedList = _.orderBy(quickTaskListItems, [item => item.created_at], ['desc']);
        break;
      default:
        sortedList = _.orderBy(quickTaskListItems, [item => item.created_at], ['desc']);
    }

    return (
      <WorkspaceLayout>
        <Helmet><title>Workspace Quick Tasks</title></Helmet>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div className="-height-auto-mobile-layout" style={{ opacity: isFetching ? 0.5 : 1, height: '200vh', marginTop: '16px' }}>
            <div className="u-pullRight">
              <Link to={`${match.url}/archived`}>View Archive</Link>
            </div>
            <div className="yt-table table firm-table truncate-cells">
              <div className="-table-horizontal-scrolling -quicktask-list">
                <div className="table-head">
                  <div className="table-cell"></div>
                  <div className="table-cell _50">Type</div>
                  <div className="table-cell _30">Created By</div>
                  <div className="table-cell sortable _20" onClick={() => this._handleFilter("date")}>Date
                    {sortBy && sortBy == 'date' ? 
                      <i className="fad fa-sort-up"></i>
                    : sortBy && sortBy == '-date' ?
                      <i className="fad fa-sort-down"></i>
                    : 
                      <i className="fad fa-sort"></i>
                    }
                  </div>
                  <div className="table-cell">Status</div>
                </div>
                {sortedList.map((quickTask, i) =>
                  <PracticeQuickTaskListItem 
                    key={quickTask._id} 
                    quickTask={quickTask} 
                    archiveQuickTask={this._archiveQuickTask}
                    reinstateQuickTask={this._reinstateQuickTask}
                  />
                )}
              </div>
            </div>
            <TransitionGroup>
              <CSSTransition
                key={location.key}
                classNames="slide-from-right"
                timeout={300}
              >
                <Switch location={location}>
                  <YTRoute
                    breadcrumbs={
                      [{display: 'Workspaces', path: `/firm/${match.params.firmId}/workspaces/${match.params.clientId}` }
                      , {display: 'Quick Tasks', path: `/firm/${match.params.firmId}/workspaces/${match.params.clientId}/quick-tasks`}
                      , {display: 'Details', path: null }]
                    }
                    exact
                    path="/firm/:firmId/workspaces/:clientId/quick-tasks/quick-view/:quickTaskId"
                    staff={true}
                    component={PracticeQuickTaskQuickView}
                  />
                  <Route render={() => <div/>} />
                </Switch>
              </CSSTransition>
            </TransitionGroup>
          </div>
        }
      </WorkspaceLayout>
    )
  }
}

PracticeQuickTaskList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    quickTaskStore: store.quickTask
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeQuickTaskList)
);
