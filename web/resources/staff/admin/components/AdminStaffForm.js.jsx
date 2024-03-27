/**
 * Reusable stateless form component for Staff
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';



// import form components
import { 
  CheckboxInput
  , SelectFromObject
  , SelectFromArray
  , TextInput 
} from '../../../../global/components/forms';

const  AdminStaffForm = ({
  cancelLink
  , firm 
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , staff
  , user
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Create Staff" : "Update Staff";

  // set the form header
  const header = formTitle ? <div className="formHeader"><h2> {formTitle} </h2><hr/></div> : <div/>;
  return (
    <div className="yt-container">
      <div className="yt-row center-horiz">
        <div className="form-container -slim">
          <form name="staffForm" className="staff-form" onSubmit={handleFormSubmit}>
            {header}
            <p><strong>Firm: </strong></p>
            <p>{firm.name}</p>
            <p><strong>Staff Member: </strong></p>
            <p>{user.firstname} {user.lastname}</p>
            <p>{user.username}</p>
            <hr/>
            <SelectFromArray
              change={handleFormChange}
              label="Status"
              name="staff.status"
              items={['active','inactive']}
              placeholder={"-- Set status --"}
              required={true}
              value={staff.status}
            />
            <CheckboxInput
              name="staff.owner"
              label="This staff member has owner privileges"
              value={staff.owner}
              change={handleFormChange}
              checked={staff.owner}
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

AdminStaffForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , firm: PropTypes.object
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , staff: PropTypes.object.isRequired
  , user: PropTypes.object 
}

AdminStaffForm.defaultProps = {
  firm: {}
  , formHelpers: {}
  , formTitle: ''
  , user: {}
}

export default AdminStaffForm;
