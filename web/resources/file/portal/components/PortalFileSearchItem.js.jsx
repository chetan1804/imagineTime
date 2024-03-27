/**
 * A list item to display files added to a clientTask or clientTaskResponse.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';

// import utils
import { displayUtils } from '../../../../global/utils';
import brandingName from '../../../../global/enum/brandingName.js.jsx';
import { DateTime } from 'luxon';

const PortalFileSearchItem = ({
  file
  , match
  , user 
}) => {

  let icon = file ? displayUtils.getFileIcon(file.category, file.contentType, file) : 'file-80';
  return (
    <Link to={`/portal/${match.params.clientId}/files/${file._id}`}  className="portal-search-item -search-items">
      <div className="-file-icon">
        <img src={brandingName.image[icon] || `/img/icons/${icon}.png`} />
      </div>
      { file ? 
        <div className="-info">
          <div className="-title">
            {file.filename}
          </div>
          <div className="-uploaded">
            Uploaded 
            <span> {DateTime.fromISO(file.created_at).toRelativeCalendar()}</span>
            { user ? 
              <span> by {user.firstname} {user.lastname}</span>
              :
              null 
            } 
          </div>
          <div className="-tags">
            {/** TODO: add tags  */}
          </div>
        </div>
        :
        <div className="-info">
          <i className="far fa-spinner fa-spin"/>
        </div>
      }
      <div className="-arrow">
        <i className="-i fal fa-chevron-right"/>
      </div>
    </Link>
  )
}

PortalFileSearchItem.propTypes = {
  file: PropTypes.object.isRequired
  , user: PropTypes.object 
}

PortalFileSearchItem.defaultProps = {
  user: null 
}

export default withRouter(PortalFileSearchItem);
