/**
 * Reusable stateless form component for ClientTaskTemplate
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { TextInput } from '../../../global/components/forms';

const  ClientTaskTemplateForm = ({
  cancelLink
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , clientTaskTemplate
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Create Client Task Template" : "Update Client Task Template";

  // set the form header
  const header = formTitle ? <div className="formHeader"><h2> {formTitle} </h2><hr/></div> : <div/>;

  return (
    <div className="yt-container">
      <div className="yt-row center-horiz">
        <div className="form-container -slim">
          <form name="clientTaskTemplateForm" className="clientTaskTemplate-form" onSubmit={handleFormSubmit}>
            {header}
            <TextInput
              change={handleFormChange}
              label="Name"
              name="clientTaskTemplate.name"
              placeholder="Name (required)"
              required={true}
              value={clientTaskTemplate.name}
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

ClientTaskTemplateForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , clientTaskTemplate: PropTypes.object.isRequired
}

ClientTaskTemplateForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
}

export default ClientTaskTemplateForm;
