/**
 * View component for /firm/:firmId/workspaces/:clientId/files 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import { Helmet } from 'react-helmet';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

class SingleRequestOptions extends Binder {
  constructor(props) {
    super(props);
    this.state = {}
    this._bind()
  }

  render() {
    const { 
        isOpen
        , request
        , handleUpdateName
    } = this.props;

    return (
        <span className="single-file-options"style={{position: "absolute"}}>
            <TransitionGroup >
            { isOpen ?
                <CSSTransition
                classNames="dropdown-anim"
                timeout={250}
                >
                    <ul className="dropMenu -options-menu">
                        <li  className="-option">
                            <a onClick={handleUpdateName}>Update Name</a>
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

SingleRequestOptions.propTypes = {
  dispatch: PropTypes.func.isRequired
}

SingleRequestOptions.defaultProps = {

}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(SingleRequestOptions)
);
