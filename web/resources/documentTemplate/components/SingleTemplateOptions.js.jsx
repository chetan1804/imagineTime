import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../../../global/components/Binder.js.jsx';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _, { isNull } from 'lodash';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import AlertModal from '../../../global/components/modals/AlertModal.js.jsx';

import * as documentTemplateActions from '../documentTemplateActions';

class SingleTemplateOptions extends Binder {
  constructor(props) {
    super(props);
    this.state = {

    }
  }

  render() {
    const {
        isOpen
        , closeAction
        , template
        , match
        , toggleUpdateTemplateName
        , handleOpenModal
    } = this.props;

    return (
      <span className="single-file-options"style={{position: "absolute"}}>
        <TransitionGroup >
          { isOpen ?
            <CSSTransition
              classNames="dropdown-anim"
              timeout={250}
            >
                <ul className="dropMenu -options-menu" style={{ left: "-5px" }}>
                    <li  className="-option">
                        <a onClick={toggleUpdateTemplateName}>Rename</a>
                    </li>
                    <li  className="-option">
                        <a onClick={() => handleOpenModal("file_signature", template)}>Request Signature</a>
                    </li>
                </ul>
            </CSSTransition>
            :
            null
          }
        </TransitionGroup>      
      </span>
    )
  }
}

SingleTemplateOptions.propTypes = {
  isOpen: PropTypes.bool.isRequired
  , openQuickTaskModal: PropTypes.func
}

SingleTemplateOptions.defaultProps = {

}

export default withRouter(SingleTemplateOptions);