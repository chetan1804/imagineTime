/**
 * Reusable stateless form component for Address
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { COUNTRIES, COUNTRY_STATES, STATES } from '../../../config/constants';

// import form components
import { 
  SelectFromObject
  , TextInput 
} from '../../../global/components/forms';

const  AddressForm = ({
  address
  , cancelLink
  , disabled
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , onCancel
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Add Address" : "Update Address";

  // set the form header
  const header = formTitle ? <div className="formHeader"><h2> {formTitle} </h2><hr/></div> : <div/>;

  return (
    <div className="yt-container">
      <div className="yt-row center-horiz">
        <div className="form-container -slim">
          <form name="addressForm" className="address-form" onSubmit={handleFormSubmit}>
            {header}
            <TextInput
              autoFocus={true}
              change={handleFormChange}
              label="Street Address"
              name="address.street1"
              required={true}
              value={address.street1 || ''}
            />
            <TextInput
              change={handleFormChange}
              name="address.street2"
              placeholder="Apt/Ste/Unit #"
              required={false}
              value={address.street2 || ''}
            />
            <div className="yt-row with-gutters">
              <div className="yt-col full s_50 m_70">
                <TextInput
                  change={handleFormChange}
                  label="City"
                  name="address.city"
                  required={true}
                  value={address.city || ''}
                />
              </div>
              <div className="yt-col full s_50 m_30">
                { COUNTRY_STATES[address.country] ? 
                  <SelectFromObject
                    change={handleFormChange}
                    display="code"
                    filterable={true}
                    label="State"
                    name="address.state"
                    items={COUNTRY_STATES[address.country].states}
                    placeholder={""}
                    required={true}
                    selected={address.state}
                    value="code"
                  />
                  : 
                  null 
                }
              </div>
            </div>
            <div className="yt-row with-gutters">
              <div className="yt-col full s_50 m_30">
                <TextInput
                  change={handleFormChange}
                  label="Postal Code"
                  name="address.postal"
                  required={true}
                  value={address.postal || ''}
                />
              </div>
              <div className="yt-col full s_50 m_70">
                <SelectFromObject
                  change={handleFormChange}
                  display="name"
                  filterable={true}
                  label="Country"
                  name="address.country"
                  items={COUNTRIES}
                  placeholder={""}
                  required={true}
                  selected={address.country}
                  value="code"
                />
              </div>
            </div>            
            <div className="input-group">
              <div className="yt-row space-between">
              { cancelLink ?
                <Link className="yt-btn link small" to={cancelLink}>Cancel</Link>
                :
                onCancel ?
                <button className="yt-btn link small danger" type="button" onClick={onCancel}> Cancel </button>
                :
                null
              }
                <button className="yt-btn link small info" disabled={disabled} type="submit" > {buttonText} </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

AddressForm.propTypes = {
  cancelLink: PropTypes.string
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , address: PropTypes.object.isRequired
  , onCancel: PropTypes.func
}

AddressForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
}

export default AddressForm;
