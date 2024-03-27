/**
 * View component for /admin/client-task-responses
 *
 * Generic clientTaskResponse list view. Defaults to 'all' with:
 * this.props.dispatch(clientTaskResponseActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as clientTaskResponseActions from '../../clientTaskResponseActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientTaskResponseLayout from '../components/AdminClientTaskResponseLayout.js.jsx';
import AdminClientTaskResponseListItem from '../components/AdminClientTaskResponseListItem.js.jsx';

class ClientTaskResponseList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(clientTaskResponseActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { location, clientTaskResponseStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the clientTaskResponseList meta info here so we can reference 'isFetching'
    const clientTaskResponseList = clientTaskResponseStore.lists ? clientTaskResponseStore.lists.all : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual clientTaskResponse objetcs
     */
    const clientTaskResponseListItems = clientTaskResponseStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !clientTaskResponseListItems
      || !clientTaskResponseList
    );

    const isFetching = (
      !clientTaskResponseListItems
      || !clientTaskResponseList
      || clientTaskResponseList.isFetching
    )

    return (
      <AdminClientTaskResponseLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h1> ClientTask Response List </h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="admin-table-wrapper">
              <Link to={'/admin/client-task-responses/new'}> New ClientTask Response</Link>
              <table className="yt-table striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Last modified</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clientTaskResponseListItems.map((clientTaskResponse, i) =>
                    <AdminClientTaskResponseListItem key={clientTaskResponse._id + i} clientTaskResponse={clientTaskResponse} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      </AdminClientTaskResponseLayout>
    )
  }
}

ClientTaskResponseList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    clientTaskResponseStore: store.clientTaskResponse
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientTaskResponseList)
);
