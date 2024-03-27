/**
 * A list item to display files as search results.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';

// import utils
import { displayUtils } from '../../../global/utils';

import { DateTime } from 'luxon';
import classNames from 'classnames';

const PortalFileSearchItem = ({
  file
  , path 
  , searchClasses
  , user
  , userStore
}) => {

  const itemClass = classNames(
    '-search-item'
    , searchClasses 
  )
  let icon = file ? displayUtils.getFileIcon(file.category, file.contentType, file) : 'file-80';
  if (file && file.category === 'folder') {
    path += '/folder';
  }
  return (
    <Link to={path}  className={itemClass}>
      <div className="-file-icon">
        <img src={`/img/icons/${icon}.png`} />
      </div>
      { file ? 
        <div className="-info">
          <div className="-title">
            {file.filename} {!!file.status && file.status !== 'visible' ? '(' + file.status + ')' : null}
          </div>
          <div className="-uploaded">
            Uploaded 
            <span> {DateTime.fromISO(file.created_at).toRelativeCalendar()}</span>
            {/* { user ? 
              <span> by {user.firstname} {user.lastname}</span>
              :
              null 
            }  */}
            <br/>
            <small>
            { userStore && userStore.byId[file._user] ?
              <span>by {userStore.byId[file._user].firstname} {userStore.byId[file._user].lastname}</span>
              :
              file.uploadName ?
              <span>by <em>{file.uploadName} (not verified)</em></span>
              :
              null
            }
            </small>
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
  , path: PropTypes.string.isRequired
  , searchClasses: PropTypes.string
  , user: PropTypes.object 
}

PortalFileSearchItem.defaultProps = {
  searchClasses: ''
  , user: null 
}

export default withRouter(PortalFileSearchItem);
