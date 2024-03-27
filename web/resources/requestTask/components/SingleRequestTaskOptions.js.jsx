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

// import actions
import * as requestTaskActions from '../requestTaskActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

class SingleRequestTaskOptions extends Binder {
  constructor(props) {
    super(props);
    this.state = {}
    this._bind()
  }

  render() {
    const { 
        isOpen
        , requestTask
        , handleUpdateRequestTask 
        , match
        , closeAction
        , isViewing
    } = this.props;

    const newUrl = match.url.lastIndexOf('/task-activity') > 0 ? `${match.url.substr(0, match.url.lastIndexOf('/task-activity'))}` : `${match.url}`;

    return (
        <span className="single-file-options"style={{position: "absolute"}}>
            <TransitionGroup >
            { isOpen ?
                <CSSTransition
                classNames="dropdown-anim"
                timeout={250}
                >
                    <ul className="dropMenu -options-menu">
                        {
                          isViewing === "portal" || match.params.requestTaskStatus !== "published" ? null :
                          <li className="-option">
                            <a onClick={() => handleUpdateRequestTask("completed", requestTask)}>Complete</a>
                          </li>
                        }
                        {
                          isViewing === "portal" || match.params.requestTaskStatus !== "published" ? null :
                          <li className="-option">
                            <a onClick={() => handleUpdateRequestTask("changes", requestTask)}>Request Changes</a>
                          </li>
                        }
                        {
                          isViewing === "portal" || match.params.requestTaskStatus !== "unpublished" ? null :
                          <li className="-option">
                            <a onClick={() => handleUpdateRequestTask("published", requestTask)}>Publish</a>
                          </li>
                        }
                        {
                          isViewing === "portal" || match.params.requestTaskStatus !== "unpublished" ? null :
                          <li className="-option">
                            <a onClick={() => handleUpdateRequestTask("edit", requestTask)}>Update</a>
                          </li>
                        }
                        <li className="-option">
                          <Link onClick={closeAction} to={{ pathname: `${newUrl}/task-activity/${requestTask._id}/detail` , viewingAs: "detail" }}>View Details</Link>
                        </li>
                        <li className="-option">
                          <Link onClick={closeAction} to={{ pathname: `${newUrl}/task-activity/${requestTask._id}/upload`, viewingAs: "upload" }}>View Uploads</Link>
                        </li>
                        <li className="-option">
                          <Link onClick={closeAction} to={{ pathname: `${newUrl}/task-activity/${requestTask._id}/activity`, viewingAs: "activity" }}>Task Activity</Link>
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

SingleRequestTaskOptions.propTypes = {
  dispatch: PropTypes.func.isRequired
}

SingleRequestTaskOptions.defaultProps = {

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
  )(SingleRequestTaskOptions)
);
