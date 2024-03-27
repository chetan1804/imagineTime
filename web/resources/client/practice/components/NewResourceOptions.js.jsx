import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../../../../global/components/Binder.js.jsx';
import { Link, withRouter } from 'react-router-dom';

import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import { DateTime } from 'luxon';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import { permissions  } from '../../../../global/utils';

class NewResourceOptions extends Binder {
  constructor(props) {
    super(props);
    this.state = {
    }
  }


  render() {
    const {
      close 
      , match 
    } = this.props;


    return (
      <TransitionGroup >
        { this.props.isOpen ?
          <CSSTransition
            classNames="dropdown-anim"
            timeout={250}
          >
            <ul className="dropMenu -options-menu">
              <li  className="-option">
                <Link to={`/firm/${match.params.firmId}/clients/${match.params.clientId}/files/new`}>Upload files</Link>
              </li>
              <li  className="-option">
                {/* This link goes nowhere. -Wes */}
                {/* <Link to={`/firm/${match.params.firmId}/clients/${match.params.clientId}/staff/new`}>Add note</Link> */}
              </li>
            </ul>
          </CSSTransition>
          :
          null
        }
      </TransitionGroup>
    )
  }
}

NewResourceOptions.propTypes = {
  close: PropTypes.func.isRequired
  , isOpen: PropTypes.bool.isRequired
}

NewResourceOptions.defaultProps = {
  notifications: []
}

export default withRouter(NewResourceOptions);