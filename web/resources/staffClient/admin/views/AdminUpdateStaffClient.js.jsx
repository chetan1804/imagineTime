/**
 * View component for /admin/staff-clients/:staffClientId/update
 *
 * Updates a single staffClient from a copy of the selcted staffClient
 * as defined in the staffClient reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

import { Helmet } from 'react-helmet'; 

// import third-party libraries
import _ from 'lodash';

// import actions
import * as clientActions from '../../../client/clientActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as staffClientActions from '../../staffClientActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminStaffClientForm from '../components/AdminStaffClientForm.js.jsx';
import AdminStaffClientLayout from '../components/AdminStaffClientLayout.js.jsx';

class AdminUpdateStaffClient extends Binder {
  constructor(props) {
    super(props);
    const { match, staffClientStore } = this.props;
    this.state = {
      staffClient: staffClientStore.byId[match.params.staffClientId] ?  _.cloneDeep(staffClientStore.byId[match.params.staffClientId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {
        clientId: match.params.clientId
      }
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the staffClient
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(staffClientActions.fetchSingleIfNeeded(match.params.staffClientId));
    dispatch(clientActions.fetchListIfNeeded('all'));
    dispatch(firmActions.fetchListIfNeeded('all'));
    dispatch(staffClientActions.fetchDefaultStaffClient());
    dispatch(userActions.fetchListIfNeeded('all'));
    dispatch(staffActions.fetchListIfNeeded('all'));
  }

  componentWillReceiveProps(nextProps) {
    const { match, staffClientStore } = nextProps;
    this.setState({
      staffClient: staffClientStore.byId[match.params.staffClientId] ?  _.cloneDeep(staffClientStore.byId[match.params.staffClientId]) : {}
      // NOTE: ^ we don't want to actually change the store's staffClient, just use a copy
    })
  }

  _handleFormChange(e) {
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState});
  }

  _handleFormSubmit(e) {
    const { clientStore, dispatch, history, staffStore } = this.props;
    e.preventDefault();
    let newStaffClient = {...this.state.staffClient};
    if(this.state.formHelpers.clientId) {
      newStaffClient._client = this.state.formHelpers.clientId;
    }

    newStaffClient._firm = clientStore.byId[newStaffClient._client]._firm;
    newStaffClient._user = staffStore.byId[newStaffClient._staff]._user; 

    dispatch(staffClientActions.sendUpdateStaffClient(newStaffClient)).then(staffClientRes => {
      if(staffClientRes.success) {
        dispatch(staffClientActions.invalidateList());
        if(this.state.formHelpers.clientId) {
          dispatch(staffClientActions.invalidateList('_client', this.state.formHelpers.clientId))
          history.push(`/admin/clients/${this.state.formHelpers.clientId}`)
        } else {
          history.push(`/admin/staff-clients/${staffClientRes.item._id}`)
        }
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { 
      clientStore
      , firmStore 
      , location
      , match 
      , staffStore 
      , userStore 
    } = this.props;
    const { staffClient, formHelpers } = this.state;
    const isEmpty = (!staffClient);
    const clientList = clientStore.lists ? clientStore.lists.all : null;
    const clientListItems = clientStore.util.getList("all");

    const clientsEmpty = (
      !clientListItems
      || !clientList
    );

    const clientsFetching = (
      !clientListItems
      || !clientList
      || clientList.isFetching
    )

    const staffList = staffStore.lists ? staffStore.lists.all : null;
    const staffListItems = staffStore.util.getList("all");

    const staffEmpty = (
      !staffListItems
      || !staffList
    );

    const staffFetching = (
      !staffListItems
      || !staffList
      || staffList.isFetching
    )
    
    let staff = !staffListItems ? [] : staffListItems.map(s => {
      let item = s;
      let username = userStore.byId[s._user] ? userStore.byId[s._user].username : '';
      let firm = firmStore.byId[s._firm] ? firmStore.byId[s._firm].name : '';
      item.displayName = username + " | " + firm; 
      return item;
    })

    let clients = !clientListItems ? [] : clientListItems.map(c => {
      let item = c;
      let firm = firmStore.byId[c._firm] ? firmStore.byId[c._firm].name : '';
      item.displayName = c.name + " | " + firm; 
      return item;
    })

    return  (
      <AdminStaffClientLayout>
        <Helmet>
          <title>Update Staff Client</title>
        </Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <AdminStaffClientForm
            clients={clientListItems}
            staffClient={staffClient}
            cancelLink={formHelpers.clientId ? `/admin/clients/${formHelpers.clientId}` : "/admin/staff-clients"}
            formHelpers={formHelpers}
            formTitle="Update Staff Client"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            staff={staff}
          />
        }
      </AdminStaffClientLayout>
    )
  }
}

AdminUpdateStaffClient.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  return {
    staffClientStore: store.staffClient
    , defaultStaffClient: store.staffClient.defaultItem
    , clientStore: store.client 
    , firmStore: store.firm 
    , staffStore: store.staff 
    , userStore: store.user 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminUpdateStaffClient)
);
