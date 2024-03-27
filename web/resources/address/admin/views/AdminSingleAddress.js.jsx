/**
 * View component for /admin/addresses/:addressId
 *
 * Displays a single address from the 'byId' map in the address reducer
 * as defined by the 'selected' property
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


class AdminSingleAddress extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(addressActions.fetchSingleIfNeeded(match.params.addressId));
  }

  render() {
    const { location, addressStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual address object from the map
     */
    const selectedAddress = addressStore.selected.getItem();

    const isEmpty = (
      !selectedAddress
      || !selectedAddress._id
      || addressStore.selected.didInvalidate
    );

    const isFetching = (
      addressStore.selected.isFetching
    )

    return (
      <AdminAddressLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h3> Single Address </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedAddress.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the Address would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update Address </Link>
          </div>
        }
      </AdminAddressLayout>
    )
  }
}

AdminSingleAddress.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    addressStore: store.address
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminSingleAddress)
);
