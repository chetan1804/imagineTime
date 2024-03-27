/**
 * Reusable component for editing details of a quick-task
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

const QuickTaskSearchItem = ({
  quickTask 
  , path 
  , searchClasses
}) => {
  const itemClass = classNames(
    '-search-item'
    , searchClasses 
  )
  return (
    <Link to={path} className={itemClass}>
      <div className="-info">
        <div className="-title">
          {quickTask.type}
        </div>
        <div className="-description">
          {quickTask.prompt}
        </div>
        <div className="-items">
          {quickTask.status}
        </div>
      </div>
      <div className="-arrow">
        <i className="-i fal fa-chevron-right"/>
      </div>
    </Link>
  )
}

QuickTaskSearchItem.propTypes = {
  quickTask: PropTypes.object.isRequired
  , path: PropTypes.string.isRequired  
  , searchClasses: PropTypes.string 
}

QuickTaskSearchItem.defaultProps = {
  searchClasses: ''
}

export default withRouter(QuickTaskSearchItem);