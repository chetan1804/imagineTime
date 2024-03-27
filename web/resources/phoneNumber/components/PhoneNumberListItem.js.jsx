// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { formatPhoneNumber } from 'react-phone-number-input'

const PhoneNumberListItem = ({
  handleEditPhone
  , phoneNumber
  , isPrimary
  , setPrimary
  , key
}) => {
  const isEmpty = !phoneNumber;
  
  return (
    isEmpty ?
    <div className="u-centerText">
      <div className="loading -small"></div>
    </div>
    :
    <div key={key} className="yt-row phone-number-list-item">
      <div className="yt-col _25">
        <p>{`${_.startCase(phoneNumber.type)}:`}</p>
      </div>
      <div className="yt-col">
        <p>
          {/* If the number can't be correctly formatted, fall back to the actual stored value. */}
          {formatPhoneNumber(phoneNumber.number, 'National') ? formatPhoneNumber(phoneNumber.number, 'National') : phoneNumber.number}
          {phoneNumber.extNumber ? ` ${phoneNumber.extNumber}` : null}
          {isPrimary ? " (Primary)" : null}
          { handleEditPhone ? 
            <small
              className="action-link -edit-phone-link"
              onClick={() => handleEditPhone(phoneNumber._id)}
            >
              Edit
            </small>
            :
            null
          }
          {!isPrimary ?
            <small className="action-link -edit-phone-link" onClick={() => setPrimary()}>
              Set as Primary
            </small>
          : null
          }
        </p>
      </div>
    </div>
  )
}

PhoneNumberListItem.propTypes = {
  phoneNumber: PropTypes.object.isRequired
}

export default PhoneNumberListItem;
