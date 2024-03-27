/**
 * Reusable stateless form component for Client
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { 
  TextInput
  , TextAreaInput
} from '../../../../global/components/forms';

// import resource components
import ClientWorkflowStatusIndicator from '../../components/ClientWorkflowStatusIndicator.js.jsx';

const PracticeClientWorkflowForm = ({
  cancelLink
  , client
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , clientWorkflow
}) => {
  const header = formTitle ? <div className="formHeader"><h3> {formTitle} </h3></div> : <div/>;
  const buttonText = formType === "create" ? "Next" : "Save";

  return (
    <form name="clientForm" className="client-form" onSubmit={handleFormSubmit}>
      <div className="yt-row space-between center-vert">
        {header}
        <ClientWorkflowStatusIndicator
          status={clientWorkflow.status}
        />
      </div>
      <br/>
      <div className="yt-col _50">
        <TextInput
          change={handleFormChange}
          label="Title"
          name="clientWorkflow.title"
          required={true}
          value={clientWorkflow.title || ""}
        />
      </div>
      <TextAreaInput
        change={handleFormChange}
        helpText={<span><strong>NOTE: </strong>This will also appear in the body of the notification email</span>}
        label="Describe the purpose of this workflow"
        name="clientWorkflow.description"
        required={false}
        rows="4"
        value={clientWorkflow.description || ""}
        wrap="hard"
      />
      <div className="input-group">
        <div className="yt-row space-between">
          { typeof(cancelLink) === 'string' ? 
            <Link className="yt-btn link" to={cancelLink}>Cancel</Link>
            :
            <span className="yt-btn link" onClick={cancelLink}>Cancel</span>
          }
          <button className="yt-btn " type="submit" disabled={!clientWorkflow.description || !clientWorkflow.title }> {buttonText} </button>
        </div>
      </div>
    </form>
  )
}

PracticeClientWorkflowForm.propTypes = {
  cancelLink: PropTypes.oneOfType([
    PropTypes.string 
    , PropTypes.func 
  ]).isRequired
  , client: PropTypes.object.isRequired
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , clientWorkflow: PropTypes.object.isRequired
}

PracticeClientWorkflowForm.defaultProps = {
  formHelpers: {}
  , formTitle: 'ClientWorkflow'
  // , cancelLink: () => c onsole.log('cancle')
}

export default PracticeClientWorkflowForm;
