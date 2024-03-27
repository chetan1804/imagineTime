/**
 * Reusable dropdown to pick new client options.
 */

// import primary libararies
import React from 'react';
import PropTypes from 'prop-types';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Link, withRouter } from 'react-router-dom';

const NewStaffOptionMenu = ({
  firmId
  , isOpen 
  , handleNewStaff
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
              <strong>Add staffs</strong>
            </li>
            <li  className="-option">
              <a to="" className="-select" onClick={() => handleNewStaff()}>Create new staff</a>
            </li>
            <li  className="-option">
              <Link to={`/firm/${firmId}/settings/staff/import`} className="-select">Bulk staff upload</Link>
            </li>
          </ul>
        </CSSTransition>
        :
        null
      }
    </TransitionGroup>
  )
}

NewStaffOptionMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired
}

NewStaffOptionMenu.defaultProps = {
  isOpen: false
}

export default withRouter(NewStaffOptionMenu);