// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

import { DateTime } from 'luxon'; 

import Binder from '../../../../global/components/Binder.js.jsx';
import { displayUtils } from '../../../../global/utils';
import { CheckboxInput, SelectFromObject } from '../../../../global/components/forms'
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';

// import utils
import { quickTaskUtils } from '../../../../global/utils'

import PracticeQuickTaskOptions from './PracticeQuickTaskOptions.js.jsx';

class PracticeQuickTaskListItem extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      optionsOpen: false
    }
    this._bind(
      '_handleCloseOptionsModal'
      , '_handleOpenOptionsModal'
    )
  }

  _handleCloseOptionsModal(e) {
    e.stopPropagation();
    this.setState({
      optionsOpen: false
    })
  }

  _handleOpenOptionsModal(e) {
    e.stopPropagation();
    this.setState({
      optionsOpen: false
    }, () => this.props.handleOpenQuickTaskModal())
  }

  render() {
    const { clientStore, quickTask, match, archiveQuickTask, reinstateQuickTask, userStore } = this.props; 
    const progressPercent = quickTaskUtils.getProgressPercent(quickTask); 

    const client = clientStore.byId[quickTask._client]; 

    const createdBy = userStore.byId[quickTask._createdBy]; 

    return (
      <div className="table-row">
        <div className="table-cell">
          <div className="yt-row" style={{ minWidth: "55px" }}>
            <div className="-icon">
              { progressPercent === 100 ? 
                <span style={{color: 'green'}}>
                  <i className="fas fa-check-circle fa-1x"/>
                </span>
                : 
                progressPercent > 0 && progressPercent < 100 ?
                <span style={{color: 'green'}}>
                  <i className="fad fa-spinner-third fa-1x"></i>
                </span>
                :
                <i className="fal fa-circle fa-1x"/>
              }
            </div>
            <div className="-checkbox" onClick={() => this.setState({optionsOpen: true})}>
              <div style={{position: "relative", height: "100%", width: "100%"}}>
                <CloseWrapper
                  isOpen={(this.state.optionsOpen)}
                  closeAction={this._handleCloseOptionsModal}
                />
                <i className="far fa-ellipsis-v"></i>
                <PracticeQuickTaskOptions
                  isOpen={this.state.optionsOpen}
                  handleOpenQuickTaskModal={this._handleOpenOptionsModal}
                  quickTask={quickTask}
                  archiveQuickTask={() => archiveQuickTask(quickTask)}
                  reinstateQuickTask={() => reinstateQuickTask(quickTask)}
                />
              </div>
            </div>
          </div>
        </div>
        <Link className="table-cell" to={`${match.url}/quick-view/${quickTask._id}`}>
          <div className="yt-row center-vert">
            <div className="-icon">
            { quickTask.type === 'signature' ?
              <i className="fas fa-file-signature fa-2x"/>
              :
              quickTask.type === 'file' ?
              <i className="fad fa-mail-bulk fa-2x"/>
              :
              <i/>
            }
            </div>
            <div className="-file-info">
              <small>
                <div dangerouslySetInnerHTML={{__html: quickTask.prompt || ""}} style={{ lineHeight: "1em" }}></div>
              </small>
              { quickTask.type === 'signature' ?
                <div className="-items">
                {/* NOTE: _returnedFiles will always equal 0 or 1 because the file is only saved after every signature is done.
                          We should be counting how many signinkLinks have a responseDate, but that is still ineffective because when a
                          signature is done by a user that isn't logged in, we can't really update anything. We may want to just list the 
                          total requested signatures here and whether it is finished or not.
                */}
                {`${quickTask.signingLinks.length} signatures requested` }
                </div>
                :
                quickTask.type === 'file' ?
                <div className="-items">
                </div>
                :
                null
              }
            </div>
          </div>
        </Link>
        <div className="table-cell">
          {createdBy ?
            <small>
              {createdBy.firstname} {createdBy.lastname}
            </small>
          : "N/A"
          }
        </div>
        <div className="table-cell">
          {client ? 
            <small>{DateTime.fromISO(quickTask.created_at).toFormat('D')}</small>
          : 
            <small>"N/A"</small>
          }
        </div>
        <div className="table-cell">
          <p className="-items">{quickTask.status === 'open' ? 'Active' : 'Complete'}</p>
        </div>
      </div>
    )
  }
}

PracticeQuickTaskListItem.propTypes = {
  dispatch: PropTypes.func.isRequired
  , quickTask: PropTypes.object.isRequired
}

PracticeQuickTaskListItem.defaultProps = {

}

const mapStoreToProps = (store) => {

  return {
    loggedInUser: store.user.loggedIn.user
    , tagStore: store.tag
    , clientStore: store.client
    , userStore: store.user
  }
}

export default withRouter(connect(
  mapStoreToProps
)(PracticeQuickTaskListItem));
