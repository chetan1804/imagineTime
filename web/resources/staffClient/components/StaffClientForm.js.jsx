/**
 * Reusable stateless form component for StaffClient
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { SelectFromObject } from '../../../global/components/forms';

const  StaffClientForm = ({
  cancelLink
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , showButtons
  , staffListItems
  , selected
}) => {
  // set the button text
  const buttonText = formType === "create" ? "Create Staff Client" : "Update Staff Client";

  // set the form header
  const header = formTitle ? <div className="formHeader"><h2> {formTitle} </h2><hr/></div> : <div/>;

  return (
    <div className="yt-container">
      <div className="yt-row center-horiz">
        <div className="form-container -slim">
          <form name="staffClientForm" className="staffClient-form" onSubmit={handleFormSubmit}>
            {header}
            <SelectFromObject
              items={staffListItems}
              change={handleFormChange}
              disabled={staffListItems.length === 0}
              display={'displayName'}
              displayStartCase={false}
              filterable={false}
              label=''
              name='staffClient._staff'
              placeholder={staffListItems.length === 0 ? '-- No available staff --' : '-- Choose a staff member --'}
              value={'_id'}
              selected={selected}
            />
            { showButtons ?
              <div className="input-group">
                <div className="yt-row space-between">
                  <Link className="yt-btn link" to={cancelLink}>Cancel</Link>
                  <button className="yt-btn " type="submit" > {buttonText} </button>
                </div>
              </div>
              :
              null
            }
          </form>
        </div>
      </div>
    </div>
  )
}

StaffClientForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , showButtons: PropTypes.bool
  , staffListItems: PropTypes.array.isRequired
}

StaffClientForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
  , showButtons: true
}

export default StaffClientForm;
