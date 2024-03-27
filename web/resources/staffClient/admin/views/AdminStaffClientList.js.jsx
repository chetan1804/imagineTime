/**
 * View component for /admin/staff-clients
 *
 * Generic staffClient list view. Defaults to 'all' with:
 * this.props.dispatch(staffClientActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as staffClientActions from '../../staffClientActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminStaffClientLayout from '../components/AdminStaffClientLayout.js.jsx';
import AdminStaffClientListItem from '../components/AdminStaffClientListItem.js.jsx';

class StaffClientList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(staffClientActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { location, staffClientStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the staffClientList meta info here so we can reference 'isFetching'
    const staffClientList = staffClientStore.lists ? staffClientStore.lists.all : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual staffClient objetcs
     */
    const staffClientListItems = staffClientStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !staffClientListItems
      || !staffClientList
    );

    const isFetching = (
      !staffClientListItems
      || !staffClientList
      || staffClientList.isFetching
    )

    return (
      <AdminStaffClientLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h1> Staff Client List </h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="admin-table-wrapper">
              <Link to={'/admin/staff-clients/new'}> New Staff Client</Link>
              <table className="yt-table striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Last modified</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {staffClientListItems.map((staffClient, i) =>
                    <AdminStaffClientListItem key={staffClient._id + i} staffClient={staffClient} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      </AdminStaffClientLayout>
    )
  }
}

StaffClientList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    staffClientStore: store.staffClient
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(StaffClientList)
);
