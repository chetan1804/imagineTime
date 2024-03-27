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

import { Helmet } from 'react-helmet'; 

// import actions
import * as clientActions from '../../clientActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientLayout from '../components/AdminClientLayout.js.jsx';
import AdminClientListItem from '../components/AdminClientListItem.js.jsx';

class AdminClientList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(clientActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { location, clientStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the clientList meta info here so we can reference 'isFetching'
    let clientList = clientStore.lists ? clientStore.lists.all : null;
    
    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual client objetcs
     */
    let clientListItems = clientStore.util.getList("all");

    clientListItems = _.orderBy(clientListItems, [item => item.name.toLowerCase()], ['asc']);

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !clientListItems
      || !clientList
    );

    const isFetching = (
      !clientListItems
      || !clientList
      || clientList.isFetching
    )

    return (
      <AdminClientLayout>
        <Helmet><title>Admin Client List</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h1> Client List </h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="admin-table-wrapper">
              <Link to={'/admin/clients/new'}> New Client</Link>
              <table className="yt-table striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Last modified</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clientListItems.map((client, i) =>
                    <AdminClientListItem key={client._id + '_' + i} client={client} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      </AdminClientLayout>
    )
  }
}

AdminClientList.propTypes = {
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
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminClientList)
);
