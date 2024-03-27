/**
 * Reusable component for displaying and editing addresses.
 * 
 * Example:
    <AddressCard
      address={selectedAddress}
      editable={true} // defaults to false.
    />
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


// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import AddressEditor from './AddressEditor.js.jsx';


class AddressCard extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      isEditing: false
    }
    this._bind(
      '_handleEditAddress'
    )
  }

  _handleEditAddress() {
    this.setState({isEditing: true})
  }

  render() {
    const {
      address
      , editable
      , isPrimary 
      , makePrimary 
      , width
    } = this.props;

    const { isEditing } = this.state;
    const isEmpty = !address;

    const cardClass = classNames(
      'address-card-wrapper'
      , { '-editable': editable }
    )

    return (
      isEmpty ?
      <div className="u-centerText">
        <div className="loading -small"></div>
      </div>
      :
      isEditing ?
      <AddressEditor
        addressId={address._id}
        fromCard={true}
        onSubmit={() => this.setState({isEditing: false})}
        editorClasses="-quick-view"
      />
      :
      <div className={cardClass}>
        <div className="-address">
          <p>{`${address.street1}${address.street2 ? `, ${address.street2}` : ''}`}

          </p>
          <p>{`${address.city ? address.city : ''}, ${address.state ? address.state : ''} ${address.postal ? address.postal : ''}`}</p>
          <p>{address.country ? address.country : ''}</p>
          {isPrimary ? " (Primary)" : null}
        </div>
        { editable ?
          <div className="-edit-btns" style={{width: width}}>
            <small
              className="action-link -edit-phone-link"
              onClick={() => this._handleEditAddress()}
            >
              Edit
            </small>
            { !isPrimary && makePrimary ?
              <small
                className="action-link -edit-phone-link"
                onClick={() => makePrimary(address._id)}
              >
                Make Primary
              </small>
              :
              null 
            }
          </div>
          :
          null
        }
      </div>
    )
  }
}

AddressCard.propTypes = {
  address: PropTypes.object.isRequired
  , editable: PropTypes.bool
  , isPrimary: PropTypes.bool 
  , makePrimary: PropTypes.func // should be a function that accepts address._id 
}

AddressCard.defaultProps = {
  editable: false
  , isPrimary: false 
  , makePrimary: null 
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
  )(AddressCard)
);
