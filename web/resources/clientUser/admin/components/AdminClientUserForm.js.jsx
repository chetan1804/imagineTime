/**
 * Reusable stateless form component for ClientUser
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { 
  CheckboxInput
  , SelectFromObject
  , TextInput 
} from '../../../../global/components/forms';

const  AdminClientUserForm = ({
  cancelLink
  , clients 
  , clientUser
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , users
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Create Client User" : "Update Client User";

  // set the form header
  const header = formTitle ? <div className="formHeader"><h2> {formTitle} </h2><hr/></div> : <div/>;

  return (
    <div className="yt-container">
      <div className="yt-row center-horiz">
        <div className="form-container -slim">
          <form name="clientUserForm" className="clientUser-form" onSubmit={handleFormSubmit}>
            {header}
            <SelectFromObject
              change={handleFormChange}
              disabled={formHelpers.clientId ? true : false}
              display={'name'}
              filterable={false}
              label="Client"
              name="clientUser._client"
              items={clients}
              placeholder={"-- Select a Client --"}
              required={!formHelpers.clientId}
              selected={formHelpers.clientId ? parseInt(formHelpers.clientId) : clientUser._client}
              value={'_id'}
            />
             <SelectFromObject
              change={handleFormChange}
              disabled={formHelpers.userId ? true : false}
              display={'username'}
              displayStartCase={false}
              filterable={true}
              label="User"
              name="clientUser._user"
              items={users}
              placeholder={"-- Select a User --"}
              required={!formHelpers.userId}
              selected={formHelpers.userId ? formHelpers.userId : clientUser._user}
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

AdminClientUserForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , clients: PropTypes.array
  , clientUser: PropTypes.object.isRequired
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , users: PropTypes.array 
}

AdminClientUserForm.defaultProps = {
  clients: []
  , formHelpers: {}
  , formTitle: ''
  , users: []
}

export default AdminClientUserForm;
