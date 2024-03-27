// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import { displayUtils } from '../../../global/utils';

const ProfilePic = ({
  user
  , isViewing
  , index
}) => {
  let pictureUrl;
  let profileImg; 
  if(user.profilePicUrl) {
    pictureUrl = user.profilePicUrl;
    profileImg = {backgroundImage: `url(${pictureUrl})`};
    return (
      <div className="-profile-pic" style={profileImg} />
    )
  } else {
    return (
      <div className="-user-initials -nav" style={{backgroundColor: (isViewing ? displayUtils.getColor(index) : displayUtils.getUserColorBG(user)), color: "#fff"}}>
        {displayUtils.getInitials(user)}
      </div>
    )
  }
}

ProfilePic.propTypes = {
  user: PropTypes.object.isRequired
  , isViewing: PropTypes.bool
  , index: PropTypes.number  
}

ProfilePic.defaultProps = {
}

export default withRouter(ProfilePic);
