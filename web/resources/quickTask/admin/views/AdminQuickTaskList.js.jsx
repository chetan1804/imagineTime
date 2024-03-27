/**
 * View component for /quick-tasks
 *
 * Generic quick task list view. Defaults to 'all' with:
 * this.props.dispatch(quickTaskActions.fetchListIfNeeded());
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
import * as quickTaskActions from '../../quickTaskActions';
import * as firmActions from '../../../firm/firmActions'; 
import * as clientActions from '../../../client/clientActions'; 

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminQuickTaskLayout from '../components/AdminQuickTaskLayout.js.jsx';
import AdminQuickTaskListItem from '../components/AdminQuickTaskListItem.js.jsx';

class AdminQuickTaskList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(quickTaskActions.fetchListIfNeeded('all')); // defaults to 'all'
    this.props.dispatch(firmActions.fetchListIfNeeded('all')); 
    this.props.dispatch(clientActions.fetchListIfNeeded('all')); 
  }

  render() {
    const { location, quickTaskStore, firmStore, clientStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the quickTaskList meta info here so we can reference 'isFetching'
    const quickTaskList = quickTaskStore.lists ? quickTaskStore.lists.all : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual quick task objetcs
     */
    const quickTaskListItems = quickTaskStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !quickTaskListItems
      || !quickTaskList
    );

    const isFetching = (
      !quickTaskListItems
      || !quickTaskList
      || quickTaskList.isFetching
    )

    return (
      <AdminQuickTaskLayout>
        <Helmet><title>Admin Quick Task List</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h1> Quick Task List </h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="admin-table-wrapper">
              <table className="yt-table striped">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Firm</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {quickTaskListItems.map((quickTask, i) =>
                    <AdminQuickTaskListItem 
                      key={quickTask._id} 
                      quickTask={quickTask} 
                      client={clientStore.byId[quickTask._client]}
                      firm={firmStore.byId[quickTask._firm]}
                    />
                      
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      </AdminQuickTaskLayout>
    )
  }
}

AdminQuickTaskList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    quickTaskStore: store.quickTask
    , firmStore: store.firm
    , clientStore: store.client
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminQuickTaskList)
);
