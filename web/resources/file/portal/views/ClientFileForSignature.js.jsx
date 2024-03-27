/**
 * View component for /portal/:clientId/client-workflows/:clientWorkflowId/client-tasks/:clientTaskId/files/:fileId
 *
 * Displays a single file preview
 * Will eventually allow a user to e-sign a document.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third party libraries
import classNames from 'classnames';
import { DateTime } from 'luxon';

// import actions
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as fileActions from '../../fileActions';
import * as tagActions from '../../../tag/tagActions';
import * as noteActions from '../../../note/noteActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import ProfilePic from '../../../../global/components/navigation/ProfilePic.js.jsx';

// import resource components
import PreviewFile from '../../components/PreviewFile.js.jsx';

// import NewNoteInput
import NewNoteInput from '../../../note/components/NewNoteInput.js.jsx';

class ClientFileForSignature extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      isAddingComment: false
      , showSideBar: true
    }
    this._bind(
      '_goBack'
      , '_handleNewComment'
    )
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    /**
     * add this to each portal view 
     */
    dispatch(clientUserActions.fetchClientUserLoggedInByClientIfNeeded(match.params.clientId));

    dispatch(fileActions.fetchSingleIfNeeded(match.params.fileId)).then(fileRes => {
      if(fileRes.success) {
        // Fetch all users by dedicated api route so we can populate the comments with userMap.
        // This should work from the portal side and the firm side.
        dispatch(userActions.fetchListIfNeeded('_firmStaff', fileRes.item._firm))
        dispatch(userActions.fetchListIfNeeded('_client', fileRes.item._client))
      }
    });
    dispatch(noteActions.fetchListIfNeeded('_file', match.params.fileId));
    dispatch(noteActions.fetchDefaultNote());
    dispatch(tagActions.fetchListIfNeeded('~client', match.params.clientId))

  }

  _goBack() {
    this.props.history.goBack();
  }

  _handleNewComment(noteId) {
    const { dispatch, match } = this.props;
    if(noteId) {
      dispatch(noteActions.addNoteToList(noteId, '_file', match.params.fileId))
    }
    this.setState({
      isAddingComment: false
    });
  }

  render() {
    const { fileStore, match, noteStore, userMap, tagStore } = this.props;
    const { isAddingComment, showSideBar } = this.state;
    /**
     * use the selected.getItem() utility to pull the actual file object from the map
     */
    const selectedFile = fileStore.selected.getItem();

    const fileTags = selectedFile && selectedFile._tags ? selectedFile._tags.map(tagId => tagStore.byId[tagId] || '') : []
    const noteList = noteStore.lists && noteStore.lists._file ? noteStore.lists._file[match.params.fileId] : null;
    const noteListItems = noteStore.util.getList('_file', match.params.fileId);    

    const isEmpty = (
      !selectedFile
      || !selectedFile._id
      || fileStore.selected.didInvalidate
    );

    const isFetching = (
      fileStore.selected.isFetching
      || !noteList
      || noteList.isFetching
    )

    const sideBarClass = classNames(
      'file-preview-sidebar'
      , { '-hidden': !showSideBar }
    )

    const previewClass = classNames(
      'file-preview-container'
      , { '-with-sidebar': showSideBar }
    )

    return (
      <div className="file-preview-layout">
        { isEmpty ?
            (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <em>No file found... </em>
            )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className={previewClass}>
              <header className="-header fixed">
                <div className="-header-content">
                  <a className="-exit-preview" onClick={this._goBack}>
                    <i className="fas fa-arrow-left"></i>
                  </a>
                  <div className="-preview-title">
                    {/* <img className="-icon" src={} /> */}
                    { selectedFile.filename }
                  </div>
                  <button style={{right: '480px'}} className="yt-btn small info" disabled>E-Sign</button>
                  <div className="-open-sidebar" onClick={() => this.setState({showSideBar: !this.state.showSideBar})}>
                    { this.state.showSideBar ?
                      <i className="far fa-arrow-to-right fa-lg"/>
                      :
                      <i className="far fa-arrow-from-right fa-lg"/>
                    }
                  </div>
                </div>
              </header>
              <div className="-preview-content">
                <PreviewFile
                  contentType={selectedFile.contentType}
                  filePath={fileUtils.getDownloadLink(selectedFile)}
                  isIE={false}
                  file={selectedFile}
                />
              </div>
            </div>
            <div className={sideBarClass}>
              <div className="-close-sidebar" onClick={() => this.setState({showSideBar: !this.state.showSideBar})}>
                <i className="far fa-times fa-lg"/>
              </div>
              <h4 className="-label">DETAILS</h4>
              <p>
                <strong>FileName: </strong>
                { selectedFile.filename }
              </p>
              <p>
                <strong>Uploaded: </strong>
                {DateTime.fromISO(selectedFile.created_at).toLocaleString(DateTime.DATE_SHORT)}
              </p>
              <p>
                <strong>Type: </strong>
                { selectedFile.category }
              </p>
              <p>
                <strong>Content Type: </strong>
                { selectedFile.contentType }
              </p>
              <p>
                <strong>Tags: </strong>
                { fileTags.map((tag, i) =>
                  tag.name ?
                  <span key={tag._id + i}>{i > 0 ? " | " : ""}{tag.name}</span>
                  :
                  null
                )}
              </p>
              <br/>
              <a className="yt-btn block" href={fileUtils.getDownloadLink(selectedFile)} download target="_blank">
                <i className="ion ion-arrow-down-c" />
                <span> Download</span>
              </a>
              <br/>
              <h4 className="-label">COMMENTS</h4>
              { noteListItems ? 
                noteListItems.map((note, i) =>
                  <div key={`note_${i}_${note._id}`} className="note-item">
                    <p className="u-textRight">
                      <small>
                        <em className="u-muted">{DateTime.fromISO(note.created_at).toLocaleString(DateTime.DATE_SHORT)}</em>
                      </small>
                    </p>
                    <div className="yt-row center-vert">
                    { userMap[note._user] ?
                      <ProfilePic
                        user={userMap[note._user]}
                      />
                      :
                      null
                    }
                      <p className="-note-content">
                        {note.content}
                      </p>
                    </div>
                  </div>
                )
                :
                null
              }
              { isAddingComment ?
                <NewNoteInput
                  note={this.props.defaultNote}
                  pointers={{'_file': match.params.fileId}}
                  onSubmit={this._handleNewComment}
                  submitOnEnter={true}
                />
                :
                <button
                  className="yt-btn block info link -comment-button"
                  type="button"
                  onClick={() => this.setState({isAddingComment: true})}
                >
                  Add comment
                </button>
              }
            </div>
          </div>
        }
      </div>
    )
  }
}

ClientFileForSignature.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    defaultNote: store.note.defaultItem.obj
    , fileStore: store.file
    , noteStore: store.note
    , userMap: store.user.byId
    , tagStore: store.tag
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientFileForSignature)
);
