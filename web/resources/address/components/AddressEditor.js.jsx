/**
 * A reusable component to add an address to any resource. If no addressId is passed,
 * it fetches its own default and saves the new address with the supplied pointers.
 * If an addressId is passed, it edits that address.
 * 
 * All it needs from the parent is a "pointers" object OR an addressId. It MUST have one.
 *  <AddressEditor
 *    pointers={{"_user": match.params.userId}}
 *    addressId={address._id}
 *    onSubmit={} // Called when an address is created/updated (to add the item to lists, etc...).
 *  />
 * 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import classNames from 'classnames';

// import actions
import * as addressActions from '../addressActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import AddressForm from './AddressForm.js.jsx';
import AddressCardForm from './AddressCardForm.js.jsx';

import { COUNTRIES, STATES, COUNTRY_STATES } from '../../../config/constants';

class AddressEditor extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      address: null
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    )
  }

  componentDidMount() {
    const { addressId, dispatch, match } = this.props;
    if(addressId) {
      dispatch(addressActions.fetchSingleIfNeeded(addressId)).then(addressRes => {
        if(addressRes.success) {
          this.setState({
            address: _.cloneDeep(addressRes.item)
          });
        }
      });
    } else if(this.props.pointers) {
      dispatch(addressActions.fetchDefaultAddress()).then(addressRes => {
        if(addressRes.success) {
          this.setState({
            address: _.cloneDeep(addressRes.defaultObj)
          });
        }
      });
    } else {
      alert("ERROR: Missing required props in AddressEditor.")
    }
  }

  _handleFormChange(e) {
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleFormSubmit(e) {
    const { dispatch } = this.props;
    const { address } = this.state;
    if(e) {
      e.preventDefault();
    }
    let newAddress = _.cloneDeep(address);
    if(!COUNTRY_STATES[newAddress.country]) {
      newAddress.state = null; 
    }
    if(this.props.addressId) {
      // the presence of addressId means we are editing an existing address.
      // send update address
      dispatch(addressActions.sendUpdateAddress(newAddress)).then(addressRes => {
        if(addressRes.success) {
          if(this.props.onSubmit) {
            this.props.onSubmit(addressRes.item._id)
          }
        } else {
          alert("ERROR - Check logs");
        }
      })
    } else if(this.props.pointers) {
      // if we aren't editing an existing address, we must have pointers to save the new one.
      // Add all pointers
      Object.keys(this.props.pointers).forEach(key => {
        newAddress[key] = this.props.pointers[key]
      })
      dispatch(addressActions.sendCreateAddress(newAddress)).then(addressRes => {
        if(addressRes.success) {
          if(this.props.onSubmit) {
            this.props.onSubmit(addressRes.item._id)
          }
        } else {
          alert("ERROR - Check logs");
        }
      })
    } else {
      // We have no addressId and no pointers. We can't do anything.
      alert("ERROR - Unable to save address.")
    }
  }

  render() {
    const { address } = this.state;
    const { editorClasses, fromCard } = this.props;

    const isEmpty = !address;

    const isDisabled = (
      !address
      || !address.street1
      || !address.city
      // || !address.state
      || !address.postal
      || !address.country
      || (COUNTRY_STATES[address.country] ? !address.state : false)
    )

    let editorClass = classNames(
      "address-editor"
      , editorClasses
    )

    if (isEmpty) {
      return (
        <div className="u-centerText">
          <div className="loading -small"></div>
        </div>
      )
    } else {
      return (
        // isEmpty ?
        // (
        //   <div className="u-centerText">
        //     <div className="loading -small"></div>
        //   </div>
        // )
        // :
        <div className={editorClass}>
          { fromCard ? 
            <AddressCardForm
              address={address}
              disabled={isDisabled}
              handleFormChange={this._handleFormChange}
              handleFormSubmit={this._handleFormSubmit}
              formType={this.props.pointers ? 'create' : 'update'}
              onCancel={() => this.props.onCancel ? this.props.onCancel() : this.props.onSubmit()}
            />
            :
            <AddressForm
              address={address}
              disabled={isDisabled}
              handleFormChange={this._handleFormChange}
              handleFormSubmit={this._handleFormSubmit}
              formType={this.props.pointers ? 'create' : 'update'}
              onCancel={() => this.props.onCancel ? this.props.onCancel() : this.props.onSubmit()}
            />
          }
        </div>
      )
    }
  }
}

AddressEditor.propTypes = {
  addressId: PropTypes.number
  , dispatch: PropTypes.func.isRequired
  , fromCard: PropTypes.bool
  , onSubmit: PropTypes.func.isRequired
  , pointers: PropTypes.object
}

AddressEditor.defaultProps = {
  addressId: null 
  , fromCard: false 
  , pointers: null 
}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {

  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(AddressEditor)
);
