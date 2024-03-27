// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import third party libraries
import { DateTime } from 'luxon';
import classNames from 'classnames'

// import utils
// import { displayUtils } from '../../../../global/utils';

/**
 * TODO: - Change styling based on how close we are to the dueDate (or if it's past due).
 *       - Change styling based on clientTask.type
 */

const PortalClientTaskListItem = ({
  clientTask
}) => {
  const cardClass = classNames(
    'card'
    , 'activity-card'
    , {
      '-overdue': clientTask && clientTask.dueDate && new Date(clientTask.dueDate) <= new Date()
    }
  )

  return (
    <div className="activity-card-wrapper">
      <div className={cardClass}>
        <div className="card-body">
            <a href={`/portal/${clientTask._client}/client-workflows/${clientTask._clientWorkflow}`} className="-text">{clientTask.title}</a>
          { clientTask.dueDate ?
            <div className="-due-date">
              <div className="-icon">
                <i className="fal fa-calendar fa-lg"/>
              </div>
              <div className="-text">
                <strong>Due Date</strong> 
                <p className="-date">{DateTime.fromISO(clientTask.dueDate).toRelative()}</p>
              </div>
            </div> 
            :
            null
          }
        </div>
      </div>
    </div>
  )
}

PortalClientTaskListItem.propTypes = {
  clientTask: PropTypes.object.isRequired
}

export default PortalClientTaskListItem;
