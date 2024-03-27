/**
 * Reusable component for Firm users viewing a client task 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import { DateTime } from 'luxon';

// import actions
import * as clientTaskActions from '../../clientTaskActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';

// import resource components
import FileMicroListItem from '../../../file/components/FileMicroListItem.js.jsx';


class PracticeClientTaskViewer extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      submitting: false 
    }
    this._bind(
      '_handleApproveClientTask'
      , '_handleRejectClientTask'
    )
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    // fire actions
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevProps.clientTaskResponses.length < this.props.clientTaskResponses.length) {
      this.setState({showResponder: false});
    }
  }

  _handleApproveClientTask() {
    const { dispatch } = this.props;
    this.setState({
      submitting: true
    });
    let newClientTask = _.cloneDeep(this.props.clientTask)
    newClientTask.status = 'completed'
    dispatch(clientTaskActions.sendUpdateClientTaskStatus(newClientTask)).then(clientTaskRes => {
      if(clientTaskRes.success) {
        console.log('Client task successfully approved.', clientTaskRes.item)
      } else {
        console.error('There was a problem updating client task status', clientTaskRes.error)
      }
      this.setState({
        submitting: false
      })
    })
  }

  _handleRejectClientTask() {
    const { dispatch } = this.props;
    this.setState({
      submitting: true
    });
    let newClientTask = _.cloneDeep(this.props.clientTask)
    newClientTask.status = 'open';
    dispatch(clientTaskActions.sendUpdateClientTaskStatus(newClientTask)).then(clientTaskRes => {
      if(!clientTaskRes.success) {
        alert(clientTaskRes.error);
      } 
      this.setState({
        submitting: false
      })
    })
  }

  render() {
    const {
      fileStore
      , match
      , clientTask
      , clientTaskResponses
      , userStore
    } = this.props;

    const isEmpty = !clientTask; 

    // const isComplete = (clientTask && clientTask.status == 'completed') || (clientTask && clientTask.type !== "signature-request" && !clientTask.needsApproval && clientTaskResponses && clientTaskResponses.length > 0);
    const isComplete = clientTask && clientTask.status == 'completed';
    const awaitingSignatures = clientTask && clientTask.type === 'signature-request' && clientTask.status === 'open' && clientTask.signingLinks.length > 1 && clientTaskResponses.length > 0;
    const signersComplete = clientTaskResponses ? clientTaskResponses.map(response => userStore.byId[response._user]) : [];
    const iconClass = classNames(
      '-icon'
      , { '-completed' : isComplete }
    )

    // TODO: Add some sort of status indicator.
    return (
      <div>
        { isEmpty ? 
          <div className="loading"></div>
          :
          <div className="task-viewer -firm">
            <div className={iconClass}>
              { clientTask && clientTask.status == 'awaitingApproval'? 
                <span style={{color: '#EFC107'}}>
                  <i class="fas fa-exclamation-circle fa-2x"></i>
                </span>
                : isComplete ?
                <span style={{color: 'green'}}>
                  <i className="fas fa-check-circle fa-2x"/>
                </span>
                : awaitingSignatures ?
                <span style={{color: 'green'}}>
                  <i className="fad fa-spinner-third fa-2x"></i>
                </span>
                :
                <i className="fal fa-circle fa-2x"/>
              }
            </div>
            <div className="-content">
              <strong>{clientTask.title}</strong><br/>
              <span>{clientTask.description}</span>
              { awaitingSignatures ?
                clientTask.signingLinks.map((link, i) => {
                  const hasSigned = signersComplete.find(user => user.username === link.signatoryEmail)
                  return (
                    hasSigned ?
                    <p key={clientTask._id + '_' + i} style={{textAlign: 'left', color: 'green'}}><small>{`${link.signatoryEmail} - Complete`}</small></p>
                    :
                    <p key={clientTask._id + '_' + i} style={{textAlign: 'left', color: 'darkorange'}}><small>{`${link.signatoryEmail} - Incomplete`}</small></p>
                  )
                })
                :
                null
              }
              <div className="-task-actions">
              { clientTask._files && clientTask._files.length > 0 ?
                clientTask._files.map((fileId, i) =>
                <FileMicroListItem
                  key={fileId + '_' + i}
                  file={fileStore.byId[fileId]}
                  filePath={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/files/${fileId}`}
                />
                )
                :
                null
              }
              { clientTaskResponses.map((tr, i) =>
                <div key={tr._id + '_' + i}>
                  {tr._files.map((fileId, j) =>
                    <FileMicroListItem
                      key={fileId + '_' + j}
                      file={fileStore.byId[fileId]}
                      filePath={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/files/${fileId}`}
                    />
                  )}
                  <p>{tr.content}</p>
                </div>
              )}
              { clientTask.needsApproval && clientTaskResponses && clientTaskResponses.length > 0 && clientTask.status === 'awaitingApproval' ?
                <div>
                  <button className="yt-btn x-small info " disabled={this.state.submitting} onClick={this._handleApproveClientTask}>{this.state.submitting ? 'Sending...' : 'Approve'}</button>
                  <button className="yt-btn x-small danger " disabled={this.state.submitting} onClick={this._handleRejectClientTask}>{this.state.submitting ? 'Sending...' : 'Reject'}</button>
                </div>
                :
                null 
              }
              </div>
            </div>
      
          </div>
        }
      </div>
    )
  }
}

PracticeClientTaskViewer.propTypes = {
  dispatch: PropTypes.func.isRequired
  , clientTask: PropTypes.object
  , clientTaskResponses: PropTypes.arrayOf(PropTypes.object)
}

PracticeClientTaskViewer.defaultProps = {
  clientTask: null
  , clientTaskResponses: []
}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    fileStore: store.file 
    , firmStore: store.firm
    , loggedInUser: store.user.loggedIn.user
    , userStore: store.user
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PracticeClientTaskViewer)
);
