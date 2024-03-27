/**
 * View component for /admin/staff-clients/new
 *
 * Creates a new staffClient from a copy of the defaultItem in the staffClient reducer
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

// import utils 
import { routeUtils } from '../../../../global/utils';

class AdminCreateStaffClient extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      staffClient: _.cloneDeep(this.props.defaultStaffClient.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , formHelpers: {
        clientId: this.props.location.search ? routeUtils.objectFromQueryString(this.props.location.search)['client'] : null 
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
    const { dispatch } = this.props;
    /**
     * NOTE: this is quick and dirty to get things up and running.  
     * will need to be cleaned up for production when the time comes. 
     */
    dispatch(clientActions.fetchListIfNeeded('all'));
    dispatch(firmActions.fetchListIfNeeded('all'));
    dispatch(staffClientActions.fetchDefaultStaffClient());
    dispatch(userActions.fetchListIfNeeded('all'));
    dispatch(staffActions.fetchListIfNeeded('all'));
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      staffClient: _.cloneDeep(nextProps.defaultStaffClient.obj)

    })
  }
  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
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

    dispatch(staffClientActions.sendCreateStaffClient(newStaffClient)).then(staffClientRes => {
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

    return (
      <AdminStaffClientLayout>
        <Helmet>
          <title>Create Staff Client</title>
        </Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          <h2> Loading...</h2>
          :
          <AdminStaffClientForm
            clients={clientListItems}
            staffClient={staffClient}
            cancelLink={formHelpers.clientId ? `/admin/clients/${formHelpers.clientId}` : "/admin/staff-clients"}
            formHelpers={formHelpers}
            formTitle="Create Staff Client"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            staff={staff}
          />
        }
      </AdminStaffClientLayout>
    )
  }
}

AdminCreateStaffClient.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    defaultStaffClient: store.staffClient.defaultItem
    , clientStore: store.client 
    , firmStore: store.firm 
    , staffStore: store.staff 
    , userStore: store.user 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminCreateStaffClient)
);
