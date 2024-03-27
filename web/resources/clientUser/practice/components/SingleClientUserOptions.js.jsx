import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../../../../global/components/Binder.js.jsx';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';

class SingleClientUserOptions extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      showAlertModal: false
      , submitting: false
    }
    this._bind(
      '_toggleAlertModal'
      , '_handleSubmit'
    )
  }

  _toggleAlertModal() {
    this.setState({showAlertModal: !this.state.showAlertModal}); 
  }

  _handleSubmit() {
    const { setStatus } = this.props;
    this.setState({  submitting: true }, () => {
      setStatus("deleted");
    });
  }

  render() {
    const {
        isOpen
        , setStatus
        , handleRemoveFromClient
        , singleClientUser
        , archived
        , match
        , closeAction
    } = this.props;

    const { showAlertModal, submitting } = this.state;

    return (
      <span className="single-file-options"style={singleClientUser ? { position: "absolute" } : {position: "absolute", right: "120px" } }>
        <TransitionGroup >
          { isOpen ?
            <CSSTransition
              classNames="dropdown-anim"
              timeout={250}
            >
              {
                singleClientUser ?
                <ul className="dropMenu -options-menu">
                  <li className="-option">
                    <a onClick={this._toggleAlertModal} className="-delete-link">Remove from Client</a>
                  </li>
                  {
                    archived ? 
                    <li className="-option">
                        <a className="-delete-link" onClick={() => this.setState({ showAlertModal: true })}>Delete Contact</a>
                    </li>
                    : null
                  }
                  <li className="-option">
                      <a onClick={() => setStatus(archived ? "active" : "archived")}>{archived ? "Reinstate Contact" : "Archive Contact"}</a>
                  </li>
                </ul> 
                :
                <ul className="dropMenu -options-menu">
                  {
                    archived ? 
                    <li className="-option">
                        <Link onClick={closeAction} to={`/firm/${match.params.firmId}/clients/${match.params.clientId}/contacts`}>View Contacts</Link>
                    </li>
                    :
                    <li className="-option">
                        <Link onClick={closeAction} to={`/firm/${match.params.firmId}/clients/${match.params.clientId}/contacts/archived`}>View Archive</Link>
                    </li>                          
                  }
                </ul>                     
              }
            </CSSTransition>
            :
            null
          }
        </TransitionGroup>
        <AlertModal
          alertMessage={"Are you sure? This cannot be undone."}
          alertTitle={"Delete this contact?"}
          closeAction={this._toggleAlertModal}
          confirmAction={this._handleSubmit}
          confirmText={"Delete"}
          declineAction={this._toggleAlertModal}
          declineText={"Cancel"}
          isOpen={showAlertModal}
          type={'danger'}
          disableConfirm={submitting}
        >
        </AlertModal>          
      </span>
    )
  }
}

SingleClientUserOptions.propTypes = {
  isOpen: PropTypes.bool.isRequired
  , openQuickTaskModal: PropTypes.func
}

SingleClientUserOptions.defaultProps = {

}

export default withRouter(SingleClientUserOptions);