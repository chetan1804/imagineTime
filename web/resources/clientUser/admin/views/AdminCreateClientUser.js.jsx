/**
 * View component for /admin/client-users/new
 *
 * Creates a new clientUser from a copy of the defaultItem in the clientUser reducer
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
import * as clientUserActions from '../../clientUserActions';
import * as clientActions from '../../../client/clientActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientUserForm from '../components/AdminClientUserForm.js.jsx';
import AdminClientUserLayout from '../components/AdminClientUserLayout.js.jsx';

// import utils 
import { routeUtils } from '../../../../global/utils';

class AdminCreateClientUser extends Binder {
  constructor(props) {
    super(props);
    console.log(routeUtils.objectFromQueryString(this.props.location.search))
    this.state = {
      clientUser: _.cloneDeep(this.props.defaultClientUser.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , formHelpers: {
        clientId: this.props.location.search ? routeUtils.objectFromQueryString(this.props.location.search)['client'] : null 
      }
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the clientUser
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(clientActions.fetchListIfNeeded('all'));
    dispatch(clientUserActions.fetchDefaultClientUser());
    dispatch(userActions.fetchListIfNeeded('all'));
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      clientUser: _.cloneDeep(nextProps.defaultClientUser.obj)
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
    const { clientStore, dispatch, history } = this.props;
    e.preventDefault();
    let newClientUser = {...this.state.clientUser};
    if(this.state.formHelpers.clientId) {
      newClientUser._client = this.state.formHelpers.clientId;
    }
    newClientUser._firm = clientStore.byId[newClientUser._client]._firm;
    dispatch(clientUserActions.sendCreateClientUser(newClientUser)).then(clientUserRes => {
      if(clientUserRes.success) {
        dispatch(clientUserActions.invalidateList());
        if(this.state.formHelpers.clientId) {
          dispatch(clientUserActions.invalidateList('_client', this.state.formHelpers.clientId))
          history.push(`/admin/clients/${this.state.formHelpers.clientId}`)
        } else {
          history.push(`/admin/client-users/${clientUserRes.item._id}`)
        }
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { 
      clientStore
      , location
      , match 
      , userStore 
    } = this.props;
    const { clientUser, formHelpers } = this.state;
    const isEmpty = (!clientUser);
   
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

    const userList = userStore.lists ? userStore.lists.all : null;
    const userListItems = userStore.util.getList("all");

    const usersEmpty = (
      !userListItems
      || !userList
    );

    const usersFetching = (
      !userListItems
      || !userList
      || userList.isFetching
    )

    return (
      <AdminClientUserLayout>
        <Helmet>
          <title>Create Client User</title>
        </Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          <h2> Loading...</h2>
          :
          <AdminClientUserForm
            clients={clientListItems}
            clientUser={clientUser}
            cancelLink={formHelpers.clientId ? `/admin/clients/${formHelpers.clientId}` : "/admin/client-users"}
            formHelpers={formHelpers}
            formTitle="Create Client User"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            users={userListItems}
          />
        }
      </AdminClientUserLayout>
    )
  }
}

AdminCreateClientUser.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    defaultClientUser: store.clientUser.defaultItem
    , clientStore: store.client 
    , userStore: store.user 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminCreateClientUser)
);
