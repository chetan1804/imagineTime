/**
 * Reusable dropdown to pick new client options.
 */

// import primary libararies
import React from 'react';
import PropTypes from 'prop-types';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Link, withRouter } from 'react-router-dom';

const NewClientOptionsMenu = ({
  firmId
  , isOpen 
}) => {
  return (
    <TransitionGroup >
      {isOpen ?
        <CSSTransition
          classNames="dropdown-anim"
          timeout={250}
        >
          <ul className="-client-options">
            <li className="-header">
              <strong>Add clients</strong>
            </li>
            <li  className="-option">
              <Link to={`/firm/${firmId}/clients/new`} className="-select">Create new client</Link>
            </li>
            <li  className="-option">
              <Link to={`/firm/${firmId}/clients/import`} className="-select">Bulk client upload</Link>
            </li>
          </ul>
        </CSSTransition>
        :
        null
      }
    </TransitionGroup>
  )
}

NewClientOptionsMenu.propTypes = {
  firmId: PropTypes.number
  , isOpen: PropTypes.bool.isRequired
}

NewClientOptionsMenu.defaultProps = {
  isOpen: false
}

export default withRouter(NewClientOptionsMenu);