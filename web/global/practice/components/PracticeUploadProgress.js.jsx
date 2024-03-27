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

class PracticeUploadProgress extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      errorMessage: null
      , progressPercent: 0
      , responseData: null
      , uploading: false
    }
    this._bind(
      '_close'
      , '_exportResultsReport'
    )
    const {
      dispatch
      , match
      , socket
    } = props;

    socket.on('start_upload', () => {
      // console.log('STARTING UPLOAD');
      this.setState({
        uploading: true
      })
    })

    socket.on('upload_status', progressPercent => {
      // console.log('progressPercent', progressPercent);
      this.setState({
        progressPercent: progressPercent
        , uploading: true
      })
    });

    socket.on('finish_upload', responseData => {
      // console.log('FINSIHED UPLOAD', responseData);
      this.setState({
        progressPercent: 100
        , responseData: responseData
      })
      dispatch(clientActions.fetchList('_firm', match.params.firmId))
      dispatch(userActions.fetchList('_firm', match.params.firmId));
      this.props.openAction()
    });

    socket.on('upload_error', error => {
      // console.log('UPLOAD ERROR', error);
      this.setState({
        errorMessage: error
        , uploading: false
      })
      this.props.openAction()
    })
  }

  componentWillUnmount() {
    // Remove event listeners
    const { socket } = this.props;
    socket.off('start_upload')
    socket.off('upload_status')
    socket.off('finish_upload')
    socket.off('upload_error')
  }

  _close() {
    this.setState({
      progressPercent: 0
      , responseData: null
      , uploading: false
    }, () => this.props.close())
  }

  _exportResultsReport() {
    const { responseData } = this.state;
    let csv = inviteUtils.generateResultsReport(responseData);
    const filename = `CLIENT_IMPORT_RESULTS_${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}.csv`
    // download as a file when the user clicks the button
    let csvFile = new Blob([csv], {type: 'text/csv'});
    let data = URL.createObjectURL(csvFile)
    let link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    link.click();
  }

  render() {
    const {
      openAction
      , isOpen
    } = this.props;

    const { errorMessage, uploading, progressPercent, responseData } = this.state

    let progressClass = classNames(
      `progress-bar-${progressPercent || 0}`
    )

    return (
      uploading ?
      <div>
        <div className="action-link upload-progress-container"  onClick={openAction}>
          <small>{`Import Progress ${progressPercent}%`}</small>
          <div className={progressClass} >
            <div className="-progress">
              <div className="-complete">
              </div>
            </div>
          </div>
        </div>
        <TransitionGroup >
        {isOpen ?
          <CSSTransition
            classNames="dropdown-anim"
            timeout={250}
          >
            <div className="card dropMenu">
              <div className="card-body">
                { responseData ?
                <div style={{minWidth: '200px'}}>
                  <h3>Import Results</h3>
                  <br/>
                  <p><strong>Clients submitted: </strong> {responseData.results.length}</p>
                  <p><strong>Invitations sent: </strong> {responseData.successfulInvites}</p>
                  <p><strong>Existing Clients: </strong> {responseData.existingClients}</p>
                  <p><strong>Existing Users: </strong> {responseData.existingUsers}</p>
                  <p><strong>Errors: </strong> {responseData.errors}</p>
  
                  <p className="u-centerText">
                    <button className="yt-btn x-small" onClick={this._exportResultsReport}>Download Report</button>
                  </p>
                </div>
                :
                errorMessage ?
                <div className="warn">
                  <p className="u-centerText">
                   {errorMessage}
                  </p>
                </div>
                :
                <div>
                  <p className="u-centerText">
                    WORKING...
                  </p>
                </div>
              }
              </div>
            </div>
          </CSSTransition>
          :
          null
        }
      </TransitionGroup>
      </div>
      :
      null
    )
  }
}

PracticeUploadProgress.propTypes = {
  dispatch: PropTypes.func.isRequired
}

PracticeUploadProgress.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    socket: store.user.socket
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PracticeUploadProgress)
);
