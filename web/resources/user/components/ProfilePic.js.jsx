// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import { displayUtils } from '../../../global/utils';

const ProfilePic = ({
  sizeClass
  , user 
}) => {
  let pictureUrl;
  let profileImg; 
  if(user.profilePicUrl) {
    pictureUrl = user.profilePicUrl;
    profileImg = {backgroundImage: `url(${pictureUrl})`};
    return (
      <div className={"-profile-pic " + sizeClass} style={profileImg} />
    )
  } else {
    return (
      <div className={"-user-initials " + sizeClass} style={{backgroundColor: displayUtils.getUserColorBG(user), color: "#fff"}}>
        {displayUtils.getInitials(user)}
      </div>
    )
  }
}

ProfilePic.propTypes = {
  sizeClass: PropTypes.oneOf(['-nav', '-small', '-standard', '-large', '-jumbo'])
  , user: PropTypes.object.isRequired
}

ProfilePic.defaultProps = {
  sizeClass: '-standard'
}

export default withRouter(ProfilePic);
