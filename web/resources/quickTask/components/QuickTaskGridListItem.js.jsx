// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

import { DateTime } from 'luxon'; 

// import utils
import { quickTaskUtils } from '../../../global/utils'

const QuickTaskGridListItem = ({
 quickTask
 , match
}) => {

  const progressPercent = quickTaskUtils.getProgressPercent(quickTask)
  return (
    <Link to={`${match.url}/${quickTask._id}`} className="portal-quicktask-list-item">
      <div className="-icon">
      { progressPercent === 100 ? 
        <span style={{color: 'green'}}>
          <i className="fas fa-check-circle fa-1x"/>
        </span>
        : 
        progressPercent > 0 && progressPercent < 100 ?
        <span style={{color: 'green'}}>
          <i className="fad fa-spinner-third fa-1x"></i>
        </span>
        :
        <i className="fal fa-circle fa-1x"/>
      }
      </div>
      <span className="-icon">
        <i className="fas fa-file-signature fa-2x"></i>
      </span>
      <div className="-info">
        <div className="-description">
          <div dangerouslySetInnerHTML={{__html: quickTask.prompt || ""}}></div>
        </div>
        { quickTask.type === 'signature' ?
          <div className="-items">
          {`${quickTask.signingLinks.length} ${quickTask.signingLinks.length > 1 ? "signatures" : "signature"} requested` }
          </div>
          :
          quickTask.type === 'file' ?
          <div className="-items">
          </div>
          :
          null
        }
        <div className="-description">
          <small>{DateTime.fromISO(quickTask.created_at).toFormat('D')}</small>
        </div>
      </div>
      <div className="-arrow">
        <i className="-i fal fa-chevron-right"/>
      </div>
    </Link>
  )
}

QuickTaskGridListItem.propTypes = {
  dispatch: PropTypes.func.isRequired
  , quickTask: PropTypes.object.isRequired
}

QuickTaskGridListItem.defaultProps = {

}

const mapStoreToProps = (store) => {

  return {
    loggedInUser: store.user.loggedIn.user
    , tagStore: store.tag
  }
}

export default withRouter(connect(
  mapStoreToProps
)(QuickTaskGridListItem));
