import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../../../../global/components/Binder.js.jsx';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

class PracticeQuickTaskOptions extends Binder {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
    const {
      handleOpenQuickTaskModal
      , archiveQuickTask
      , reinstateQuickTask
      , quickTask
      , isOpen
    } = this.props;

    return (
      <span className="single-file-options"style={{position: "absolute"}}>
        <TransitionGroup >
          { isOpen ?
            <CSSTransition
              classNames="dropdown-anim"
              timeout={250}
            >
            {quickTask && quickTask.visibility && quickTask.visibility == 'active' ? 
              <ul className="dropMenu -options-menu">
                <li className="-option">
                  <a onClick={archiveQuickTask}>Archive Task</a>
                </li>
                {/* <li  className="-option">

                </li> */}
              </ul>
            : quickTask && quickTask.visibility && quickTask.visibility == 'archived' ?
              <ul className="dropMenu -options-menu">
                <li className="-option">
                  <a onClick={reinstateQuickTask}>Reinstate Task</a>
                </li>
                {/* <li  className="-option">

                </li> */}
              </ul>
            : null
            }
            </CSSTransition>
            :
            null
          }
        </TransitionGroup>
      </span>
    )
  }
}

PracticeQuickTaskOptions.propTypes = {
  isOpen: PropTypes.bool.isRequired
  , openQuickTaskModal: PropTypes.func
}

PracticeQuickTaskOptions.defaultProps = {

}

export default withRouter(PracticeQuickTaskOptions);