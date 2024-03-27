/**
 * View component for /admin/addresses
 *
 * Generic address list view. Defaults to 'all' with:
 * this.props.dispatch(addressActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as addressActions from '../../addressActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminAddressLayout from '../components/AdminAddressLayout.js.jsx';
import AdminAddressListItem from '../components/AdminAddressListItem.js.jsx';

class AddressList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(addressActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { location, addressStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the addressList meta info here so we can reference 'isFetching'
    const addressList = addressStore.lists ? addressStore.lists.all : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual address objetcs
     */
    const addressListItems = addressStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !addressListItems
      || !addressList
    );

    const isFetching = (
      !addressListItems
      || !addressList
      || addressList.isFetching
    )

    return (
      <AdminAddressLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h1> Address List </h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="admin-table-wrapper">
              <Link to={'/admin/addresses/new'}> New Address</Link>
              <table className="yt-table striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Last modified</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {addressListItems.map((address, i) =>
                    <AdminAddressListItem key={address._id + i} address={address} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      </AdminAddressLayout>
    )
  }
}

AddressList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    addressStore: store.address
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AddressList)
);
