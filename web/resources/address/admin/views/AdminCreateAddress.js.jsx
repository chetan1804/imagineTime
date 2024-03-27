/**
 * View component for /admin/addresses/new
 *
 * Creates a new address from a copy of the defaultItem in the address reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as addressActions from '../../addressActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminAddressForm from '../components/AdminAddressForm.js.jsx';
import AdminAddressLayout from '../components/AdminAddressLayout.js.jsx';

class AdminCreateAddress extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      address: _.cloneDeep(this.props.defaultAddress.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the address
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(addressActions.fetchDefaultAddress());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      address: _.cloneDeep(nextProps.defaultAddress.obj)

    })
  }
  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState});
  }


  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(addressActions.sendCreateAddress(this.state.address)).then(addressRes => {
      if(addressRes.success) {
        dispatch(addressActions.invalidateList());
        history.push(`/admin/addresses/${addressRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location, match } = this.props;
    const { address, formHelpers } = this.state;
    const isEmpty = (!address || address.name === null || address.name === undefined);
    return (
      <AdminAddressLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          <h2> Loading...</h2>
          :
          <AdminAddressForm
            address={address}
            cancelLink="/admin/addresses"
            formHelpers={formHelpers}
            formTitle="Create Address"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            />
        }
      </AdminAddressLayout>
    )
  }
}

AdminCreateAddress.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    defaultAddress: store.address.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminCreateAddress)
);
