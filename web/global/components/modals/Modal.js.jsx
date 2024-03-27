/**
 * Generic modal component. Uses CSSTransitionGroup to animate entry (which
 * is configurable), and renders a modal header and modal body wrapped in a card
 * of a given size as passed in via props
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import third-party libraries
import classNames from 'classnames';

// import components
import Binder from '../Binder.js.jsx';

//import global components
import CheckboxInput from '../../../global/components/forms/CheckboxInput.js.jsx';

class Modal extends Binder {
  constructor(props) {
    super(props);
  }
  render() {
    const {
      btnColor
      , cardSize
      , closeAction
      , closeText
      , confirmAction
      , confirmText
      , disableConfirm
      , fixed
      , headerStyle
      , isOpen
      , modalClasses
      , modalHeader
      , showButtons
      , showClose
      , showConfirm
      , progressDetail
      , progressRun
      , showExit
      , tcCheckboxAction
      , tcCheckboxStatus
      , showTermsConditionsCB
    } = this.props;
    // console.log(isOpen)
    const topClass = classNames(
      'topbar'
    )
    const confirmBtnClass = classNames(
      'yt-btn small'
      , btnColor
    )

    const closeBtnClass = classNames(
      'yt-btn x-small '
      , modalClasses
    )

    const linkBtnClass = classNames(
      'yt-btn small'
      , 'link'
      , btnColor
    )

    const modalClass = classNames(
      modalClasses
      , { 
        'standard-modal': !fixed
        , 'fixed-modal': fixed
      }
    )

    const colClass = classNames(
      'yt-col'
      , 'full'
      , {
        's_75 m_40 l_25 xl_20':  cardSize === 'small'
        , 's_75 m_50 l_33': !cardSize || cardSize === 'standard'
        , 's_75  l_50': cardSize === 'large'
        , 's_80': cardSize === 'jumbo'
        , 's_90': cardSize === "jumbo_90"
      }
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
      <TransitionGroup>
        {isOpen ?
          <CSSTransition
            timeout={500}
            classNames="modal-anim"
          >
            <div className={modalClass}>
              <div className={colClass}>
                <div className="card">
                  <div className="card-header" style={headerStyle}>
                    <div className="yt-row center-vert space-between">
                      {modalHeader}
                      {
                        showExit ?  
                        <button className={closeBtnClass} onClick={()=>closeAction()}>
                          <i className="far fa-times" />
                        </button> : null
                      }
                    </div>
                  </div>
                  <div className="card-body">
                    {this.props.children}
                  </div>
                  { showButtons ?
                    <div className="card-footer">
                      <div className="yt-row space-between">
                        { closeText && showClose ?
                          <button type="button" className={linkBtnClass} onClick={()=> closeAction()}>{closeText}</button>
                          :
                          showTermsConditionsCB ?
                          null
                          :
                          <div/>
                        }
                        {
                          showTermsConditionsCB ? 
                          <div>
                            <CheckboxInput
                              name="tc-cb"
                              value={tcCheckboxStatus}
                              change={() => tcCheckboxAction()}
                              checked={tcCheckboxStatus}
                              label={'I agree to these Terms & Conditions'}
                            />
                          </div>
                          :
                          null
                        }
                        { confirmAction && showConfirm ?
                          <button type="button" className={confirmBtnClass} onClick={()=> confirmAction()} disabled={disableConfirm}>{confirmText || "Done"}</button>
                          :
                          <div/>
                        }
                      </div>
                      {
                        progressRun && progressDetail.filename ? 
                        <div className="upload-progress-container">
                          <p>processing {`${progressDetail.category ? progressDetail.category === "folder" ? "file" : "folder" : ""}:`} {progressDetail.filename}...</p>
                          <div className={`progress-bar-${progressDetail.percent}`}>
                            <div className="-progress"><div className="-complete"></div></div>
                          </div>
                        </div> : null
                      }
                    </div>
                    :
                    // null
                    <div className="card-footer"/>

                  }
                </div>
              </div>
            </div>
          </CSSTransition>
          :
          null
        }
      </TransitionGroup>
    )
  }
}

Modal.propTypes = {
  btnColor: PropTypes.string
  , cardSize: PropTypes.oneOf(['small', 'standard', 'large', 'jumbo', 'jumbo_90'])
  , closeAction: PropTypes.func.isRequired
  , closeText: PropTypes.string
  , confirmAction: PropTypes.func
  , confirmText: PropTypes.any
  , disableConfirm: PropTypes.bool
  , fixed: PropTypes.bool 
  , headerStyle: PropTypes.any
  , isOpen: PropTypes.bool.isRequired
  , modalHeader: PropTypes.any
  , modalClasses: PropTypes.string
  , showButtons: PropTypes.bool
  , showClose: PropTypes.bool
  , showConfirm: PropTypes.bool
  , showExit: PropTypes.bool
  , showTermsConditionsCB: PropTypes.bool
  , tcCheckboxStatus: PropTypes.bool
  , tcCheckboxAction: PropTypes.func
}

Modal.defaultProps = {
  btnColor: 'info'
  , cardSize: 'standard'
  , closeText: 'Close'
  , confirmAction: null
  , confirmText: null 
  , disableConfirm: false
  , fixed: false 
  , headerStyle: null
  , modalHeader: null
  , modalClasses: 'white link '
  , showButtons: true
  , showClose: true
  , showConfirm: true
  , showExit: true
  , showTermsConditionsCB: false 
  , tcCheckboxStatus: false
}

export default Modal;

