/**
 * View component for /admin/addresses/:addressId/update
 *
 * Updates a single address from a copy of the selcted address
 * as defined in the address reducer
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

class AdminUpdateAddress extends Binder {
  constructor(props) {
    super(props);
    const { match, addressStore } = this.props;
    this.state = {
      address: addressStore.byId[match.params.addressId] ?  _.cloneDeep(addressStore.byId[match.params.addressId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
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
    const { dispatch, match } = this.props;
    dispatch(addressActions.fetchSingleIfNeeded(match.params.addressId))
  }

  componentWillReceiveProps(nextProps) {
    const { match, addressStore } = nextProps;
    this.setState({
      address: addressStore.byId[match.params.addressId] ?  _.cloneDeep(addressStore.byId[match.params.addressId]) : {}
      // NOTE: ^ we don't want to actually change the store's address, just use a copy
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
    dispatch(addressActions.sendUpdateAddress(this.state.address)).then(addressRes => {
      if(addressRes.success) {
        history.push(`/admin/addresses/${addressRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , addressStore
    } = this.props;
    const { address, formHelpers } = this.state;

    const selectedAddress = addressStore.selected.getItem();

    const isEmpty = (
      !address
      || !address._id
    );

    const isFetching = (
      !addressStore.selected.id
      || addressStore.selected.isFetching
    )

    return  (
      <AdminAddressLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <AdminAddressForm
            address={address}
            cancelLink={`/admin/addresses/${address._id}`}
            formHelpers={formHelpers}
            formTitle="Update Address"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </AdminAddressLayout>
    )
  }
}

AdminUpdateAddress.propTypes = {
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
  )(AdminUpdateAddress)
);
