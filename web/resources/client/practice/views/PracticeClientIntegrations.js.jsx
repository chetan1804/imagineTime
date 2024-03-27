/**
 * View component for /firm/:firmId/clients/:clientId/integrations
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries


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


// import resource components
import ClientSettingsLayout from '../components/ClientSettingsLayout.js.jsx';

class PracticeClientIntegrations extends Binder {
  constructor(props) {
    super(props);
    this.state = {

    }
    this._bind(

    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    // These two fetches should live on every top-level practice view.
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));

    dispatch(addressActions.fetchListIfNeeded('_client', match.params.clientId)); // client's addresses 
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
    dispatch(clientUserActions.fetchListIfNeeded('_client', match.params.clientId)).then(cuRes => {
      if(cuRes.success) {
        cuRes.list.forEach(cu => {
          dispatch(addressActions.fetchListIfNeeded('_user', cu._user));
          dispatch(phoneNumberActions.fetchListIfNeeded('_user', cu._user));
        })
      }
    });
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(phoneNumberActions.fetchListIfNeeded('_client', match.params.clientId)); // client's phone numbers 
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(staffClientActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));
  }

  render() {
    const {
      addressStore
      , clientStore 
      , clientUserStore 
      , firmStore
      , location 
      , loggedInUser
      , match 
      , staffStore 
      , staffClientStore 
      , userStore 
    } = this.props;
    
    // client & firm 
    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();

    // clientUsers(contacts) list 
    const clientUserList = clientUserStore.lists && clientUserStore.lists._client ? clientUserStore.lists._client[match.params.clientId] : null;
    const clientUserListItems = clientUserStore.util.getList('_client', match.params.clientId);

    // staffClient  list 
    const staffClientList = staffClientStore.lists && staffClientStore.lists._client ? staffClientStore.lists._client[match.params.clientId] : null;
    const staffClientListItems = staffClientStore.util.getList('_client', match.params.clientId);

    // activity  list 
    const addressList = addressStore.lists && addressStore.lists._client ? addressStore.lists._client[match.params.clientId] : null;
    const addressListItems = addressStore.util.getList('_client', match.params.clientId);
   
    const isEmpty = (
      !selectedClient
      || !selectedClient._id
      || clientStore.selected.didInvalidate
      || firmStore.selected.didInvalidate
      || !selectedFirm
      || !selectedFirm._id
    );

    const isFetching = (
      !addressListItems
      || !addressList
      || addressList.isFetching
      || clientStore.selected.isFetching
      || !clientUserListItems
      || !clientUserList
      || clientUserList.isFetching
      || firmStore.selected.isFetching
      || !staffClientListItems
      || !staffClientList
      || staffClientList.isFetching
    )
    return (
      <ClientSettingsLayout>
        <div className="hero -empty-hero">
          <div className="u-centerText">
            <h3><em>Coming soon.</em></h3>
            <h2>Third-party Integrations</h2>
            <p>Connect to your client's QBO, T-Sheets & more</p>
          </div>
        </div>
      </ClientSettingsLayout>
    )
  }
}

PracticeClientIntegrations.propTypes = {
  dispatch: PropTypes.func.isRequired
}

PracticeClientIntegrations.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    addressStore: store.activity 
    , clientStore: store.client 
    , clientUserStore: store.clientUser 
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , staffStore: store.staff 
    , staffClientStore: store.staffClient 
    , userStore: store.user 
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PracticeClientIntegrations)
);
