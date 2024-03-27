import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../../../../global/components/Binder.js.jsx';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';

class SingleClientOptions extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      showAlertModal: false
    }
    this._bind(
      '_toggleAlertModal'
    )
  }

  _toggleAlertModal() {
    this.setState({showAlertModal: !this.state.showAlertModal}); 
  }

  render() {
    const {
        isOpen
        , setStatus
        , singleClient
        , archived
        , match
    } = this.props;

    return (
      <span className="single-file-options"style={singleClient ? { position: "absolute" } : {position: "absolute", right: "120px" } }>
        <TransitionGroup >
          { isOpen ?
            <CSSTransition
              classNames="dropdown-anim"
              timeout={250}
            >
                {
                    singleClient ?
                    <ul className="dropMenu -options-menu">
                        {
                          archived ? 
                          <li className="-option">
                              <a className="-delete-link" onClick={() => this.setState({ showAlertModal: true })}>Delete Client</a>
                          </li>
                          : null
                        }
                        <li className="-option">
                            <a onClick={() => setStatus(archived ? "visible" : "archived")}>{archived ? "Reinstate Client" : "Archive Client"}</a>
                        </li>
                    </ul> 
                    :
                    <ul className="dropMenu -options-menu">
                        {
                          archived ? 
                          <li className="-option">
                              <Link to={`/firm/${match.params.firmId}/clients`}>View Clients</Link>
                          </li>
                          :
                          <li className="-option">
                              <Link to={`/firm/${match.params.firmId}/clients/archived`}>View Archive</Link>
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
          alertTitle={"Delete this client?"}
          closeAction={this._toggleAlertModal}
          confirmAction={() => setStatus("deleted")}
          confirmText={"Delete"}
          declineAction={this._toggleAlertModal}
          declineText={"Cancel"}
          isOpen={this.state.showAlertModal}
          type={'danger'}
        >
        </AlertModal>          
      </span>
    )
  }
}

SingleClientOptions.propTypes = {
  isOpen: PropTypes.bool.isRequired
  , openQuickTaskModal: PropTypes.func
}

SingleClientOptions.defaultProps = {

}

export default withRouter(SingleClientOptions);