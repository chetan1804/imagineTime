/**
 * Reusable stateless form component for Tag
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { TextInput, SelectFromObject } from '../../../global/components/forms';

const TagForm = ({
  cancelLink
  , formType
  , handleFormChange
  , handleFormSubmit
  , submitting
  , tag
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Create Custom Tag" : "Update Custom Tag";
  const isDisabled = (
    !tag
    || !tag.type
    || !tag.name
    || !tag.name.trim()
    || tag.name.trim().length < 2
  )

  return (
    <div className="yt-row">
      <div className={`yt-col ${formType === 'update' ? 'm_60 l_40' : 'center'}`} >
        <div className="-practice-content">
          <TextInput
            change={handleFormChange}
            label="Name"
            name="tag.name"
            required={true}
            value={tag.name}
          />
          <SelectFromObject
            change={handleFormChange}
            label="Type"
            name="tag.type"
            required={true}
            selected={tag.type}
            items={['year','other']}
          />
          {formType === 'create' ?
            <div className="input-group u-centerText">
              Note: Tags cannot be deleted once they have been created.
            </div>
            :
            null
          }
          <div className="input-group">
            <div className="yt-row space-between">
              {cancelLink && typeof(cancelLink) === 'string' ? 
              <Link className="yt-btn link" to={cancelLink}>Cancel</Link>
              :
              <button className="yt-btn link" onClick={cancelLink} type="button">Cancel</button>
              }
              <button className="yt-btn " onClick={handleFormSubmit} disabled={submitting || isDisabled}> {submitting ? 'Saving...' : buttonText} </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

TagForm.propTypes = {
  cancelLink: PropTypes.oneOfType([
    PropTypes.string
    , PropTypes.func
  ]).isRequired
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , showButtons: PropTypes.bool
  , tag: PropTypes.object.isRequired
}

TagForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
  , showButtons: true
}

export default TagForm;
