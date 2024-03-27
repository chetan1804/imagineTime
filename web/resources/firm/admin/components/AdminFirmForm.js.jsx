/**
 * Reusable stateless form component for Firm
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { TextInput, UrlInput } from '../../../../global/components/forms';

const  AdminFirmForm = ({
  cancelLink
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , firm
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Create Firm" : "Update Firm";

  // set the form header
  const header = formTitle ? <div className="formHeader"><h2> {formTitle} </h2><hr/></div> : <div/>;

  return (
    <div className="yt-container">
      <div className="yt-row center-horiz">
        <div className="form-container -slim">
          <form name="firmForm" className="firm-form" onSubmit={handleFormSubmit}>
            {header}
            <TextInput
              change={handleFormChange}
              label="Name"
              name="firm.name"
              placeholder="Name (required)"
              required={true}
              value={firm.name || ""}
            />
            <div className="input-group">
              <div className="yt-row space-between">
                <Link className="yt-btn link" to={cancelLink}>Cancel</Link>
                <button className="yt-btn" disabled={!firm.name || !firm.name.trim()} type="submit" > {buttonText} </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

AdminFirmForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , firm: PropTypes.object.isRequired
}

AdminFirmForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
}

export default AdminFirmForm;
