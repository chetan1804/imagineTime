// import primary libaries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { NewPasswordInput } from '../../../../global/components/forms';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

function UserFinishPasswordForm({
  cancelLink
  , handleFormChange
  , handleFormSubmit
  , password
}) {

  return (
    <div className="form-container">
      <form name="userFinishPasswordForm" className="user-finish-password-form" onSubmit={handleFormSubmit}>
        <h2>Welcome to {brandingName.title}</h2>
        <br/>
        <p>First, let’s create your password.</p>
        <br/>
        <NewPasswordInput
          change={handleFormChange}
          name="password"
          value={password}
        />
        <div className="input-group">
          <div className="yt-row space-between center-vert">
            <Link className="yt-btn link" to={cancelLink}>Skip</Link>
            <button className="yt-btn" type="submit" > Continue </button>
          </div>
        </div>
      </form>
    </div>
  )
}

UserFinishPasswordForm.propTypes = {
  handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , password: PropTypes.string.isRequired
}

export default UserFinishPasswordForm;
