// import primary libaries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';

// import form components
import {
  TextInput
  , EmailInput
} from '../../../global/components/forms';

function UserProfileForm({ handleFormChange, handleFormSubmit, user }) {
  return (

        <div className="form-container">
          <form name="userForm" className=" user-form" onSubmit={handleFormSubmit}>

            <TextInput
              name="firstname"
              label="First Name"
              value={user.firstname}
              change={handleFormChange}
              required={false}
              />
            <TextInput
              name="lastname"
              label="Last Name"
              value={user.lastname}
              change={handleFormChange}
              required={false}
            />
          </form>
        </div>

  )
}

UserProfileForm.propTypes = {
  handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , user: PropTypes.object.isRequired
}

export default withRouter(UserProfileForm);
