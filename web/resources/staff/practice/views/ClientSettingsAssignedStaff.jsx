/**
 * View component for /firm/:firmId/clients/:clientId/staff
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, Route, Switch, withRouter } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import third-party libraries


// import actions
import * as addressActions from '../../../address/addressActions';
import * as clientActions from '../../../client/clientActions';
import * as firmActions from '../../../firm/firmActions';
import * as phoneNumberActions from '../../../phoneNumber/phoneNumberActions';
import * as staffActions from '../../staffActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';
import * as tagActions from '../../../tag/tagActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import YTRoute from '../../../../global/components/routing/YTRoute.js.jsx';
import routeUtils from '../../../../global/utils/routeUtils';

// import resource components
import CreateStaffClientModal from '../../../staffClient/components/CreateStaffClientModal.js.jsx';
import PracticeStaffClientQuickView from '../../../staffClient/practice/views/PracticeStaffClientQuickView.js.jsx';
import PracticeStaffClientList from '../../../staffClient/practice/components/PracticeStaffClientList.js.jsx';
import ClientSettingsLayout from '../../../client/practice/components/ClientSettingsLayout.js.jsx';
import AttachStaffListModal from '../../components/AttachStaffListModal.js.jsx';

class ClientSettingsAssignedStaff extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      isAddStaffModalOpen: false
      , page: 1
      , per: 50
      , query: ''
      , staffClientListArgsObj: {
        '_client': props.match.params.clientId
      }
    }
    this._bind(
      '_handleSetFilter'
      , '_handleSetPagination'
      , '_setPerPage'
      , '_handleQuery'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match, location } = this.props;
    const query = new URLSearchParams(location.search);
    const page = query.get('page')
    const perPage = query.get('per')
    // These two fetches should live on every top-level practice view.
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(staffClientActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(tagActions.fetchListIfNeeded('~firm', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));

    if (page) {
      setTimeout(() => {
        this._handleSetPagination({page: page, per: perPage});
      }, 500)
    } else {
      this._handleSetPagination({page: 1, per: 50});
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // catch for state change and re-fetch file list if it happens
    // compare computed listArgs object
    if(routeUtils.listArgsFromObject(prevState.staffClientListArgsObj) !== routeUtils.listArgsFromObject(this.state.staffClientListArgsObj)) {
      this.props.dispatch(staffClientActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(this.state.staffClientListArgsObj)))
    }
  }

  _handleSetFilter(e) {
    console.log('Apply filters', e);
    
    // let nextStaffClientListArgsObj = { ...this.state.staffClientListArgsObj }
    // nextStaffClientListArgsObj[e.target.name] = e.target.value;
    // this.setState({ staffClientListArgsObj: nextStaffClientListArgsObj }
    // , () => this._handleSetPagination({page: 1, per: this.state.per})
    // )
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    dispatch(staffClientActions.setPagination(newPagination, ...routeUtils.listArgsFromObject(this.state.staffClientListArgsObj)));
  }

  _setPerPage(per) {
    var newPagination = {}
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination)
    this.setState({per: newPagination.per});
  }

  _handleQuery(e) {
    const { dispatch } = this.props;
    // always defaulting the page to page 1 so we can see our results
    let pagination = {};
    pagination.page = 1;
    pagination.per = this.state.per;
    this._handleSetPagination(pagination);
    // continue query logic
    dispatch(fileActions.setQuery(e.target.value.toLowerCase(), ...routeUtils.listArgsFromObject(this.state.listArgs)));
    this.setState({query: e.target.value.toLowerCase()});
  }

  render() {
    const {
      firmStore
      , location 
      , match 
      , staffStore 
      , staffClientStore 
      , tagStore
      , userStore
      , staffMap
    } = this.props;

    // staffClient  list
    // TODO: Either narrow this search by active staff or show the status on the list item.
    const utilStaffClientStore = staffClientStore.util.getSelectedStore('_client', match.params.clientId);
    const staffClientListItems = staffClientStore.util.getList(...routeUtils.listArgsFromObject(this.state.staffClientListArgsObj));

    // staff list
    const staffList = staffStore.lists && staffStore.lists._firm ? staffStore.lists._firm[match.params.firmId] : null;
    const staffListItems = staffStore.util.getList('_firm', match.params.firmId);

    const allTags = tagStore.util.getList('~firm', match.params.firmId) || []
   
    const isEmpty = (
      firmStore.selected.didInvalidate
      || !utilStaffClientStore
      || utilStaffClientStore.didInvalidate
      || !staffList
      || staffList.didInvalidate
    );

    const isFetching = (
      !staffListItems
      || !staffList
      || staffList.isFetching
      || !staffClientListItems
      || !utilStaffClientStore
      || utilStaffClientStore.isFetching
    );

    // build an array of staff that aren't already assigned to this client.

    // newFileIds.flatMap(item => !syncFileIds.includes(item) ? { _file: item, _user: userId, ison: false } : []);
    const availableStaff = isEmpty || isFetching || !staffListItems ? [] : staffListItems.flatMap(staff => {
      let item = staff;
      let fullName = userStore.byId[staff._user] ? `${userStore.byId[staff._user].firstname} ${userStore.byId[staff._user].lastname}` : '';
      let userName = userStore.byId[staff._user] ? userStore.byId[staff._user].username : '';
      item.displayName = `${fullName} | ${userName}`;
      item.fullName = fullName;
      item.userName = userName;
      return staff && staff.status === "active" && !(staffClientListItems && staffClientListItems.some(staffClient => staffClient && staffClient._staff === item._id)) ? item : [];
    });
    
    return (
      <ClientSettingsLayout>
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
          <PracticeStaffClientList
            allTags={allTags}
            selectedTagIds={this.state.staffClientListArgsObj._tags || []}
            handleFilter={this._handleSetFilter}
            handleOpenAddStaffModal={() => this.setState({isAddStaffModalOpen: true})}
            handleQuery={this._handleQuery}
            handleSetPagination={this._handleSetPagination}
            handleSort={() => console.log('handle sort')}
            setPerPage={this._setPerPage}
            staffClientListItems={staffClientListItems} 
            utilStaffClientStore={utilStaffClientStore}
          />
          <AttachStaffListModal
            close={() => this.setState({isAddStaffModalOpen: false})}
            isOpen={this.state.isAddStaffModalOpen}
            staffListItems={availableStaff}
            staffMap={staffMap}
            viewingAs="single-client"
            handleNewStaffClient={() => this.setState({ staffClientListArgsObj: {'_client': match.params.clientId}, isAddStaffModalOpen: false })}
          />
          <TransitionGroup>
            <CSSTransition
              key={location.key}
              classNames="slide-from-right"
              timeout={300}
            >
              <Switch location={location}>
                <YTRoute
                  breadcrumbs={[{display: 'All clients', path: `/firm/${match.params.firmId}/clients`}, {display: 'Workspace', path: `/firm/${match.params.firmId}/clients/${match.params.clientId}`}, {display: 'Assigned Staff', path: null}]}
                  component={PracticeStaffClientQuickView}
                  exact
                  path="/firm/:firmId/clients/:clientId/staff/:staffId"
                  login={true}
                />
                <Route render={() => <div/>} />
              </Switch>
            </CSSTransition>
          </TransitionGroup>
        </div>
      }
      </ClientSettingsLayout>
    )
  }
}

ClientSettingsAssignedStaff.propTypes = {
  dispatch: PropTypes.func.isRequired
}

ClientSettingsAssignedStaff.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , staffStore: store.staff 
    , staffClientStore: store.staffClient 
    , tagStore: store.tag
    , userStore: store.user 
    , staffMap: store.staff.byId
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(ClientSettingsAssignedStaff)
);
