/**
 * Reusable stateless form component for ClientPost
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { TextAreaInput } from '../../../global/components/forms';

const  ClientPostForm = ({
  cancelLink
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , clientPost
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Send" : "Update Client Post";

  // set the form header
  const header = formTitle ? <div className="formHeader"><h2> {formTitle} </h2><hr/></div> : <div/>;

  return (
    <div className="yt-container">
      <div className="yt-row center-horiz">
        <div className="form-container -slim">
          <form name="clientPostForm" className="clientPost-form" onSubmit={handleFormSubmit}>
            {header}
            <TextAreaInput
              change={handleFormChange}
              label="Content"
              name="clientPost.content"
              placeholder="Write a message..."
              required={true}
              value={clientPost.content}
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

ClientPostForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , clientPost: PropTypes.object.isRequired
}

ClientPostForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
}

export default ClientPostForm;
