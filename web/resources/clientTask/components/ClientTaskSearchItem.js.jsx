/**
 * Reusable component for editing details of a task
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import { DateTime } from 'luxon';
// import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import utils 
import { displayUtils } from '../../../global/utils/index.js';

const ClientTaskSearchItem = ({
  clientTask 
  , path 
  , searchClasses
}) => {
  const itemClass = classNames(
    '-search-item'
    , searchClasses 
  )
  return (
    <Link to={path} className={itemClass}>
      <div className={`-task-type -${clientTask.type}`}>
        <span className="-icon"><i className={displayUtils.getTaskIcon(clientTask.type)}/></span>
        <span className="-status">
          { clientTask.status === 'completed' ? 
            <i className="fas fa-check-circle"/>
            : clientTask.status === 'awaitingApproval' ?
            <i className="fad fa-check-circle"/>
            :
            <i className="far fa-circle"/>
          }
        </span>
      </div>
      <div className="-info">
        <div className="-title">
          {clientTask.title}
        </div>
        <div className="-description">
          {clientTask.description}
        
        </div>
        { clientTask.dueDate ? 
          <div className="-due-date">
            <div className="-icon">
              <i className="fal fa-calendar"/>
            </div>
            <div className="-text">       
              <strong>Due Date</strong> {DateTime.fromISO(clientTask.dueDate).toRelative()}
            </div>
          </div> 
          :
          null
        }
        <div className="-attachments">

        </div>
      </div>
      <div className="-arrow">
        <i className="-i fal fa-chevron-right"/>
      </div>
    </Link>
  )
}

ClientTaskSearchItem.propTypes = {
  clientTask: PropTypes.object.isRequired
  , path: PropTypes.string.isRequired  
  , searchClasses: PropTypes.string 
}

ClientTaskSearchItem.defaultProps = {
  searchClasses: ''
}

export default withRouter(ClientTaskSearchItem);