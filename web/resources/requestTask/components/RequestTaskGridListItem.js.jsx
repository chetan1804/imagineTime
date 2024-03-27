// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

import { DateTime } from 'luxon'; 

// import utils
// import { quickTaskUtils } from '../../../global/utils'

const RequestTaskGridListItem = ({
  requestTask
 , match
}) => {

  const progressPercent = 0; // quickTaskUtils.getProgressPercent(quickTask)
  return (
    <Link to={`${match.url}/${requestTask._id}`} className="portal-quicktask-list-item">
      <div className="-icon">
      { requestTask && requestTask.status === "completed" ? 
        <span style={{color: 'green'}}>
          <i className="fas fa-check-circle fa-1x"/>
        </span>
        : 
        <span>
          <i className="fal fa-check-circle fa-1x"></i>
        </span>
      }
      </div>
      <span className="-icon">
        <i className="fas fa-file-signature fa-2x"></i>
      </span>
      <div className="-info">
        <div className="-description">
          {requestTask.description}
        </div>
        {
          requestTask.assignee && requestTask.assignee.length > 1 ? 
          <div className="-items">
            {`${requestTask.assignee.length} assignees`}
          </div> 
          : null
        }
        <div className="-description">
          <small>{DateTime.fromISO(requestTask.created_at).toFormat('D')}</small>
        </div>
      </div>
      <div className="-arrow">
        <i className="-i fal fa-chevron-right"/>
      </div>
    </Link>
  )
}

RequestTaskGridListItem.propTypes = {
  dispatch: PropTypes.func.isRequired
  , requestTask: PropTypes.object.isRequired
}

RequestTaskGridListItem.defaultProps = {

}

const mapStoreToProps = (store) => {

  return {
    loggedInUser: store.user.loggedIn.user
    , tagStore: store.tag
  }
}

export default withRouter(connect(
  mapStoreToProps
)(RequestTaskGridListItem));
