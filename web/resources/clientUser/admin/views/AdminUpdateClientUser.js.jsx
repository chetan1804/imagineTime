/**
 * View component for /admin/client-users/:clientUserId/update
 *
 * Updates a single clientUser from a copy of the selcted clientUser
 * as defined in the clientUser reducer
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

class AdminUpdateClientUser extends Binder {
  constructor(props) {
    super(props);
    const { match, clientUserStore } = this.props;
    this.state = {
      clientUser: clientUserStore.byId[match.params.clientUserId] ?  _.cloneDeep(clientUserStore.byId[match.params.clientUserId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {
        clientId: match.params.clientId 
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
    const { dispatch, match } = this.props;
    dispatch(clientActions.fetchListIfNeeded('all'));
    dispatch(clientUserActions.fetchSingleIfNeeded(match.params.clientUserId))
    dispatch(userActions.fetchListIfNeeded('all'));
  }

  componentWillReceiveProps(nextProps) {
    const { match, clientUserStore } = nextProps;
    this.setState({
      clientUser: clientUserStore.byId[match.params.clientUserId] ?  _.cloneDeep(clientUserStore.byId[match.params.clientUserId]) : {}
      // NOTE: ^ we don't want to actually change the store's clientUser, just use a copy
    })
  }

  _handleFormChange(e) {
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
    dispatch(clientUserActions.sendUpdateClientUser(newClientUser)).then(clientUserRes => {
      if(clientUserRes.success) {
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
      , clientUserStore
      , userStore 
    } = this.props;
    const { clientUser, formHelpers } = this.state;

    const selectedClientUser = clientUserStore.selected.getItem();
    const clientList = clientStore.lists ? clientStore.lists.all : null;
    const clientListItems = clientStore.util.getList("all");
    const userList = userStore.lists ? userStore.lists.all : null;
    const userListItems = userStore.util.getList("all");

    const isEmpty = (
      !clientUser
      || !clientUser._id
    );

    const isFetching = (
      !clientUserStore.selected.id
      || clientUserStore.selected.isFetching
    )

    return  (
      <AdminClientUserLayout>
        <Helmet>
          <title>Update Client User</title>
        </Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <AdminClientUserForm
            clients={clientListItems}
            clientUser={clientUser}
            cancelLink={formHelpers.clientId ? `/admin/clients/${formHelpers.clientId}` : `/admin/client-users/${clientUser._id}`}
            formHelpers={formHelpers}
            formTitle="Update Client User"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            users={userListItems}
          />
        }
      </AdminClientUserLayout>
    )
  }
}

AdminUpdateClientUser.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  return {
    clientUserStore: store.clientUser
    , clientStore: store.client 
    , userStore: store.user 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminUpdateClientUser)
);
