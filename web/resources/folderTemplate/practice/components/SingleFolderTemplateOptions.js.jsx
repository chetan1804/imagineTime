import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../../../../global/components/Binder.js.jsx';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _, { isNull } from 'lodash';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';

class SingleFolderTemplateOptions extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    const {
        isOpen
        , closeAction
        , folderTemplate
        , match
        , dispatch
        , deleteFolderTemplate
        , handleDeleteWarningModal
        , deleteShowWarning
    } = this.props;


    return (
      <span className="single-file-options"style={{position: "absolute"}}>
        <AlertModal
          alertMessage={<div><p>Delete folder <b>{folderTemplate && folderTemplate.name}</b></p></div> }
          alertTitle="Delete"
          closeAction={handleDeleteWarningModal}
          confirmAction={deleteFolderTemplate}
          confirmText="Okay"
          isOpen={deleteShowWarning}
          type="danger"
        />
        <TransitionGroup >
          { isOpen ?
            <CSSTransition
              classNames="dropdown-anim"
              timeout={250}
            >
                <ul className="dropMenu -options-menu" style={{ left: '-1.5em' }}>
                    <li  className="-option">
                        <Link onClick={closeAction} to={`${match.url}/${folderTemplate._id}/update`}>Update</Link>
                    </li>
                    <li  className="-option">
                        <a onClick={handleDeleteWarningModal}>Delete</a>
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

SingleFolderTemplateOptions.propTypes = {
  isOpen: PropTypes.bool.isRequired
  , openQuickTaskModal: PropTypes.func
}

SingleFolderTemplateOptions.defaultProps = {

}

export default withRouter(SingleFolderTemplateOptions);