/**
 * Reusable stateless form component for PhoneNumber
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input/basic-input'

// import form components
import { SelectFromObject, TextInput } from '../../../global/components/forms';

const PhoneNumberForm = ({
  cancelLink
  , disabled
  , formType
  , handleFormChange
  , handleFormSubmit
  , onCancel
  , phoneNumber
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Add Phone Number" : "Update Phone Number";

  return (
    <div className="yt-container">
      <div className="yt-row center-vert">
        <div className="form-container -skinny">
          <form name="phoneNumberForm" className="phoneNumber-form" onSubmit={handleFormSubmit}>
            <div className="yt-row">
              <div className="yt-col _35">
                <SelectFromObject
                  items={['mobile', 'home', 'work','main','home fax', 'work fax', 'other fax', 'other']}
                  change={handleFormChange}
                  name="phoneNumber.type"
                  selected={phoneNumber.type}
                  placeholder="-- Type -- "
                />
              </div>
              <div className="yt-col -phone-input input-group">
                <PhoneInput
                  autoFocus={formType === "create"}
                  country="US"
                  onChange={(value) => handleFormChange({target: {name: "phoneNumber.number", value: value }})}
                  placeholder="Phone Number (required)"
                  value={phoneNumber.number || ''}
                />
              </div>
              <TextInput
                classes="yt-col _20 -phone-input"
                change={handleFormChange}
                label=""
                placeholder="Ext"
                name="phoneNumber.extNumber"
                value={phoneNumber.extNumber}
              />
              {/* {
                phoneNumber && phoneNumber._user ? 
                <TextInput
                  classes="yt-col _20 -phone-input"
                  change={handleFormChange}
                  label="Ext"
                  name="phoneNumber.extNumber"
                  value={phoneNumber.extNumber}
                /> : null
              }               */}
            </div>
            <div className="input-group">
              <div className="yt-row space-between">
              { cancelLink ?
                <Link className="yt-btn link small" to={cancelLink}>Cancel</Link>
                :
                onCancel ?
                <button className="yt-btn link x-small danger" type="button" onClick={onCancel}> Cancel </button>
                :
                null
              }
                <button className="yt-btn link x-small info" disabled={disabled} type="submit" > {buttonText} </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

PhoneNumberForm.propTypes = {
  cancelLink: PropTypes.string
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , onCancel: PropTypes.func
  , phoneNumber: PropTypes.object.isRequired
}

PhoneNumberForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
}

export default PhoneNumberForm;
