/**
 * Reusable stateless form component for Address
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { COUNTRIES, STATES, COUNTRY_STATES } from '../../../config/constants';

// import form components
import { 
  SelectFromObject
  , TextInput 
} from '../../../global/components/forms';

const  AddressCardForm = ({
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
    <form name="addressForm" className="address-card-form" onSubmit={handleFormSubmit}>
      <TextInput
        autoFocus={true}
        change={handleFormChange}
        name="address.street1"
        required={true}
        value={address.street1 || ''}
      />
      <TextInput
        change={handleFormChange}
        name="address.street2"
        placeholder="Unit"
        required={false}
        value={address.street2 || ''}
      />
      <div className="yt-row center-vert with-gutters">
        <div className="yt-col full s_50 ">
          <TextInput
            change={handleFormChange}
            name="address.city"
            required={true}
            value={address.city || ''}
          />
        </div>
        <div className="yt-col full s_50 ">
          { COUNTRY_STATES[address.country] ? 
            <SelectFromObject
              change={handleFormChange}
              display="code"
              filterable={true}
              name="address.state"
              items={COUNTRY_STATES[address.country].states}
              placeholder={"-"}
              required={true}
              selected={address.state}
              value="code"
            />
            :
            null 
          }
        </div>
      </div>
      <div className="yt-row center-vert with-gutters">
        <div className="yt-col full s_50 ">
          <TextInput
            change={handleFormChange}
            name="address.postal"
            required={true}
            value={address.postal || ''}
          />
        </div>
        <div className="yt-col full s_50 ">
          <SelectFromObject
            change={handleFormChange}
            display="code"
            filterable={true}
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
            <Link className="yt-btn link xx-small" to={cancelLink}>Cancel</Link>
            :
            onCancel ?
            <button className="yt-btn link xx-small danger" type="button" onClick={onCancel}> Cancel </button>
            :
            null
          }
          <button className="yt-btn link xx-small info" disabled={disabled} type="submit" > Update</button>
        </div>
      </div>
    </form>
  )
}

AddressCardForm.propTypes = {
  cancelLink: PropTypes.string
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , address: PropTypes.object.isRequired
  , onCancel: PropTypes.func
}

AddressCardForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
}

export default AddressCardForm;
