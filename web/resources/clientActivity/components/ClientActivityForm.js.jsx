/**
 * Reusable stateless form component for ClientActivity
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { TextInput } from '../../../global/components/forms';

const  ClientActivityForm = ({
  cancelLink
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , clientActivity
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Create Client Activity" : "Update Client Activity";

  // set the form header
  const header = formTitle ? <div className="formHeader"><h2> {formTitle} </h2><hr/></div> : <div/>;

  return (
    <div className="yt-container">
      <div className="yt-row center-horiz">
        <div className="form-container -slim">
          <form name="clientActivityForm" className="clientActivity-form" onSubmit={handleFormSubmit}>
            {header}
            <TextInput
              change={handleFormChange}
              label="Name"
              name="clientActivity.name"
              placeholder="Name (required)"
              required={true}
              value={clientActivity.name}
            />
            <div className="input-group">
              <div className="yt-row space-between">
                <Link className="yt-btn link" to={cancelLink}>Cancel</Link>
                <button className="yt-btn " type="submit" > {buttonText} </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

ClientActivityForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , clientActivity: PropTypes.object.isRequired
}

ClientActivityForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
}

export default ClientActivityForm;
