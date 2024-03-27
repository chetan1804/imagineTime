/**
 * View component for /admin/files
 *
 * Generic file list view. Defaults to 'all' with:
 * this.props.dispatch(fileActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, Switch, withRouter } from 'react-router-dom';

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
import PortalLayout from '../../../../global/portal/components/PortalLayout.js.jsx';
import ProfilePic from '../../../../global/components/navigation/ProfilePic.js.jsx';
import YTRoute from '../../../../global/components/routing/YTRoute.js.jsx';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

// import resource components
import AccountUsers from './AccountUsers.js.jsx'; 
import ClientSettingsOverview from '../components/ClientSettingsOverview.js.jsx';
import ClientUserSettings from '../../../clientUser/portal/components/ClientUserSettings.js.jsx';

class AccountInfo extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    /**
     * add this to each portal view 
     */
    dispatch(clientUserActions.fetchClientUserLoggedInByClientIfNeeded(match.params.clientId));

    // Moving the fetches from AccountUsers to this parent view since the data is needed in both sub-views.
    dispatch(addressActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then(clientRes => {
      if(clientRes.success) {
        const client = clientRes.item;
        if(client._primaryAddress) {
          dispatch(addressActions.fetchSingleIfNeeded(client._primaryAddress))
        }
        if(client._primaryPhone) {
          dispatch(phoneNumberActions.fetchSingleIfNeeded(client._primaryPhone))
        }
        dispatch(firmActions.fetchSingleIfNeeded(clientRes.item._firm));
        // dispatch(staffActions.fetchListIfNeeded('_firm', clientRes.item._firm));
        dispatch(userActions.fetchListIfNeeded('_firmStaff', clientRes.item._firm));
      }
    });
    dispatch(clientUserActions.fetchListIfNeeded('_client', match.params.clientId)).then(cuRes => {
      if(cuRes.success) {
        cuRes.list.forEach(cu => {
          dispatch(addressActions.fetchListIfNeeded('_user', cu._user));
          dispatch(phoneNumberActions.fetchListIfNeeded('_user', cu._user));
        })
      }
    });
    dispatch(staffClientActions.fetchListIfNeeded('_client', match.params.clientId)).then(staffRes => {
      if(staffRes.success) {
        staffRes.list.forEach(s => {
          dispatch(addressActions.fetchListIfNeeded('_user', s._user));
          dispatch(phoneNumberActions.fetchListIfNeeded('_user', s._user));
        })
      }
    });
    dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(userActions.fetchListIfNeeded('_clientStaff', match.params.clientId));
  }

  render() {
    const { 
      clientStore
      , clientUserStore
      , firmStore
      , loggedInUser
      , match
    } = this.props;

    // client & firm 
    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();

    const clientUserListItems = clientUserStore.util.getList('_client', match.params.clientId)

    const loggedInClientUser = clientUserListItems ? clientUserListItems.filter(cu => cu._user == loggedInUser._id)[0] : null

    const isEmpty = (
      !selectedClient
      || !selectedClient._id
      || clientStore.selected.didInvalidate
      || firmStore.selected.didInvalidate
      || !selectedFirm
      || !selectedFirm._id
    );

    const isFetching = (
      clientStore.selected.isFetching
      || firmStore.selected.isFetching
    )

    return (
      <PortalLayout>
        <Helmet>
          <title>Account Info</title>
        </Helmet>
        { isEmpty ?
          ( isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div> 
            : 
            <div className="hero three-quarter ">
              <div className="yt-container slim">
                <h2>Hmm.  Something's wrong here. </h2>
                <p>Either this account no longer exists, or you don't have permission to access. Please contact <a href={`mailto:${brandingName.email.support}`}>{brandingName.email.support}</a>.</p>
              </div>
            </div>
          )
          : isFetching ? 
          /** Still fetching things */
          <div className="-loading-hero">
            <div className="u-centerText">
              <div className="loading"></div>
            </div>
          </div> 
          : 
          <div>
            <h1>{selectedClient.name}</h1>
            <div className="tab-bar-nav">
              <ul className="navigation">
                <li>
                  <NavLink exact to={`/portal/${match.params.clientId}/account`}>Overview</NavLink>
                </li>
                <li>
                  <NavLink to={`/portal/${match.params.clientId}/account/users`}>Users</NavLink>
                </li>
                <li>
                  <NavLink to={`/portal/${match.params.clientId}/account/me`}>Me</NavLink>
                </li>
              </ul>
            </div>
            <Switch>
              <YTRoute clientUser={true} exact path="/portal/:clientId/account" render={() =>
                <ClientSettingsOverview
                  clientId={match.params.clientId}
                />
              }/>
              <YTRoute clientUser={true} path="/portal/:clientId/account/users" render={() => 
                <AccountUsers
                  clientId={match.params.clientId}
                />
              }/>
              <YTRoute clientUser={true} path="/portal/:clientId/account/me" render={() => 
                <ClientUserSettings
                  loggedInClientUser={loggedInClientUser}
                />
              }/>
            </Switch>
          </div>
        }
      </PortalLayout>
    )
  }
}

AccountInfo.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    addressStore: store.address 
    , clientStore: store.client 
    , clientUserStore: store.clientUser 
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , phoneNumberStore: store.phoneNumber
    , staffStore: store.staff 
    , staffClientStore: store.staffClient 
    , userStore: store.user 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AccountInfo)
);
