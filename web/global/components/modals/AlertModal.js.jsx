/**
 * Helper component that should be used to replace generic javascript alert()
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import third-party libraries
import classNames from 'classnames';

// import components
import Binder from '../Binder.js.jsx';

class AlertModal extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      alertMessage
      , alertTitle
      , closeAction
      , confirmAction
      , confirmText
      , declineAction
      , declineText
      , isOpen
      , type

      // this props only for bulk invite: ability to add another button
      , addConfirmText
      , addConfirmAction
      , addFooterClass

      , disableConfirm
    } = this.props;

    const topClass = classNames(
      'topbar'
      , type
    )

    const closeBtnClass = classNames(
      'yt-btn x-small u-pullRight'
      , type
    )

    const btnClass = classNames(
      'yt-btn'
      , type
    )

    const linkBtnClass = classNames(
      'yt-btn'
      , 'link'
      , type
    )

    const alertClass = classNames(
      'card-header'
      , 'alert-message'
      , type
    )

    /**
     * This conditional tells the HTML <body> that there is a modal open, so we
     * should prevent scrolling
     */
    if(isOpen) {
      document.body.classList.toggle('modal-open', true);
    } else {
      document.body.classList.toggle('modal-open', false);
    }

    return (
      <TransitionGroup >
        {isOpen ?
          <CSSTransition
            classNames="modal-anim"
            timeout={500}
          >
            <div className="alert-modal">
              <div className={`yt-col full s_75 m_50 l_33 xl_25 ${addFooterClass ? addFooterClass : null}`}>
                <div className="card">
                  <div className={alertClass}>
                    {alertTitle}
                    <button className={closeBtnClass} onClick={()=>closeAction()}>
                      <i className="fa fa-times" />
                    </button>
                  </div>
                  <div className="card-body">
                    {alertMessage ? alertMessage : this.props.children}
                  </div>
                  <div className={`card-footer ${addFooterClass ? addFooterClass : null}`}>
                    <div className="yt-row space-between">
                      { declineAction ?
                        <button className={linkBtnClass} onClick={()=> declineAction()} disabled={disableConfirm}>{declineText}</button>
                        : 
                        <button className={linkBtnClass} onClick={()=> closeAction()} disabled={disableConfirm}>{declineText}</button>
                      }

                      {/* this button only for bulk invite: start */}
                      {
                        addConfirmAction && addConfirmText ?
                        <button type="button" className={btnClass} onClick={()=> addConfirmAction()} disabled={disableConfirm}>{addConfirmText || "Done"}</button>
                        : null
                      }
                      {/* :end */}

                      { confirmAction ?
                        <button className={btnClass} onClick={()=> confirmAction()} disabled={disableConfirm}>{confirmText}</button>
                        :
                        <div/>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CSSTransition>
          : null
        }
      </TransitionGroup>
    )
  }
}

AlertModal.propTypes = {
  alertMessage: PropTypes.any
  , alertTitle: PropTypes.string.isRequired
  , closeAction: PropTypes.func.isRequired
  , confirmAction: PropTypes.func
  , confirmText: PropTypes.string
  , declineAction: PropTypes.func
  , declineText: PropTypes.string
  , isOpen: PropTypes.bool.isRequired
  , type: PropTypes.oneOf(['info', 'danger', 'warning', 'success'])
}

AlertModal.defaultProps = {
  confirmAction: null
  , confirmText: ''
  , declineAction: null
  , declineText: ''
  , type: 'info'
}

export default AlertModal;
