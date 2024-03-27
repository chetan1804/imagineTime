/**
 * View component for portal/:clientId/quick-tasks
 *
 * Portal quickTask list view.
 *
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { Helmet } from 'react-helmet';

// import actions
import * as clientActions from '../../../client/clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as quickTaskActions from '../../quickTaskActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import PortalLayout from '../../../../global/portal/components/PortalLayout.js.jsx';

// import resource components
import PortalQuickTaskList from '../components/PortalQuickTaskList.js.jsx';

// import utils
import routeUtils from '../../../../global/utils/routeUtils';

class PortalQuickTasks extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      query: ''
      , quickTaskListArgsObj: {
        '_client': props.match.params.clientId
        , 'visibility': 'active'
      }
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
    dispatch(clientUserActions.fetchClientUserLoggedInByClientIfNeeded(match.params.clientId));

    // fetch a list of your choice
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then(clientRes => {
      if(clientRes.success) {
        dispatch(firmActions.fetchSingleIfNeeded(clientRes.item._firm));
        dispatch(staffActions.fetchListIfNeeded('_firm', clientRes.item._firm));
        dispatch(userActions.fetchListIfNeeded('_firmStaff', clientRes.item._firm));
      }
    })
    
    const quickTaskListArgs = routeUtils.listArgsFromObject(this.state.quickTaskListArgsObj) // computed from the object
    this._handleSetPagination({page: 1, per: 50}); 
    dispatch(quickTaskActions.fetchListIfNeeded(...quickTaskListArgs));
    dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));
  }
  
  componentDidUpdate(prevState) {
    // catch for state change and re-fetch quickTask list if it happens
    // compare computed listArgs object
    if(!prevState.quickTaskListArgsObj && this.state.quickTaskListArgsObj || (prevState.quickTaskListArgsObj && routeUtils.listArgsFromObject(prevState.quickTaskListArgsObj) !== routeUtils.listArgsFromObject(this.state.quickTaskListArgsObj))) {
      this.props.dispatch(quickTaskActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(this.state.quickTaskListArgsObj)))
    }
  }

  _handleSetFilter(e) {
    let newQuickTaskListArgsObj = { ...this.state.quickTaskListArgsObj }
    newQuickTaskListArgsObj[e.target.name] = e.target.value;
    this.setState({ quickTaskListArgsObj: newQuickTaskListArgsObj })
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    const quickTaskListArgs = routeUtils.listArgsFromObject(this.state.quickTaskListArgsObj);
    dispatch(quickTaskActions.setPagination(newPagination, ...quickTaskListArgs));
  }

  render() {
     const {
      clientStore 
      , firmStore
      , quickTaskStore
    } = this.props;
    
    const quickTaskListArgs = routeUtils.listArgsFromObject(this.state.quickTaskListArgsObj) // computed from the object

    // client & firm 
    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();

    const quickTaskList = quickTaskStore.util.getListInfo(...quickTaskListArgs)
    const quickTaskListItems = quickTaskStore.util.getList(...quickTaskListArgs);

    const isEmpty = (
      clientStore.selected.didInvalidate
      || firmStore.selected.didInvalidate
      || !selectedClient
      || !selectedClient._id
      || !selectedFirm
      || !selectedFirm._id
      || !quickTaskList
      || !quickTaskListItems
    );

    const isFetching = (
      clientStore.selected.isFetching
      || firmStore.selected.isFetching
      || !quickTaskList
      || quickTaskList.isFetching
    )

    return (
      <PortalLayout>
        <Helmet><title>Quick Tasks</title></Helmet>
        <h1>Quick Tasks</h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <em>No clientWorkflows.</em>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="yt-row with-gutters space-between">
              <div className="yt-col full s_60 m_70">
                <PortalQuickTaskList
                  // allTags={allTags}
                  selectedTagIds={this.state.quickTaskListArgsObj._tags || []}
                  quickTaskList={quickTaskList}
                  handleFilter={this._handleSetFilter}
                  handleQuery={() => console.log('handle queery')}
                  handleSetPagination={this._handleSetPagination}
                  handleSort={() => console.log('handle sort')}
                  // Sort the list so the newest tasks are first.
                  sortedAndFilteredList={quickTaskListItems.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))} // TODO: update this 
                />
              </div>
              <div className="yt-col full s_40 m_25 portal-info-helper">
                <div className="-content-box">
                  <div className="-icon">
                    <i className="fal fa-lightbulb-on"/>
                  </div>
                  <p>Automated Requests are a collection of action items between you and the {selectedFirm ? selectedFirm.name : null} team. They provide you with an easy way to understand exactly what you need to deliver and when you need to deliver it.</p>
                </div>
                {/* <div className="-need-help" style={{marginTop: '32px'}}>
                  <p className="u-centerText">Need help?</p>
                  <button className="yt-btn bordered block x-small info">Schedule a call</button>
                </div> */}
              </div>
            </div>
          </div>
        }
      </PortalLayout>
    )
  }
}

PortalQuickTasks.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    clientStore: store.client
    , clientUserStore: store.clientUser
    , firmStore: store.firm
    , loggedInUser: store.user.loggedIn.user
    , quickTaskStore: store.quickTask
    , staffStore: store.staff
    , staffClientStore: store.staffClient
    , tagStore: store.tag
    , clientWorkflowStore: store.clientWorkflow
    , userStore: store.user 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PortalQuickTasks)
);
