
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
import toast from 'react-simple-toasts';

// import utils
import routeUtils from '../../../../global/utils/routeUtils';
import { quickTaskUtils } from '../../../../global/utils'

// import other components.
import FileMicroListItem from '../../../file/components/FileMicroListItem.js.jsx';

class PracticeQuickTaskQuickView extends Binder {
  constructor(props) {
    super(props);
    this._bind(
      '_setVisibility'
      , '_setStatus'
      , '_handleSignatureReminder'
      , '_handleRequestFileReminder'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props
    dispatch(quickTaskActions.fetchSingleIfNeeded(match.params.quickTaskId)).then(qtRes => {
      if(qtRes.success) {
        /**
         * NOTE: We are depending on the file fetch by ~client to put all relevant files in the map,
         * however it's possible for the unsigned file on a signature request to NOT have a reference to
         * the client. Fetch it here just in case.
         * 
         * If we don't fetch it here then the file list item will tell the user that it's been deleted
         * when it's really just missing from the map.
         */
        if(qtRes.item._unsignedFiles && qtRes.item._unsignedFiles.length === 1) {
          dispatch(fileActions.fetchSingleFileById(qtRes.item._unsignedFiles[0]))
        }
      }
    })
    dispatch(fileActions.fetchListIfNeeded('~client', match.params.clientId));
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId))
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId)); 
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
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

  _handleSignatureReminder() {
    const { dispatch, match } = this.props; 
    const quickTaskId = match.params.quickTaskId;
    dispatch(quickTaskActions.sendSignatureReminder(quickTaskId)).then(json => {
      if (json.success)  {
        toast("Reminder sent on email.", { position: 'top-center', clickClosable: true });
      }
    }); 
  }

  _handleRequestFileReminder() {
    const { dispatch, match } = this.props; 
    const quickTaskId = match.params.quickTaskId;
    dispatch(quickTaskActions.sendRequestFileReminder(quickTaskId)); 
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

    // const unsignedFilesList = selectedQuickTask && selectedQuickTask._unsignedFiles.map(fileId => fileStore.byId[fileId] && fileStore.byId[fileId].status != "deleted" ? fileStore.byId[fileId] : null);

    return (
      <div className="quick-view">
        <div className="-header">
          <Link to={`${match.url.substring(0, match.url.indexOf('/quick-view'))}`}>Close</Link>
        </div>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div> 
            : 
            <div className="hero -empty-hero">
              <div className="u-centerText">
                <p>Empty. </p>
              </div>
            </div>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="-body" >
              <div className="yt-container">
                <div className="yt-row with-gutters space-between">
                  <div className="yt-col full">
                    <div className="u-pullRight">
                      <small>
                        {DateTime.fromISO(selectedQuickTask.created_at).toFormat('LLL d yyyy')}
                      </small>
                    </div>
                    <div className="yt-row center-vert">
                      <div className="-icon">
                        <i className="fas fa-file-signature fa-2x"></i>
                      </div>
                      <div className="padding">
                        {selectedQuickTask.type == 'signature' ? 
                          <small className="header-text">Signature Request</small>
                        : 
                          "File Request"
                        }
                        {author ? 
                          <p className="-info">Created by {author.firstname} {author.lastname}</p>
                          : null
                        }
                      </div>
                    </div>
                    <div className="practice-quick-task">
                      <div>
                        <div dangerouslySetInnerHTML={{__html: selectedQuickTask.prompt || ""}}></div>
                      </div>
                      <br/>
                      { selectedQuickTask.type === 'signature' ?
                          <div className="yt-row center-vert">
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
                            <div className="padding">
                            { selectedQuickTask.signingLinks.length === 1 ?
                             <p className="signed-text">{selectedQuickTask._returnedFiles.length}/{selectedQuickTask.signingLinks.length} signatures</p>
                            :
                              null
                            }
                            </div>
                          </div>
                        :
                        null
                      }
                      <br/>
                      {selectedQuickTask.signingLinks.length > 0 ? 
                        <div>
                          <small className="sub-header-text">Recipients:</small>
                          <div>
                          {selectedQuickTask.signingLinks.map((link, i) => 
                            <small key={link.signatoryEmail + '_' + i}>{ i !== 0 ? ', ' + link.signatoryEmail : link.signatoryEmail }</small>
                          )}
                          </div>
                        </div>
                      : null
                      }
                      <br/>
                      <div>
                        {selectedQuickTask.status != 'closed' && selectedQuickTask._unsignedFiles && selectedQuickTask._unsignedFiles.length > 0 ?
                          <div>
                            <small className="sub-header-text">Unsigned Files</small>
                            <div>
                            { fileStore && fileStore.byId ? selectedQuickTask._unsignedFiles.map((file) =>
                              fileStore.byId[file] ?
                              <FileMicroListItem
                                key={file}
                                file={fileStore.byId[file]}
                                filePath={fileStore.byId[file]._client ? `/firm/${match.params.firmId}/workspaces/${match.params.clientId}/files/${file}` : `/firm/${match.params.firmId}/files/${file}`}
                                match={this.props.match}
                                viewingAs="quickView"
                              /> : null
                              ) : null }
                            </div>
                          </div>
                        : null
                        }
                        {selectedQuickTask._returnedFiles && selectedQuickTask._returnedFiles.length > 0 ?
                          <div>
                            <small className="sub-header-text">Returned Files</small>
                            <div>
                            { fileStore && fileStore.byId ? selectedQuickTask._returnedFiles.map((file) => 
                              fileStore.byId[file] ?
                              <FileMicroListItem
                                key={file}
                                file={fileStore.byId[file]}
                                filePath={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/files/${file}`}
                                match={this.props.match}
                                viewingAs="quickView"
                              /> : null
                            ) : null }
                            </div>
                          </div>
                        : null
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* {selectedQuickTask.status == 'closed' ?  */}
            <footer className="-footer">
              <div>
                {
                  selectedQuickTask.status === "open" ?
                  (selectedQuickTask.type === "signature" ? <button className="yt-btn success bordered x-small" onClick={this._handleSignatureReminder} style={{marginRight:'10px'}}>Send Reminder</button> : 
                  <button className="yt-btn success bordered x-small" onClick={this._handleRequestFileReminder} style={{marginRight:'10px'}}>Send Reminder</button>)
                  : null
                }
                {selectedQuickTask.visibility == 'active' ? 
                  <button className="yt-btn bordered x-small" onClick={() => this._setVisibility('archived')}>Archive</button>
                :
                  <button className="yt-btn success bordered x-small" onClick={() => this._setVisibility('active')}>Activate</button>
                }
              </div>
            </footer>
          </div>
        }
      </div>
    )
  }
}

PracticeQuickTaskQuickView.propTypes = {
  dispatch: PropTypes.func.isRequired
}

PracticeQuickTaskQuickView.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    addressStore: store.address 
    , clientStore: store.client 
    , clientUserStore: store.clientUser
    , noteStore: store.note
    , firmStore: store.firm 
    , fileStore: store.file
    , loggedInUser: store.user.loggedIn.user
    , phoneNumberStore: store.phoneNumber 
    , userStore: store.user
    , quickTaskStore: store.quickTask
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PracticeQuickTaskQuickView)
);
