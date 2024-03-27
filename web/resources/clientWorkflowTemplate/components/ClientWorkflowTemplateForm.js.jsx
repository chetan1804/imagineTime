/**
 * Reusable stateless form component for ClientWorkflowTemplate
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { TextInput } from '../../../global/components/forms';

const  ClientWorkflowTemplateForm = ({
  cancelLink
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , clientWorkflowTemplate
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Create ClientWorkflow Template" : "Update ClientWorkflow Template";

  // set the form header
  const header = formTitle ? <div className="formHeader"><h2> {formTitle} </h2><hr/></div> : <div/>;

  return (
    <div className="yt-container">
      <div className="yt-row center-horiz">
        <div className="form-container -slim">
          <form name="clientWorkflowTemplateForm" className="clientWorkflowTemplate-form" onSubmit={handleFormSubmit}>
            {header}
            <TextInput
              change={handleFormChange}
              label="Name"
              name="clientWorkflowTemplate.name"
              placeholder="Name (required)"
              required={true}
              value={clientWorkflowTemplate.name}
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

ClientWorkflowTemplateForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , clientWorkflowTemplate: PropTypes.object.isRequired
}

ClientWorkflowTemplateForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
}

export default ClientWorkflowTemplateForm;
