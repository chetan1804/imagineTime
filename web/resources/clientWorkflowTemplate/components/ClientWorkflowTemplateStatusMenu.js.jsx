/**
 * Reusable dropdown to change workflow template status.
 */

// import primary libararies
import React from 'react';
import PropTypes from 'prop-types';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
// import { withRouter } from 'react-router-dom';

// import third-party libraries
// import classNames from 'classnames';

const ClientWorkflowTemplateStatusMenu = ({
  handleUpdateStatus
  , isOpen 
}) => {
  // console.log('isOpen': isOpen)
  return (
    <TransitionGroup >
      {isOpen ?
        <CSSTransition
          classNames="dropdown-anim"
          timeout={250}
        >
          <ul className="-task-options">
            <li className="-header">
              <strong>Choose a status</strong> 
            </li>
            {/* This option is for testing only. Comment out on production. */}
            {/* <li className="-option">
              <span className="-select" onClick={() => handleUpdateStatus('draft')}> Revert to Draft </span>
            </li> */}
            <li className="-option">
              <span className="-select" onClick={() => handleUpdateStatus('published')}> Publish Template </span>
            </li>
            <li className="-option">
              <span className="-select" onClick={() => handleUpdateStatus('archived')}> Archive Template </span>
            </li>
          </ul>
        </CSSTransition>
        :
        null
      }
    </TransitionGroup>
  )
}

ClientWorkflowTemplateStatusMenu.propTypes = {
  handleUpdateStatus: PropTypes.func.isRequired 
  , isOpen: PropTypes.bool.isRequired
}

ClientWorkflowTemplateStatusMenu.defaultProps = {
  isOpen: false 
}

export default ClientWorkflowTemplateStatusMenu;
