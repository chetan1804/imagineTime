/**
 * Reusable component for editing details of a workflow
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

const ClientWorkflowSearchItem = ({
  clientWorkflow 
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
          {clientWorkflow.title}
        </div>
        <div className="-description">
          {clientWorkflow.description}
        </div>
        <div className="-items">
          {clientWorkflow.items.length} items 
        </div>
        <div className="-tags">
          {/** TODO: add tags  */}
        </div>
      </div>
      <div className="-arrow">
        <i className="-i fal fa-chevron-right"/>
      </div>
    </Link>
  )
}

ClientWorkflowSearchItem.propTypes = {
  clientWorkflow: PropTypes.object.isRequired
  , path: PropTypes.string.isRequired  
  , searchClasses: PropTypes.string 
}

ClientWorkflowSearchItem.defaultProps = {
  searchClasses: ''
}

export default withRouter(ClientWorkflowSearchItem);