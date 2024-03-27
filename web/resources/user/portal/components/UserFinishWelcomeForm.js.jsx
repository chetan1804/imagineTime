// import primary libaries
import React from 'react';
import PropTypes from 'prop-types';

// TODO: Figure out how we're going to populate staffUser below.
import brandingName from '../../../../global/enum/brandingName.js.jsx';

function UserFinishWelcomeForm({
  handleFormSubmit
  , user
}) {
  return (
    <div className="form-container">
      <form name="userFinishWelcomeForm" className="user-finish-welcome-form" onSubmit={handleFormSubmit}>
        <h2>Welcome to {brandingName.title}</h2>
        <br/>
        <p>{`Hi, ${user.firstname}!`} </p>
        <p>{`We’re glad you were invited to the ${brandingName.title} Portal. Let's make sure we have all your info down correctly.`}</p>
        <br/>
        <div className="input-group">
          <div className="yt-row right">
            <button className="yt-btn" type="submit" > Continue </button>
          </div>
        </div>
      </form>
    </div>
  )
}

UserFinishWelcomeForm.propTypes = {
  handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , user: PropTypes.object.isRequired
}

export default UserFinishWelcomeForm;
