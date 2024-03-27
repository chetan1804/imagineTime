/**
 * View component for /firm/:firmId/clients/:clientId/client-workflows
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, Route, Switch, withRouter } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import third-party libraries
import { Helmet } from 'react-helmet';

// import actions
import * as clientActions from '../../../client/clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as clientWorkflowActions from '../../clientWorkflowActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';
import * as userActions from '../../../user/userActions';
import * as tagActions from '../../../tag/tagActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import YTRoute from '../../../../global/components/routing/YTRoute.js.jsx';
import routeUtils from '../../../../global/utils/routeUtils';

// import resource components
import PracticeClientWorkflowQuickViewer from './PracticeClientWorkflowQuickViewer.js.jsx';
import ClientWorkflowList from '../../components/ClientWorkflowList.js.jsx';
import WorkspaceLayout from '../../../client/practice/components/WorkspaceLayout.js.jsx';

class WorkspaceClientWorkflows extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      page: 1
      , per: 50
      , isUploadFilesModalOpen: false 
      , query: ''
      , viewingAs: 'grid'
      , clientWorkflowListArgsObj: {
        '_client': props.match.params.clientId
      }
      // , clientWorkflowListArgs: ['_client', props.match.params.clientId]
    }
    this._bind(
      '_handleSetFilter'
      , '_handleSetPagination'
      , '_setPerPage'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
    dispatch(clientUserActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));

    const clientWorkflowListArgs = routeUtils.listArgsFromObject(this.state.clientWorkflowListArgsObj); // computed from the object
    this._handleSetPagination({page: 1, per: 50})
    dispatch(clientWorkflowActions.fetchListIfNeeded(...clientWorkflowListArgs)); 
    dispatch(clientWorkflowActions.setFilter({query: '', sortBy: 'title'}, ...clientWorkflowListArgs));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    // dispatch(staffClientActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
    dispatch(tagActions.fetchListIfNeeded('~firm', match.params.firmId));
  }

  componentDidUpdate(prevProps, prevState) {
    // catch for state change and re-fetch clientWorkflow list if it happens
    // compare computed listArgs object
    if(routeUtils.listArgsFromObject(prevState.clientWorkflowListArgsObj) !== routeUtils.listArgsFromObject(this.state.clientWorkflowListArgsObj)) {
      this.props.dispatch(clientWorkflowActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(this.state.clientWorkflowListArgsObj)))
    }
  }

  // _handleUploadedFiles(files) {
  //   const { dispatch, loggedInUser, match } = this.props; 
  //   dispatch(clientWorkflowActions.invalidateList('_client', match.params.clientId));
  //   dispatch(clientWorkflowActions.fetchListIfNeeded('_client', match.params.clientId)); // NOTE:  this will need to be by client 
  //   this.setState({clientWorkflowListArgsObj: {'_client': match.params.clientId} }) // reset the filters
  //   this.setState({isUploadFilesModalOpen: false});
  // }

  _handleSetFilter(e) {
    let newClientWorkflowListArgsObj = { ...this.state.clientWorkflowListArgsObj }
    newClientWorkflowListArgsObj[e.target.name] = e.target.value;

    // console.log("next obj: ", newClientWorkflowListArgsObj)
    // console.log(routeUtils.listArgsFromObject(newClientWorkflowListArgsObj))
    this.setState({ clientWorkflowListArgsObj: newClientWorkflowListArgsObj }
    , () => this._handleSetPagination({page: 1, per: this.state.per})
    )
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    const clientWorkflowListArgs = routeUtils.listArgsFromObject(this.state.clientWorkflowListArgsObj);
    dispatch(clientWorkflowActions.setPagination(newPagination, ...clientWorkflowListArgs));
  }

  _setPerPage(per) {
    var newPagination = {}
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination)
    this.setState({per: per});
  }

  render() {
    // console.log("RENDERING")
    const {
      clientStore 
      , clientUserStore 
      , clientWorkflowStore
      , firmStore
      , location 
      , loggedInUser
      , match 
      , staffStore 
      , staffClientStore 
      , tagStore
      , userStore 
    } = this.props;
    
    const clientWorkflowListArgs = routeUtils.listArgsFromObject(this.state.clientWorkflowListArgsObj) // computed from the object

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


    {/** DONE: make this work like files */}
    // totalListInfo is the original fetched list. We'll use it to keep track of total item quantity.
    const totalListInfo = clientWorkflowStore.lists && clientWorkflowStore.lists._client ? clientWorkflowStore.lists._client[match.params.clientId] : null;
    // clientWorkflow  list
    const clientWorkflowListItems = clientWorkflowStore.util.getList(...clientWorkflowListArgs);
    // console.log("filelistitems", clientWorkflowListItems)
    // TODO: this is a good way to do this arbitrarily going forward. if clientWorkflowListItems isn't null, then we know the list is at least defined
    const clientWorkflowList = clientWorkflowListItems ? clientWorkflowListArgs.reduce((obj, nextKey) => obj[nextKey], clientWorkflowStore.lists) : null


    const isEmpty = (
      clientStore.selected.didInvalidate
      || !clientWorkflowListItems
      || !clientWorkflowList
      || firmStore.selected.didInvalidate
      || !selectedClient
      || !selectedClient._id
      || !selectedFirm
      || !selectedFirm._id
    );

    const isFetching = (
      !clientWorkflowListItems
      || !clientWorkflowList
      || clientWorkflowList.isFetching
      || clientStore.selected.isFetching
      || !clientUserListItems
      || !clientUserList
      || clientUserList.isFetching
      || firmStore.selected.isFetching
      // || !staffClientListItems
      // || !staffClientList
      // || staffClientList.isFetching
    )    

    return (
      <WorkspaceLayout>
        <Helmet><title>Client Workflows</title></Helmet>
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
            <ClientWorkflowList
              allTags={allTags}
              selectedTagIds={this.state.clientWorkflowListArgsObj._tags || []}
              clientWorkflowList={clientWorkflowList}
              handleFilter={this._handleSetFilter}
              handleQuery={() => console.log('handle queery')}
              handleSetPagination={this._handleSetPagination}
              handleSort={() => console.log('handle sort')}
              setPerPage={this._setPerPage}
              totalListInfo={totalListInfo}
              sortedAndFilteredList={clientWorkflowListItems.sort((a,b) => a.created_at < b.created_at ? -1 : 1)} // TODO: update this 
              clientWorkflowListArgs={routeUtils.listArgsFromObject(this.state.clientWorkflowListArgsObj)}
            />
            <TransitionGroup>
              <CSSTransition
                key={location.key}
                classNames="slide-from-right"
                timeout={300}
              >
                <Switch location={location}>
                  <YTRoute
                    breadcrumbs={[{display: 'All clients', path: `/firm/${match.params.firmId}/clients`}, {display: 'Workspace', path: `/firm/${match.params.firmId}/clients/${match.params.clientId}`}, {display: 'ClientWorkflows', path: null}]}
                    component={PracticeClientWorkflowQuickViewer}
                    exact
                    path="/firm/:firmId/workspaces/:clientId/client-workflows/:clientWorkflowId"
                    login={true}
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

WorkspaceClientWorkflows.propTypes = {
  dispatch: PropTypes.func.isRequired
}

WorkspaceClientWorkflows.defaultProps = {

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
  )(WorkspaceClientWorkflows)
);
