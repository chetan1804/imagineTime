/**
 * Reusable stateless form component for ClientTaskResponse
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { TextInput } from '../../../global/components/forms';

const  ClientTaskResponseForm = ({
  cancelLink
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , clientTaskResponse
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Create ClientTask Response" : "Update ClientTask Response";

  // set the form header
  const header = formTitle ? <div className="formHeader"><h2> {formTitle} </h2><hr/></div> : <div/>;

  return (
    <div className="yt-container">
      <div className="yt-row center-horiz">
        <div className="form-container -slim">
          <form name="clientTaskResponseForm" className="clientTaskResponse-form" onSubmit={handleFormSubmit}>
            {header}
            <TextInput
              change={handleFormChange}
              label="Name"
              name="clientTaskResponse.name"
              placeholder="Name (required)"
              required={true}
              value={clientTaskResponse.name}
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

ClientTaskResponseForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , clientTaskResponse: PropTypes.object.isRequired
}

ClientTaskResponseForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
}

export default ClientTaskResponseForm;
