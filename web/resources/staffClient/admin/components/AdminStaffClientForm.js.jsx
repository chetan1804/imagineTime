/**
 * Reusable stateless form component for StaffClient
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { 
  SelectFromObject
  , TextInput 
} from '../../../../global/components/forms';
const  AdminStaffClientForm = ({
  cancelLink
  , clients 
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , staffClient
  , staff
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
              change={handleFormChange}
              disabled={formHelpers.clientId ? true : false}
              display={'displayName'}
              displayStartCase={false}
              filterable={false}
              label="Client | Firm"
              name="staffClient._client"
              items={clients}
              placeholder={"-- Select a Client --"}
              required={!formHelpers.clientId}
              selected={formHelpers.clientId ? parseInt(formHelpers.clientId) : staffClient._client}
              value={'_id'}
            />
             <SelectFromObject
              change={handleFormChange}
              disabled={formHelpers.staffId ? true : false}
              display={'displayName'}
              displayStartCase={false}
              filterable={true}
              label="Staff Member | Firm"
              name="staffClient._staff"
              items={staff}
              placeholder={"-- Select a Staff --"}
              required={!formHelpers.staffId}
              selected={formHelpers.staffId ? formHelpers.staffId : staffClient._staff}
              value={'_id'}
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

AdminStaffClientForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , clients: PropTypes.array
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , staffClient: PropTypes.object.isRequired
  , staff: PropTypes.array 
}

AdminStaffClientForm.defaultProps = {
  clients: []
  , formHelpers: {}
  , formTitle: ''
  , staff: []
}

export default AdminStaffClientForm;
