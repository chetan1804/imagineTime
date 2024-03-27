/**
 * Reusable stateless form component for ClientWorkflowTemplate
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import ClientWorkflowStatusIndicator from '../../../clientWorkflow/components/ClientWorkflowStatusIndicator.js.jsx';

// import form components
import { TextAreaInput, TextInput } from '../../../../global/components/forms';

const  AdminClientWorkflowTemplateForm = ({
  cancelLink
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , clientWorkflowTemplate
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Next" : "Update ClientWorkflow Template";

  // set the form header
  const header = formTitle ? <div className="formHeader"><h2> {formTitle} </h2><hr/></div> : <div/>;

  return (
    <div className="yt-container">
      <div className="yt-row center-horiz">
        <div className="form-container">
          <form name="clientWorkflowTemplateForm" className="clientWorkflowTemplate-form" onSubmit={handleFormSubmit}>
            <div className="yt-row space-between center-vert">
              {header}
              <ClientWorkflowStatusIndicator
                status={clientWorkflowTemplate.status}
              />
            </div>
            <br/>
            <TextAreaInput
              change={handleFormChange}
              label="Describe the purpose of this template"
              name="clientWorkflowTemplate.purpose"
              required={true}
              rows="4"
              value={clientWorkflowTemplate.purpose || ""}
            />
            <div className="yt-col _50">
              <TextInput
                change={handleFormChange}
                label="Workflow title"
                name="clientWorkflowTemplate.title"
                required={true}
                value={clientWorkflowTemplate.title || ""}
              />
            </div>
            <TextAreaInput
              change={handleFormChange}
              helpText={<span><strong>NOTE: </strong>This will also appear in the body of the notification email</span>}
              label="Workflow description"
              name="clientWorkflowTemplate.description"
              required={true}
              rows="4"
              value={clientWorkflowTemplate.description || ""}
            />
            <div className="input-group">
              <div className="yt-row space-between">
                { typeof(cancelLink) === 'string' ? 
                  <Link className="yt-btn link" to={cancelLink}>Cancel</Link>
                  :
                  <span className="yt-btn link" onClick={cancelLink}>Cancel</span>
                }
                <button className="yt-btn " type="submit" disabled={!clientWorkflowTemplate.description || !clientWorkflowTemplate.title }> {buttonText} </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

AdminClientWorkflowTemplateForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , clientWorkflowTemplate: PropTypes.object.isRequired
}

AdminClientWorkflowTemplateForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
}

export default AdminClientWorkflowTemplateForm;
