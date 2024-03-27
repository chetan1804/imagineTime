/**
 * Upload progress meter dispalyed in the top nav. Currently only used for bulk client imports. Could be expanded to work for file uploads.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import classNames from 'classnames';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import actions
import * as clientActions from '../../../resources/client/clientActions';
import * as userActions from '../../../resources/user/userActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import utils components
import inviteUtils from '../../utils/inviteUtils';

class PracticeProgress extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      errorMessage: null
      , progressPercent: 0
      , actionText: ''
    }
    this._bind(
      '_close'
    )
    const {
      dispatch
      , match
      , socket
      , loggedInUser
    } = props;

    socket.on('start_progress', (actionText) => {
      // console.log('STARTING UPLOAD');
      this.setState({ actionText }, () => {
        this.props.openAction();
      });
    })

    socket.on('progress_status', progressPercent => {
      console.log('progressPercent', progressPercent);
      this.setState({
        progressPercent: progressPercent
      })
    });

    socket.on('finish_progress', (actionText) => {
      // console.log('FINSIHED UPLOAD', responseData);
      this.setState({ actionText }, () => {
        this.props.close();
      });
    });

    socket.on('progress_error', error => {
      // console.log('UPLOAD ERROR', error);
      this.setState({
        errorMessage: error
      })
      this.props.close();
    })
  }

  componentWillUnmount() {
    // Remove event listeners
    const { socket } = this.props;
    socket.off('start_progress')
    socket.off('progress_status')
    socket.off('finish_progress')
    socket.off('progress_error')
  }

  _close() {
    this.setState({
      progressPercent: 0
      , responseData: null
    }, () => this.props.close())
  }

  render() {
    const {
      openAction
      , isOpen
    } = this.props;

    const { 
      errorMessage
      , progressPercent
      , responseData
      , actionText
    } = this.state

    let progressClass = classNames(
      `progress-bar-${progressPercent || 0}`
    )

    return (
      isOpen ?
      <div>
        <div className="action-link upload-progress-container"  onClick={openAction}>
          <small>{`${actionText} ${progressPercent}%`}</small>
          <div className={progressClass} >
            <div className="-progress">
              <div className="-complete">
              </div>
            </div>
          </div>
        </div>
      </div>
      :
      null
    )
  }
}

PracticeProgress.propTypes = {
  dispatch: PropTypes.func.isRequired
}

PracticeProgress.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    socket: store.user.socket
    , loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PracticeProgress)
);