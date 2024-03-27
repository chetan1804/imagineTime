/**
 * Reusable dropdown to pick which task you'd like to create.
 */

// import primary libararies
import React from 'react';
import PropTypes from 'prop-types';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import classNames from 'classnames';

const ClientTaskOptionsMenu = ({
  handleCreate
  , index 
  , inserting
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
          <ul className="-task-options -open-up">
            <li className="-header">
              { inserting ?
                <strong>Insert a task of type</strong>
                :  
                <strong>Choose a task type</strong> 
              }
            </li>
            <li className="-option">
              <span className="-select" onClick={() => handleCreate(['task', 'text', index])}><span className="-icon -text"><i className="fal fa-text"/></span> Simple text</span>
            </li>
            <li className="-option">
              <span className="-select" onClick={() => handleCreate(['task', 'document-request', index])}><span className="-icon -document-request"><i className="fas fa-file-upload"/></span> Request File</span>
            </li>
            <li className="-option">
              <span className="-select" onClick={() => handleCreate(['task', 'document-delivery', index])}><span className="-icon -document-delivery"><i className="fas fa-paperclip"/></span> Send Files</span>
            </li>
            <li className="-option">
              <span className="-select" onClick={() => handleCreate(['task', 'signature-request', index])}><span className="-icon -signature-request"><i className="fas fa-file-signature"/></span> Request Signature</span>
            </li>
           
            {/* <li  className="-option">
              <span className="-select" onClick={() => handleCreate(['clientWorkflow', null, index])}><span className="-icon -sub-client-workflow"><i className="fal fa-indent"/></span> Sub-tasks</span>
            </li> */}
          </ul>
        </CSSTransition>
        :
        null
      }
    </TransitionGroup>
  )
}

ClientTaskOptionsMenu.propTypes = {
  handleCreate: PropTypes.func.isRequired 
  , index: PropTypes.number 
  , inserting: PropTypes.bool
  , isOpen: PropTypes.bool.isRequired
}

ClientTaskOptionsMenu.defaultProps = {
  index: null 
  , inserting: true
}

export default withRouter(ClientTaskOptionsMenu);