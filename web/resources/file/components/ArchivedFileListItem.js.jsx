/**
 * TODO: @ffugly
 * open file preview instead of download link
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, matchPath, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import third-party libraries
import classNames from 'classnames';
// import moment from 'moment';
import { DateTime } from 'luxon';

import * as fileActions from '../fileActions'; 

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import { displayUtils } from '../../../global/utils';
import { CheckboxInput, SelectFromObject } from '../../../global/components/forms'
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';
import AlertModal from '../../../global/components/modals/AlertModal.js.jsx';
import brandingName from '../../../global/enum/brandingName.js.jsx';

import SingleFileOptions from '../practice/components/SingleFileOptions.js.jsx';

import FilesOptions from '../practice/components/FilesOptions.js.jsx';

class ArchivedFileListItem extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      singleFileOptionsOpen: false
      , showAlertModal: false 
      , progressOpen: true
      , progressText: ""
      , progressSubmit: false
      , showRightClickOptions: false
      , filesOptionsPositionX: 0
      , isAutoChecked: false
      , rightClickStatusText: ""
    }
    this._bind(
      '_handleCloseQuickTaskModal'
      , '_handleOpenQuickTaskModal'
      , '_setStatus'
      , '_toggleAlertModal'
      , '_sendDeleteFile'
      , '_handleOpenContextMenu'
      , '_handleCloseContextMenu'
      , '_handleContextMenuSubmit'
      , '_handleSingleUpdate'
    )
  }

  _handleCloseQuickTaskModal(e) {
    e.stopPropagation();
    this.setState({
      singleFileOptionsOpen: false
    })
  }

  _handleOpenQuickTaskModal(e) {
    e.stopPropagation();
    this.setState({
      singleFileOptionsOpen: false
    }, () => this.props.handleOpenQuickTaskModal())
  }
  // shouldComponentUpdate(nextProps, nextState) {
  //   if(this.props.file && this.props.file._id && nextProps.file && nextProps.file._id) {
  //     return true;
  //   }
  //   return false;
  // }

  _handleSingleUpdate(file) {
    const dispatch = this.props.dispatch;
    dispatch(fileActions.sendUpdateFile(file)).then(json => {
      if (this.props.handleUpdateList) {
        this.props.handleUpdateList();
      }
    });
  }

  _setStatus(status) {
    const file = _.cloneDeep(this.props.file);
    file.status = status;
    this._handleSingleUpdate(file);
  }

  _toggleAlertModal() {
    this.setState({showAlertModal: !this.state.showAlertModal}); 
  }

  _sendDeleteFile() {
    // dispatch(fileActions.removeFileFromList(file._id, ...fileListArgs)); 
    // dispatch(fileActions.sendDelete(file._id));
    const file = _.cloneDeep(this.props.file); 
    file.status = 'deleted';
    this._handleSingleUpdate(file);
  }

  _handleOpenContextMenu(e) {
    e.preventDefault();
    const { selectedFileIds, file, handleSelectFile } = this.props;
    if (selectedFileIds && selectedFileIds.length) {
      const filesOptionsPositionX = e.pageX - 300;
      this.setState({ showRightClickOptions: true, filesOptionsPositionX });
    } else {
      handleSelectFile(file._id);
      const filesOptionsPositionX = e.pageX - 300;
      this.setState({ showRightClickOptions: true, filesOptionsPositionX, isAutoChecked: true });
    }
  }

  _handleCloseContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.state.isAutoChecked) {
      const { file, handleSelectFile } = this.props;
      handleSelectFile(file._id);
    }
    this.setState({ showRightClickOptions: false, isAutoChecked: false });
  }

  _handleContextMenuSubmit(action, e) {
    const { file, handleSelectFile, selectedFileIds } = this.props;
    e.stopPropagation();
    e.preventDefault();
    if (this.state.isAutoChecked || (selectedFileIds && selectedFileIds.length === 1 && selectedFileIds.includes(file._id))) {
      handleSelectFile(file._id);
    }
    this.setState({ showRightClickOptions: false, isAutoChecked: false }, () => {
      if (selectedFileIds.length === 1) {
        if (action === "reinstate") {
          this._setStatus("visible");
        } else {
          this._toggleAlertModal();
        }
      } else {
        this.props.handleContextMenuSubmit(action, this.props.showWarningModal);
      }
    });
  }

  render() {
    const { 
      checked
      , client
      , clientStore
      , disabled
      , file
      , match
      , showOptions
      , tagStore
      , userStore 
      , viewingAs
      , sortedAndFilteredList
      , selectedFileIds
    } = this.props;

    const { 
      showAlertModal
      , progressOpen
      , progressText
      , progressSubmit
      , showRightClickOptions
      , filesOptionsPositionX
      , isAutoChecked
      , rightClickStatusText
    } = this.state; 

    // let foundComment = _.find(commentMap, { '_file': file._id });
    let foundComment = true;
    const fileTags = file._tags ? file._tags.map(tagId => tagStore.byId[tagId] || '' ) : []

    let icon = displayUtils.getFileIcon(file.category, file.contentType, file);
    const clientList = clientStore.util.getList('_firm', file._firm);

    const _workspace = match.path.split("/")[3] === "workspaces"; // files and workspace tab
    const showWarning = file.category === "folder" && sortedAndFilteredList.some(file2 => file2.status === "archived" && file2._folder == file._id);
    const progressPresentText = progressText;

    return (
      <div className="table-row -file-item -option-pointer" onContextMenu={this._handleOpenContextMenu}>
        <div className="table-cell">
          <CheckboxInput
            disabled={(disabled && !checked)}
            name="file"
            value={checked}
            change={() => this.props.handleSelectFile(file._id)}
            checked={checked}
          />
        </div>
        { showOptions ?
          <div className="table-cell -options" onClick={() => this.setState({singleFileOptionsOpen: true})}>
           <div style={{position: "relative", height: "100%", width: "100%"}}>
             <CloseWrapper
               isOpen={(this.state.singleFileOptionsOpen)}
               closeAction={this._handleCloseQuickTaskModal}
             />
             <i className="far fa-ellipsis-v"></i>
             <SingleFileOptions
               isOpen={this.state.singleFileOptionsOpen}
               handleOpenQuickTaskModal={this._handleOpenQuickTaskModal}
               closeAction={() => this.setState({singleFileOptionsOpen: false})}
               setStatus={showWarning ? () => this.setState({ progressOpen: true, progressText: "reinstate" }) : this._setStatus}
               viewingAs="archived"
               sendDeleteFile={this._toggleAlertModal}
             />
           </div>
           <div style={{position: "relative", height: "100%", width: "100%", bottom: "70px", left: `${filesOptionsPositionX}px` }}>
              <CloseWrapper
                isOpen={showRightClickOptions}
                closeAction={this._handleCloseContextMenu}
              />
              {/* <i className="far fa-ellipsis-v"></i> */}
              <FilesOptions
                isOpen={showRightClickOptions}
                selectedFileIds={selectedFileIds}
                file={file}
                isAutoChecked={isAutoChecked}
                viewingAs="archived"
                handleContextMenuSubmit={this._handleContextMenuSubmit}
              />
            </div>
         </div>
         :
         null
        }
        <div className="table-cell -title">
          <div className="yt-row center-vert">
            <span className="-icon">
              <img src={brandingName.image[icon] || `/img/icons/${icon}.png`} />
            </span>
            <div className="-file-info">
            { this.props.handleFilesChange ?
              file.filename
              :
              // TODO: this link goes nowhere when selecting from existing files
              <Link className="-filename" to={
                  file.category === "folder" ? 
                      _workspace ? `/firm/${file._firm}/workspaces/${file._client}/files/archived/${file._id}/folder` 
                      : match.params.clientId ? `/firm/${file._firm}/files/${match.params.clientId}/workspace/archived/${file._id}/archived-folder` 
                      : match.params.userId ? `/firm/${file._firm}/files/${match.params.userId}/personal/archived/${file._id}/archived-folder`
                      : `/firm/${file._firm}/files/public/archived/${file._id}/archived-folder` 
                  : `${match.url}/${file._id}`
                }>
                {file.filename}
                {
                  rightClickStatusText ? <span style={{color:"black"}}>{rightClickStatusText}</span> : null
                }
              </Link>
            }
            </div>
          </div>
        </div>
        {/* { viewingAs === 'general' || viewingAs === 'admin' ?
          <div className="table-cell -client">
            { client ? 
              <Link to={`/firm/${match.params.firmId}/workspaces/${client._id}`}>{client.name}</Link>
              :
              <span>N/A</span>
            }
          </div>
          :
          null
        } */}
        <div className="table-cell _no_wrap">
          { 
            file._user && userStore.byId[file._user] ? 
            `${userStore.byId[file._user].firstname} ${userStore.byId[file._user].lastname}`
            : 
            file.uploadName ? 
            <span>{file.uploadName} <small>(not logged in)</small></span>
            : null
          }
        </div>
        <div className="table-cell -date">{DateTime.fromISO(file.updated_at).toLocaleString(DateTime.DATE_SHORT)}</div>
        <AlertModal
          alertMessage={"Are you sure? This cannot be undone."}
          alertTitle={"Delete this file?"}
          closeAction={this._toggleAlertModal}
          confirmAction={this._sendDeleteFile}
          confirmText={"Delete"}
          declineAction={this._toggleAlertModal}
          declineText={"Cancel"}
          isOpen={showAlertModal}
          type={'danger'}
          disableConfirm={progressSubmit}
        >
        </AlertModal>
        <AlertModal
          isOpen={progressOpen && progressText ? true : false} // app.js.jsx?93ea:56 Warning: Failed prop type: Invalid prop `isOpen` of type `string` supplied to `AlertModal`, 
          type="warning"
          confirmText={`Try ${progressPresentText} anyway`}
          alertTitle="A folder has been selected "
          alertMessage={`All files associated with this folder will also be ${progressText}d.`}
          closeAction={() => this.setState({ progressOpen: false, progressText: "" })}
          // confirmAction={() => this.setState({ progressOpen: false }, () => {
          //   progressText === "move" ? this.setState({ showClientList: true }) : null
          // })}
          confirmAction={
            progressText === "reinstate" ? this._setStatus.bind(this, "visible") : null}
          disableConfirm={progressSubmit}
        />
      </div>
    )
  }
}

ArchivedFileListItem.propTypes = {
  checked: PropTypes.bool
  , client: PropTypes.object 
  , disabled: PropTypes.bool
  , dispatch: PropTypes.func.isRequired
  , file: PropTypes.object.isRequired
  , handleSelectFile: PropTypes.func 
  , handleOpenQuickTaskModal: PropTypes.func
  , showOptions: PropTypes.bool
  , viewingAs: PropTypes.oneOf(['workspace', 'general', 'admin', 'client', 'staff']) 
}

ArchivedFileListItem.defaultProps = {
  checked: false
  , client: null 
  , disabled: false
  , handleSelectFile: null
  , showOptions: false
  , viewingAs: 'workspace'
}

const mapStoreToProps = (store) => {
  return {
    tagStore: store.tag
    , userStore: store.user 
    , clientStore: store.client
  }
}

export default withRouter(connect(
  mapStoreToProps
)(ArchivedFileListItem));


// save for later
// <a href={`/api/files/download/${file._id}/${file.filename}`} target="_blank">{file.filename}</a>
