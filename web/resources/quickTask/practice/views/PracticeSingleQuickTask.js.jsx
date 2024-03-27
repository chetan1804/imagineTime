
/**
 * View component for practice/:clientId/quick-tasks/:quickTaskId
 *
 * Displays a single quickTask from the 'byId' map in the clientWorkflow reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import classNames from 'classnames';
import { DateTime } from 'luxon';
import { Helmet } from 'react-helmet';

// import actions
import * as clientActions from '../../../client/clientActions';
import * as fileActions from '../../../file/fileActions';
import * as firmActions from '../../../firm/firmActions';
import * as quickTaskActions from '../../quickTaskActions';
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';

// import utils
import routeUtils from '../../../../global/utils/routeUtils';
import { quickTaskUtils } from '../../../../global/utils'

// import other components.
import FileMicroListItem from '../../../file/components/FileMicroListItem.js.jsx';

class PracticeSingleQuickTask extends Binder {
  constructor(props) {
    super(props);
    this._bind(
      '_setVisibility'
      , '_setStatus'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(quickTaskActions.fetchSingleIfNeeded(match.params.quickTaskId));
    dispatch(fileActions.fetchListIfNeeded('~client', match.params.clientId));
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId))
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
  }

  componentDidUpdate(prevProps) {
    const { dispatch, match } = this.props
    if(match.params.quickTaskId !== prevProps.match.params.quickTaskId) {
      dispatch(quickTaskActions.fetchSingleIfNeeded(match.params.quickTaskId))
      dispatch(fileActions.fetchListIfNeeded('~client', match.params.clientId));
      dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId))
      dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
      dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
    }
  }

  _setVisibility(visibility) {
    const { dispatch, quickTaskStore } = this.props; 
    let newQuickTask = _.cloneDeep(quickTaskStore.selected.getItem()); 
    newQuickTask.visibility = visibility; 
    dispatch(quickTaskActions.sendUpdateQuickTask(newQuickTask)); 
  }

  _setStatus(status) {
    const { dispatch, quickTaskStore } = this.props; 
    let newQuickTask = _.cloneDeep(quickTaskStore.selected.getItem()); 
    newQuickTask.status = status; 
    dispatch(quickTaskActions.sendUpdateQuickTask(newQuickTask)); 
  }

  render() {
    const {
      clientStore 
      , firmStore
      , fileStore
      , match
      , quickTaskStore
      , userStore
      , loggedInUser
    } = this.props;

    const selectedQuickTask = quickTaskStore.selected.getItem();
    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();
    const staffUserList = userStore.util.getList('_firmStaff', match.params.firmId); 
    
    const isEmpty = (
      clientStore.selected.didInvalidate
      || firmStore.selected.didInvalidate
      || !selectedClient
      || !selectedClient._id
      || !selectedFirm
      || !selectedFirm._id
      || !selectedQuickTask
      || !selectedQuickTask._id
    );

    const isFetching = (
      firmStore.selected.isFetching
      || clientStore.selected.isFetching
      || quickTaskStore.selected.isFetching
    )

    const author = staffUserList && selectedQuickTask && userStore.byId[selectedQuickTask._createdBy];
    const progressPercent = quickTaskUtils.getProgressPercent(selectedQuickTask)

    return (
      <PracticeLayout>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <em>Quick task not found.</em>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="yt-container">
              <div className="yt-row with-gutters space-between">
                <div className="yt-col full s_60 m_50">
                  <h3>{selectedClient.name}</h3>
                  <div className="practice-quick-task">
                  {author ? 
                    <p className="-items">Created by {author.firstname} {author.lastname}</p>
                  : null
                  }
                  <p className="-items">{selectedQuickTask.status && selectedQuickTask.status.charAt(0).toUpperCase() + selectedQuickTask.status.slice(1)}</p>
                  </div>
                  { selectedQuickTask.type === 'signature' ?
                      <div className="yt-row">
                        <div className="-icon">
                          { progressPercent === 100 ? 
                            <span style={{color: 'green'}}>
                              <i className="fas fa-check-circle fa-2x"/>
                            </span>
                            : 
                            progressPercent > 0 && progressPercent < 100 ?
                            <span style={{color: 'green'}}>
                              <i className="fad fa-spinner-third fa-2x"></i>
                            </span>
                            :
                            <i className="fal fa-circle fa-2x"/>
                          }
                        </div>
                        { selectedQuickTask.signingLinks.length === 1 ?
                          <p style={{padding: 5}}> 1 signature requested </p>
                        :
                          <p style={{padding: 5}}> {selectedQuickTask.signingLinks.length} signatures requested</p>
                        }
                      </div>
                    :
                    selectedQuickTask.type === 'file' ?
                    <div>file request</div>
                    :
                    null
                  }
                  <div>
                    {selectedQuickTask._returnedFiles && selectedQuickTask._returnedFiles.length > 0 ?
                      <div className="task">
                        <p className="-header">Returned Files</p>
                        <div className="yt-row">
                        { selectedQuickTask._returnedFiles.map((file) => 
                          <FileMicroListItem
                            key={file}
                            file={fileStore.byId[file]}
                            filePath={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/files/${file}`}
                          />
                        )}
                        </div>
                      </div>
                    : null
                    }
                    {selectedQuickTask._unsignedFiles && selectedQuickTask._unsignedFiles.length > 0 ?
                      <div className="task">
                        <p className="-header">Unsigned Files</p>
                        <div className="yt-row">
                        { selectedQuickTask._unsignedFiles.map((file) => 
                          <div> 
                              <FileMicroListItem
                                key={file}
                                file={fileStore.byId[file]}
                                filePath={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/files/${file}`}
                              />
                          </div>
                        )}
                        </div>
                      </div>
                    : null
                    }
                  </div>
                  <div className="yt-row">
                    {selectedQuickTask.status == 'open' ? 
                      <button className="yt-btn disabled x-small" onClick={() => this._setStatus('closed')}>Close Task</button>
                    :
                      <button className="yt-btn disabled success x-small" onClick={() => this._setStatus('open')}>Open Task</button>
                    }
                    {selectedQuickTask.visibility == 'active' ? 
                      <button className="yt-btn disabled bordered x-small" onClick={() => this._setVisibility('archived')}>Archive</button>
                    :
                      <button className="yt-btn disabled success bordered x-small" onClick={() => this._setVisibility('active')}>Activate</button>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </PracticeLayout>
    )
  }
}

PracticeSingleQuickTask.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    clientStore: store.client
    , fileStore: store.file
    , firmStore: store.firm
    , quickTaskStore: store.quickTask
    , tagStore: store.tag
    , userStore: store.user
    , loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeSingleQuickTask)
);
