/**
 * Reusable stateless form component for File
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { ObjectListComparator, TextInput } from '../../../../global/components/forms';

const  AdminFileForm = ({
  cancelLink
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , file
  , tags
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Create File" : "Update File";

  // set the form header
  const header = formTitle ? <div className="formHeader"><h2> {formTitle} </h2><hr/></div> : <div/>;

  return (
    <div className="yt-container">
      <div className="yt-row center-horiz">
        <div className="form-container -slim">
          <form name="fileForm" className="file-form" onSubmit={handleFormSubmit}>
            {header}
            <h3>{file.filename}</h3>
            {/* <TextInput
              change={handleFormChange}
              label="Name"
              name="file.name"
              placeholder="Name (required)"
              required={true}
              value={file.name}
            /> */}
            <ObjectListComparator
              items={tags}
              change={handleFormChange}
              selected={file._tags}
              label="tags"
              name="_tags"
              displayKey={"name"}
              reorderable={true}
              valueKey={"_id"}
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

AdminFileForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , file: PropTypes.object.isRequired
  , tags: PropTypes.array
}

AdminFileForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
}

export default AdminFileForm;
