/**
 * Reusable component for displaying and editing phone numbers.
 * 
 * Example:
    <PhoneNumberCard
      editable={true} // defaults to false.
      phoneNumber={selectedPhoneNumber}
    />
 * 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import { formatPhoneNumber } from 'react-phone-number-input'

// import actions


// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import PhoneNumberEditor from './PhoneNumberEditor.js.jsx';


class PhoneNumberCard extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      isEditing: false
    }
    this._bind(
      '_handleEditPhone'
    )
  }

  _handleEditPhone() {
    this.setState({isEditing: true})
  }

  render() {
    const {
      editable
      , phoneNumber
    } = this.props;

    const { isEditing } = this.state;
    const isEmpty = !phoneNumber;

    return (
      isEmpty ?
      <div className="u-centerText">
        <div className="loading -small"></div>
      </div>
      :
      isEditing ?
      <PhoneNumberEditor
        phoneNumberId={phoneNumber._id}
        onSubmit={() => this.setState({isEditing: false})}
        editorClasses="-quick-view"
      />
      :
      <div className="yt-row phone-card-wrapper">
        <div className="yt-col">
          <p>{`${_.startCase(phoneNumber.type)}: ${formatPhoneNumber(phoneNumber.number, 'National') ? formatPhoneNumber(phoneNumber.number, 'National') : phoneNumber.number}`}
          { editable ?
            <small
              className="action-link -edit-phone-link"
              onClick={this._handleEditPhone}
            >
              Edit
            </small>
            :
            null
          }
          </p>
        </div>
      </div>
    )
  }
}

PhoneNumberCard.propTypes = {
  phoneNumber: PropTypes.object.isRequired
  , editable: PropTypes.bool
}

PhoneNumberCard.defaultProps = {
  editable: false
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
  )(PhoneNumberCard)
);
