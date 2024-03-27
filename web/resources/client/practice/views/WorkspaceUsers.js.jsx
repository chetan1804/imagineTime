/**
 * Boilerplate code for a new Redux-connected view component.
 * Nice for copy/pasting
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, Route, Switch, withRouter } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import third-party libraries
import { Helmet } from 'react-helmet';

// import actions
import * as addressActions from '../../../address/addressActions';
import * as clientActions from '../../clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as firmActions from '../../../firm/firmActions';
import * as phoneNumberActions from '../../../phoneNumber/phoneNumberActions';
import * as staffActions from '../../../staff/staffActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import ProfilePic from '../../../../global/components/navigation/ProfilePic.js.jsx';
import YTRoute from '../../../../global/components/routing/YTRoute.js.jsx';
import ContactFlag from '../../../../global/components/helpers/ContactFlag.js.jsx';

// import resource components
import WorkspaceLayout from '../components/WorkspaceLayout.js.jsx';
import ContactQuickView from '../../../user/practice/views/ContactQuickView.js.jsx';


class WorkspaceUsers extends Binder {
  constructor(props) {
    super(props);
    this.state = {

    }
    this._bind(

    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
    dispatch(clientUserActions.fetchListIfNeeded('_client', match.params.clientId)).then(cuRes => {
      if(cuRes.success) {
        cuRes.list.forEach(cu => {
          if (cu.status === "active") {
            dispatch(addressActions.fetchListIfNeeded('_user', cu._user));
            dispatch(phoneNumberActions.fetchListIfNeeded('_user', cu._user));  
          }
        })
      }
    });
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));

    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(staffClientActions.fetchListIfNeeded('_client', match.params.clientId, '~staff.status', 'active'));
  }

  render() {
    const {
      clientStore
      , clientUserStore
      , firmStore
      , loggedInUser
      , match 
      , staffClientStore
      , userStore
    } = this.props;

    const selectedFirm = firmStore.selected.getItem();
    const selectedClient = clientStore.selected.getItem();

    // clientUsers(contacts) list 
    const clientUserList = clientUserStore.lists && clientUserStore.lists._client ? clientUserStore.lists._client[match.params.clientId] : null;
    const clientUserListItems = clientUserStore.util.getList('_client', match.params.clientId);

    // staffClient  list 
    const staffClientList = staffClientStore.lists && staffClientStore.lists._client && staffClientStore.lists._client[match.params.clientId] && staffClientStore.lists._client[match.params.clientId]['~staff.status'] ? staffClientStore.lists._client[match.params.clientId]['~staff.status'].active : null;
    const staffClientListItems = staffClientStore.util.getList('_client', match.params.clientId, '~staff.status', 'active');
    
    const isEmpty = (
      clientStore.selected.didInvalidate
      || firmStore.selected.didInvalidate
      || !selectedClient
      || !selectedClient._id
      || !selectedFirm
      || !selectedFirm._id
    );

    const isFetching = (
      clientStore.selected.isFetching
      || !clientUserListItems
      || !clientUserList
      || clientUserList.isFetching
      || firmStore.selected.isFetching
      || !staffClientListItems
      || !staffClientList
      || staffClientList.isFetching
    )

    return (
      <WorkspaceLayout>
        <Helmet><title>Users Associated with {selectedClient ? selectedClient.name : 'Client'}</title></Helmet>
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
          <div className="-mob-layout-ytcol100" style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h2>Users</h2>
            <h3>Contacts associated with {selectedClient.name}</h3>
            <div className="-contact-list">
              {clientUserListItems ? 
                clientUserListItems.filter(cu => cu.status === "active").map((cu, i) =>
                  userStore.byId[cu._user] ? 
                    <Link to={`${match.url}/quick-view/${cu._user}`} className="-contact-card" key={cu._id + i}>
                      <div className="yt-row">
                        <ProfilePic user={userStore.byId[cu._user]}/>
                        <div>
                          <div className="-name">{userStore.byId[cu._user].firstname} {userStore.byId[cu._user].lastname} {cu._user == loggedInUser._id ? "(You)" : null}</div>
                          <small>{userStore.byId[cu._user].username}</small>
                          <br/>
                          <ContactFlag user={userStore.byId[cu._user]} clientUser={cu} />
                        </div>
                      </div>
                    </Link>
                  :
                  <i className="fal fa-spinner fa-spin"/>
                )
                :
                <p><em>No contacts yet</em></p>
              }
              <div className="-portal-content">
                <h3>Assigned Staff </h3>
                <div className="-contact-list">

                  {staffClientListItems ? 
                    staffClientListItems.map((sc, i) =>
                      userStore.byId[sc._user] ? 
                        <div className="-contact-card" key={sc._id + i}>
                          <div className="yt-row">
                            <ProfilePic user={userStore.byId[sc._user]}/>
                            <div>
                              <div className="-name">{userStore.byId[sc._user].firstname} {userStore.byId[sc._user].lastname} {sc._user == loggedInUser._id ? "(You)" : null}</div>
                              <small>{userStore.byId[sc._user].username}</small>
                            </div>
                          </div>
                        </div>
                      :
                      <i className="fal fa-spinner fa-spin"/>
                    )
                    :
                    <p><em>No contacts yet</em></p>
                  }
                </div>
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
                    breadcrumbs={[{display: 'All clients', path: `/firm/${match.params.firmId}/workspaces`}, {display: 'Workspace', path: `/firm/${match.params.firmId}/workspaces/${match.params.clientId}`}, {display: 'Contacts', path: null}]}
                    exact 
                    path="/firm/:firmId/workspaces/:clientId/users/quick-view/:userId" 
                    login={true} 
                    component={ContactQuickView}
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

WorkspaceUsers.propTypes = {
  dispatch: PropTypes.func.isRequired
}

WorkspaceUsers.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    clientUserStore: store.clientUser
    , clientStore: store.client
    , firmStore: store.firm
    , staffClientStore: store.staffClient 
    , userStore: store.user
    , loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(WorkspaceUsers)
);
