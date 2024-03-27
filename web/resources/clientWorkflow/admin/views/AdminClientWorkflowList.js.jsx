/**
 * View component for /admin/client-workflows
 *
 * Generic clientWorkflow list view. Defaults to 'all' with:
 * this.props.dispatch(clientWorkflowActions.fetchListIfNeeded());
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
import * as clientWorkflowActions from '../../clientWorkflowActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientWorkflowLayout from '../components/AdminClientWorkflowLayout.js.jsx';
import AdminClientWorkflowListItem from '../components/AdminClientWorkflowListItem.js.jsx';

class ClientWorkflowList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(clientWorkflowActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { location, clientWorkflowStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the clientWorkflowList meta info here so we can reference 'isFetching'
    const clientWorkflowList = clientWorkflowStore.lists ? clientWorkflowStore.lists.all : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual clientWorkflow objetcs
     */
    const clientWorkflowListItems = clientWorkflowStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !clientWorkflowListItems
      || !clientWorkflowList
    );

    const isFetching = (
      !clientWorkflowListItems
      || !clientWorkflowList
      || clientWorkflowList.isFetching
    )

    return (
      <AdminClientWorkflowLayout>
        <Helmet><title>Admin ClientWorkflow List</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h1> ClientWorkflow List </h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="admin-table-wrapper">
              <Link to={'/admin/client-workflows/new'}> New ClientWorkflow</Link>
              <table className="yt-table striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Last modified</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clientWorkflowListItems.map((clientWorkflow, i) =>
                    <AdminClientWorkflowListItem key={clientWorkflow._id + i} clientWorkflow={clientWorkflow} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      </AdminClientWorkflowLayout>
    )
  }
}

ClientWorkflowList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    clientWorkflowStore: store.clientWorkflow
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientWorkflowList)
);
