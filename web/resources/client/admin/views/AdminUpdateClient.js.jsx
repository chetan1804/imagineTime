/**
 * View component for /admin/clients/:clientId/update
 *
 * Updates a single client from a copy of the selcted client
 * as defined in the client reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import { Helmet } from 'react-helmet';

// import actions
import * as clientActions from '../../clientActions';
import * as firmActions from '../../../firm/firmActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientForm from '../components/AdminClientForm.js.jsx';
import AdminClientLayout from '../components/AdminClientLayout.js.jsx';

class AdminUpdateClient extends Binder {
  constructor(props) {
    super(props);
    const { match, clientStore } = this.props;
    this.state = {
      client: clientStore.byId[match.params.clientId] ?  _.cloneDeep(clientStore.byId[match.params.clientId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the client
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId))
    dispatch(firmActions.fetchListIfNeeded('all'));
  }

  componentWillReceiveProps(nextProps) {
    const { match, clientStore } = nextProps;
    this.setState({
      client: clientStore.byId[match.params.clientId] ?  _.cloneDeep(clientStore.byId[match.params.clientId]) : {}
      // NOTE: ^ we don't want to actually change the store's client, just use a copy
    })
  }

  _handleFormChange(e) {
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState});
  }

  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(clientActions.sendUpdateClient(this.state.client)).then(clientRes => {
      if(clientRes.success) {
        history.push(`/admin/clients/${clientRes.item._id}`)
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
    } = this.props;
    const { client, formHelpers } = this.state;

    const selectedClient = clientStore.selected.getItem();

    const isEmpty = (
      !client
      || !client._id
    );

    const isFetching = (
      !clientStore.selected.id
      || clientStore.selected.isFetching
    )
    const firmList = firmStore.lists ? firmStore.lists.all : null;
    const firmListItems = firmStore.util.getList("all");

    const firmsEmpty = (
      !firmListItems
      || !firmList
    );

    const firmsFetching = (
      !firmListItems
      || !firmList
      || firmList.isFetching
    )
    return  (
      <AdminClientLayout>
        <Helmet>
          <title>Update Client</title>
        </Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <AdminClientForm
            client={client}
            cancelLink={`/admin/clients/${client._id}`}
            firms={firmListItems}
            formHelpers={formHelpers}
            formTitle="Update Client"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </AdminClientLayout>
    )
  }
}

AdminUpdateClient.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  return {
    clientStore: store.client
    , firmStore: store.firm
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminUpdateClient)
);
