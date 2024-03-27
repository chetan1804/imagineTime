/**
 * Reusable stateless form component for User by admins
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import {
  EmailInput
  , PasswordInput
  , SimpleArrayEditor
  , TextInput
  , CheckboxInput
} from  '../../../../global/components/forms';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

const AdminUserForm = ({
  user
  , formType
  , handleDeleteUser
  , handleFormSubmit
  , handleFormChange
  , cancelLink
  , formTitle
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Create User" : "Update User";

  // set the form header
  const header = formTitle ? <div className="formHeader"><h2> {formTitle} </h2><hr/></div> : <div/>;

  const submitDisabled = (
    !user
    || !user.username
    || !user.username.trim()
    || !user.password
    || !user.password.trim()
    || !user.firstname
    || !user.firstname.trim()
    || !user.lastname
    || !user.lastname.trim()
  )

  const submitUpdateDisabled = (
    !user
    || !user.username
    || !user.username.trim()
    || !user.firstname
    || !user.firstname.trim()
    || !user.lastname
    || !user.lastname.trim()
  )

  return (
    <div className="yt-container">
      <div className="yt-row center-horiz">
        <div className="form-container -slim">
          <form name="userForm" className="user-form" onSubmit={handleFormSubmit}>
            {header}
            <EmailInput
              name="user.username"
              label="Email Address"
              value={user.username}
              change={handleFormChange}
              placeholder="Email (required)"
              required={true}
            />
            { formType === "create" ?
              <PasswordInput
                name="user.password"
                label="Password"
                value={user.password}
                change={handleFormChange}
                required={true}
                password={true}
              />
              :
              null
            }
            <TextInput
              name="user.firstname"
              label="First Name"
              value={user.firstname}
              change={handleFormChange}
              required={true}
            />
            <TextInput
              name="user.lastname"
              label="Last Name"
              value={user.lastname}
              change={handleFormChange}
              required={true}
            />
            {/* For testing, until we can update users we'll have to on-board them at creation. */}
            <CheckboxInput
              name="user.onBoarded"
              label="On-boarded"
              value={user.onBoarded}
              change={handleFormChange}
              checked={user.onBoarded}
            />
            <CheckboxInput
              name="user.admin"
              label={`${brandingName.title} Admin`}
              value={user.admin}
              change={handleFormChange}
              checked={user.admin}
            />
            <CheckboxInput
              name="user.enable_2fa"
              label={"Two-Factor Authentication"}
              value={user.enable_2fa}
              change={handleFormChange}
              checked={user.enable_2fa}
            />
            <div className="input-group">
              <div className="yt-row space-between">
                { formType === 'update' ?
                  <button className="yt-btn link danger" type="button" onClick={handleDeleteUser}> Delete User </button>
                  :
                  null
                }
                <button
                  className="yt-btn"
                  disabled={formType === 'create' ? submitDisabled : submitUpdateDisabled}
                  type="submit"
                >
                  {buttonText}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

AdminUserForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleDeleteUser: PropTypes.func
  , handleFormSubmit: PropTypes.func.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , user: PropTypes.object.isRequired
}

AdminUserForm.defaultProps = {
  formTitle: ''
  , handleDeleteUser: null
}

export default AdminUserForm;
