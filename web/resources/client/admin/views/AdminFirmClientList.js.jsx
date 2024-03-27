/**
 * View component for /admin/clients
 *
 * Generic client list view. Defaults to 'all' with:
 * this.props.dispatch(clientActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as clientActions from '../../clientActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientLayout from '../components/AdminClientLayout.js.jsx';
import AdminClientListItem from '../components/AdminClientListItem.js.jsx';

class AdminFirmClientList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      page: '1'
      , per: '50'
      , queryText: ''
      , sortBy: 'name'
    };
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches clientUser/contacts 
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
  }

  render() {
    const { 
      clientStore 
      , firmStore 
      , location
      , match 
      , staffStore 
      , subscriptionStore
      , userStore 
    } = this.props;

    const selectedFirm = firmStore.selected.getItem();

    const clientList = clientStore.lists && clientStore.lists._firm ? clientStore.lists._firm[match.params.firmId] : null;
    const clientListItems = clientStore.util.getList('_firm', match.params.firmId)

    const isEmpty = (
      !clientListItems
      || !clientList
      || !selectedFirm
      || !selectedFirm._id
      || firmStore.selected.didInvalidate
    );

    const isFetching = (
      !clientListItems
      || !clientList
      || clientList.isFetching
      || firmStore.selected.isFetching
    )

    return (
      <AdminClientLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> {selectedFirm.name} </h1>
            <div className="content-container">
              <div className="yt-row space-between">
                <p><strong>Client list</strong></p>
                <Link to={`/admin/firms/${match.params.firmId}/clients/new`}> New Client</Link>
              </div>
              <hr/>
              <div className="admin-table-wrapper">
                <table className="yt-table striped">
                  <caption>
                    { clientList.filter && clientList.filter.queryText && clientList.filter.queryText.length > 0 ?
                        <span>Filtered Clients &mdash; {clientList.items.length} of {clientList.pagination.total}</span>
                      :
                        <span>All Clients &mdash; {clientList.pagination ? clientList.pagination.total : 0}</span>
                    }
                    <div className="per-page-select u-pullRight">
                      <label>Show per page: </label>
                      <select
                        name="numPerPage"
                        onChange={(e) => this._setPerPage(e.target.value)}
                        value={this.state.per}
                        >
                        <option value={25}> 25 </option>
                        <option value={50}> 50 </option>
                        <option value={100}> 100 </option>
                      </select>
                    </div>
                  </caption>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Last modified</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientListItems.map((client, i) =>
                      <AdminClientListItem key={client._id + i} client={client} />
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      </AdminClientLayout>
    )
  }
}

AdminFirmClientList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    clientStore: store.client 
    , firmStore: store.firm
    , staffStore: store.staff 
    , subscriptionStore: store.subscription 
    , userStore: store.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminFirmClientList)
);
