import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../../../../global/components/Binder.js.jsx';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import { CSSTransition, TransitionGroup } from 'react-transition-group';


class NewWorkflowOptions extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    const { match } = this.props;

    return (
      <TransitionGroup >
        { this.props.isOpen ?
          <CSSTransition
            classNames="dropdown-anim"
            timeout={250}
          >
            <ul className="dropMenu -options-menu">
              <li  className="-option">
                <Link to={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/client-workflows/new`}>New</Link>
              </li>
              <li  className="-option">
                <Link to={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/client-workflow-templates`}>From template...</Link>
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

NewWorkflowOptions.propTypes = {
  isOpen: PropTypes.bool.isRequired
}

NewWorkflowOptions.defaultProps = {
}

export default withRouter(NewWorkflowOptions);