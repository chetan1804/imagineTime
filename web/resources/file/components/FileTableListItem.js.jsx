/**
 * TODO: @ffugly
 * open file preview instead of download link
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import moment from 'moment';
import { DateTime } from 'luxon';

import * as fileActions from '../fileActions'; 

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

import { displayUtils, permissions, fileUtils, validationUtils} from '../../../global/utils';

import { CheckboxInput, TextInput } from '../../../global/components/forms'
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';

import brandingName from '../../../global/enum/brandingName.js.jsx';
import stored from '../../../global/enum/stored.js.jsx';

import SingleFileOptions from '../../file/practice/components/SingleFileOptions.js.jsx';
import SingleFileTagsDropdown from '../../file/practice/components/SingleFileTagsDropdown.js.jsx';
import FilesOptions from '../practice/components/FilesOptions.js.jsx';

class FileTableListItem extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      singleFileOptionsOpen: false
      , clientId: props.file._client || null 
      , changeFilename: false
      , newFilename: ''
      , baseFilename: ''
      , tagsDropDownOpen: false
      , isFilenameValid: true
      , moveSubmitting: false
      , progressSubmit: false
      , showRightClickOptions: false
      , filesOptionsPositionX: 0
      , isAutoChecked: false
      , rightClickStatusText: ""
      , showWarning: props.showWarningModal
      , fileSize: 0
      , page: ''
      , per: ''
    }
    this._bind(
      '_handleCloseQuickTaskModal'
      , '_handleOpenQuickTaskModal'
      , '_handleChangeClient'
      , '_handleUpdateFilename'
      , '_handleFormChange'
      , '_toggleUpdateFilename'
      // , '_closeClientList'
      // , '_openClientList'
      , '_handleOpenTagsDropdown'
      , '_handleCloseTagsDropdown'
      , '_handleVisibility'
      , '_handleOpenContextMenu'
      , '_handleCloseContextMenu'
      , '_handleContextMenuSubmit'
      , '_handleCheckBox'
      , '_handleDisplayWarning'
      , '_handleOpenFolderPermissionModal'
      , '_handleSingleUpdate'
      , '_setStatus'
      // handle for dragging
    )
  }

  componentDidMount() {
    const { loggedInUser, file, location, selectedFirm } = this.props;
    const query = new URLSearchParams(location.search);
    this.setState({ page: query.get('page'), per: query.get('per')  })
  }

  _setStatus() {
    const file = _.cloneDeep(this.props.file);
    file.status = 'archived';
    this._handleSingleUpdate(file);
  }

  _handleCloseQuickTaskModal(e) {
    e.stopPropagation();
    this.setState({
      singleFileOptionsOpen: false
    })
  }

  _handleVisibility(status) {
    const dispatch = this.props.dispatch;
    const file = _.cloneDeep(this.props.file);
    file.status = status;
    dispatch(fileActions.sendUpdateFile(file))
  }

  _handleOpenQuickTaskModal(e) {
    e.stopPropagation();
    this.setState({
      singleFileOptionsOpen: false
    }, () => this.props.handleOpenQuickTaskModal())
  }
  
  _handleOpenFolderPermissionModal(e) {
    e.stopPropagation();
    this.setState({
      singleFileOptionsOpen: false
    }, () => this.props.handleOpenFolderPermissionModal(this.props.file))
  }

  _handleOpenTagsDropdown(e) {
    e.stopPropagation();
    this.setState({tagsDropDownOpen: true})
  }

  _handleCloseTagsDropdown(e) {
    e.stopPropagation();
    this.setState({tagsDropDownOpen: false}); 
  }

  _handleSingleUpdate(file) {
    const dispatch = this.props.dispatch;
    dispatch(fileActions.sendUpdateFile(file)).then(json => {
      if (this.props.handleUpdateList) {
        this.props.handleUpdateList();
      }
    });
  }

  _handleChangeClient(e) {
    this.setState({clientId: e.value}); 
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState)

    if(e.target.name === "newFilename") {
      if(!validationUtils.checkFilenameIsValid(e.target.value)) {
        this.setState({ isFilenameValid: false });
      } else {
        this.setState({ isFilenameValid: true });
      }
    }
  }

  _toggleUpdateFilename(e) {
    e.stopPropagation();
    const { file } = this.props;
    // preserve the fileExtension by removing it from the filename here. We'll add it back when they save.
    const baseFilename = file.category === "folder" ? file.filename : file.filename.slice(0, file.filename.indexOf(file.fileExtension));
    this.setState({
      changeFilename: !this.state.changeFilename
      , newFilename: baseFilename
      , singleFileOptionsOpen: false
      , isFilenameValid: true
      , baseFilename
    });
  }

  _handleUpdateFilename() {
    if(!this.state.isFilenameValid) return;

    let { newFilename } = this.state;
    const { dispatch, file } = this.props;

    newFilename = newFilename ? newFilename.trim() : newFilename;

    // disable button
    this.setState({ baseFilename: newFilename });

    let newFile = _.cloneDeep(file);
    // Add the fileExtension back to the filename.
    newFile.filename = newFilename + (file.fileExtension || "");
    if(newFilename.length > 0) {
      dispatch(fileActions.sendUpdateFile(newFile)).then((action) => {
        if(action.success) {
          this.setState({
            changeFilename: false
            , newFilename: ''
          });
        } else {
          alert(`ERROR: ${action.error}`);
        }
      });
    }
  }

  _handleOpenContextMenu(e) {
    const { selectedFileIds, file, handleSelectFile } = this.props;
    if (selectedFileIds && selectedFileIds.length) {
      e.preventDefault();
      const filesOptionsPositionX = e.pageX - 300;
      this.setState({ showRightClickOptions: true, filesOptionsPositionX });
    } else {
      e.preventDefault();
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
      // handleSelectFile(file._id);
    }
    this.setState({ showRightClickOptions: false, isAutoChecked: false });
  }

  _handleContextMenuSubmit(action, e) {
    e.stopPropagation();
    if (action != "activity") {
      e.preventDefault();
    }
    const { showWarning } = this.state;
    const { file, handleSelectFile, selectedFileIds, handleBulkAction } = this.props;
    if (this.state.isAutoChecked && (action === "activity" || action === "signature" || action === "rename") && selectedFileIds.length === 1) {
      handleSelectFile(file._id);
    }
    this.setState({ showRightClickOptions: false, isAutoChecked: false }, () => {
      if (action === "archive" && selectedFileIds.length === 1) {
        if (file.category === "folder" && (file.totalChildFolder || file.totalChildFile) && handleBulkAction) {
          handleBulkAction('archive')
        } else {
          this._setStatus();
        }
      } else if (action === "rename") {
        this._toggleUpdateFilename(e);
      } else if (action === "signature") {
        this._handleOpenQuickTaskModal(e);
      } else if (action != "activity") {
        this.props.handleContextMenuSubmit(action, showWarning);
      }
    });
  }

  onDragStart(ev, type) {
    const { selectedFileIds, file, handleSelectFile } = this.props;
    console.log('drag', file, ev, type)
    if (type === "move") {

      if (selectedFileIds && selectedFileIds.length) {
        ev.dataTransfer.setData("move", selectedFileIds);
      } else if (file) {
        ev.dataTransfer.setData("move", [file._id]);  
      }

      // element image
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
  
      context.fillStyle = 'black';
      context.font = 'bold 14px "Post Grotesk Trial", "Helvetica Neue", Helvetica, sans-serif';
      context.fillText('Move here', 0, 16);
      const img = new Image();
      img.src = canvas.toDataURL();
      ev.dataTransfer.setDragImage(img, 40, 13);
    }
  }

  onDragOver = (ev) => {
    ev.preventDefault();
  }

  onDrop = (ev, type) => {
    /**
     * name and swap variable is the index of signers state
     */
    
    const { dispatch, file, match, handleBulkAction } = this.props;
    console.log('drop', file, ev, type)

    if (type === "move") {
      let fileIds = ev.dataTransfer.getData("move");
      fileIds = fileIds ? fileIds.split(",").map(Number) : [];

      if (fileIds && fileIds.length && fileIds.indexOf(file._id) === -1) {
        this.setState({ moveSubmitting: true, rightClickStatusText: ` file${fileIds.length > 1 ? "s" : ""} moving here...` });

        const sendData = {
          filesId: fileIds
          , clientId: file._client
          , _personal: file._personal
          , _folder: file._id
          , action: "move"
          , firmId: match.params.firmId
        }

        // const { dispatch, file, fileListArgs } = this.props; 
        dispatch(fileActions.sendUBulkupdateFiles(sendData)).then(json => {
          this.setState({ moveSubmitting: false, rightClickStatusText: "" }, () => {
            if (this.props.handleUpdateList) {
              this.props.handleUpdateList();
            }  
          });
        });
      } else {
        console.log("error");
      }
    }
  }

  _handleCheckBox() {
    const { handleSelectFile, file, checked } = this.props;
    this.setState({singleFileOptionsOpen: true, isAutoChecked: true, }, () => {
      if (handleSelectFile && !checked) {
        handleSelectFile(file._id);
      }
    })
  }

  _handleDisplayWarning() {
    if (this.props.handleBulkAction) {
      this.props.handleBulkAction('archive');
    }
  }

  render() {
    const { 
      checked
      , disabled
      , file
      , match
      , showOptions
      , tagStore
      , userStore 
      , sortedTagListItems
      , tagNameList
      , location
      , clearSelectedFileIds
      , _isOldFile
      , selectedFileIds
      , handleOpenShareModal
      , isFirmStaff
      , handleSelectFile
      , selectedFirm
      , loggedInStaff
      , isFirmOwner
      , loggedInUser
      , handleOpenFileVersionModal
      , isConfigScreenView
      , role
      , parentFolder
      , objFileActivityListItems
    } = this.props;

    const { 
      changeFilename
      , newFilename
      , baseFilename
      , singleFileOptionsOpen
      , tagsDropDownOpen
      , isFilenameValid
      , showRightClickOptions
      , filesOptionsPositionX
      , isAutoChecked
      , rightClickStatusText
      , showWarning
      , fileSize
      , page
      , per
    } = this.state; 

    // let foundComment = _.find(commentMap, { '_file': file._id });
    const fileTags = file._tags ? file._tags.map(tagId => tagStore.byId[tagId] || '' ) : []
    const icon = displayUtils.getFileIcon(file.category, file.contentType, file);   
    const filenameErrorMessage = `A filename can't contain any of the following characters: \ / : * ? " < > |`;
    
    // I used path /files/folder/:clientId
    // because /files/:fileId is already used
    const isPublicFiles = match.path === "/firm/:firmId/files/public" || match.path === "/firm/:firmId/files/public/:fileId" && !match.params.clientId;

    const staffFilesRoute = match.params.userId && isFirmOwner ? 2 : 1;
    let targetPath = 
      file.category === "folder" && location.state && location.state.breadcrumbs && location.state.breadcrumbs[staffFilesRoute] ? 
      (location.state.breadcrumbs[staffFilesRoute].path || match.url) +  `/${file._id}/folder` : page && per ? `${match.url}/${file._id}?page=${page}&per=${per}` : `${match.url}/${file._id}`;

    if(file) {
      file.lastUpload = file.created_at;
      if (file.category === "folder" && fileSize) {
        const intFileSize = parseInt(fileSize);
        file.consumedStorage = displayUtils.convertBytesToReadable(intFileSize);
        // file.consumedStorage = parseInt(fileSize.toString()) / 1026;
        // file.consumedStorage = file.consumedStorage.toFixed(2);
      } else if(file.fileSize) {
        const intFileSize = parseInt(file.fileSize);
        file.consumedStorage = displayUtils.convertBytesToReadable(intFileSize);
        // file.consumedStorage = parseInt(file.fileSize.toString()) / 1026;
        // file.consumedStorage = file.consumedStorage.toFixed(2);
      } else {
        file.consumedStorage = 0;
      }
    }

    // folder associated with template cannot be moved, renamed, archived
    const isFolderFromTemplate = file.contentType && file.category === "folder" && file.contentType.indexOf("template_folder") > -1;
    const isSubfolderFromTemplate = file.contentType && file.category === "folder" && file.contentType.indexOf("template_subfolder") > -1;;

    targetPath = targetPath.replace('//', '/');
    // console.log('${match.url}${file._id}', `${match.url}${file._id}`);

    const filenameLinkScreenStyle = {
      "width": "30%"
    }

    const dateAddedLinkScreenStyle = {
      "textAlign": "left"
    }

    // if (file._id === 28526) {
    //   console.log('eyyy 111', file)
    // }

    return (
      <div className={`table-row -file-item ${checked ? "-active-hover" : "" }`} onContextMenu={this._handleOpenContextMenu}
        draggable
        onDragStart={(e) => this.onDragStart(e, "move")}
        onDragOver={file.category === "folder" ? (e) => this.onDragOver(e) : null}
        onDrop={file.category === "folder" ? (e) => this.onDrop(e, "move") : null}>
        <div className="table-cell">
          <CheckboxInput
            disabled={(disabled && !checked)}
            name="file"
            value={checked}
            change={() => handleSelectFile(file._id)}
            checked={checked}
          />
        </div>
        { showOptions ?
          <div className={`table-cell -${icon}`}>
            {
              isSubfolderFromTemplate ? null
                :
                <div className="-options"
                  onClick={this._handleCheckBox}>
                  <div className="-inherit">
                    <CloseWrapper
                      isOpen={singleFileOptionsOpen}
                      closeAction={this._handleCloseQuickTaskModal}
                    />
                    <i className="far fa-ellipsis-v"></i>
                    {
                      singleFileOptionsOpen ? 
                      <SingleFileOptions
                        isOpen={singleFileOptionsOpen}
                        handleOpenQuickTaskModal={this._handleOpenQuickTaskModal}
                        handleContextMenuSubmit={this._handleContextMenuSubmit}
                        closeAction={this._handleCloseQuickTaskModal}
                        setStatus={showWarning ? () => this._handleDisplayWarning : this._setStatus}
                        eSigAccess={selectedFirm && selectedFirm.eSigAccess && loggedInStaff && loggedInStaff.eSigAccess}
                        toggleUpdateFilename={this._toggleUpdateFilename}
                        isFolderFromTemplate={isFolderFromTemplate}
                        handleOpenFolderPermissionModal={this._handleOpenFolderPermissionModal}
                        file={file}
                        role={role}
                        parentFolder={parentFolder}
                        selectedFirm={selectedFirm}
                      /> : null
                    }
                  </div>
                  <div className="-relative" style={{bottom: "100px", left: `${filesOptionsPositionX}px` }}>
                    <CloseWrapper
                      isOpen={showRightClickOptions}
                      closeAction={this._handleCloseContextMenu}
                    />
                    {
                      showRightClickOptions ?
                      <FilesOptions
                        isOpen={showRightClickOptions}
                        selectedFileIds={selectedFileIds}
                        file={file}
                        eSigAccess={selectedFirm && selectedFirm.eSigAccess && loggedInStaff && loggedInStaff.eSigAccess}
                        toggleUpdateFilename={this._toggleUpdateFilename}
                        handleOpenQuickTaskModal={this._handleOpenQuickTaskModal}
                        handleContextMenuSubmit={this._handleContextMenuSubmit}
                        handleOpenShareModal={handleOpenShareModal}
                        isAutoChecked={isAutoChecked}
                        selectedFirm={selectedFirm}
                        role={role}
                        parentFolder={parentFolder}
                      /> : null 
                    }
                  </div>
                </div>
            }
          </div>
         :
         null
        }
        <div className="table-cell -title -break-word" style={isConfigScreenView ? filenameLinkScreenStyle: null}>
          <div className="yt-row center-vert">
            <span className="-icon">
              <img src={brandingName.image[icon] || `/img/icons/${icon}.png`} />
            </span>
            { changeFilename ? 
              <div className="-file-info">
                <div className="yt-row center-vert">
                  <div className="-pB_10"> 
                  <TextInput
                    change={this._handleFormChange}
                    name={'newFilename'}
                    suffix={file.fileExtension}
                    value={newFilename}
                    onSubmit={this._handleUpdateFilename}
                    showLabel={false}
                  />
                  </div>
                  <div className="center-vert">
                    <button className="yt-btn x-small link" onClick={this._toggleUpdateFilename}>cancel</button>
                    <button className="yt-btn x-small success" onClick={this._handleUpdateFilename} disabled={!isFilenameValid || newFilename === baseFilename || !(newFilename && newFilename.trim())}>save</button>
                  </div>
                </div>
                {
                  !isFilenameValid ? <p className="-error-color">{filenameErrorMessage}</p> : ""
                }
              </div>
            :
              <div className="-file-info">
              { this.props.handleFilesChange ?
                file.filename
                : 
                // TODO: this link goes nowhere when selecting from existing files
                isFirmStaff || (file.category == 'folder' && !isConfigScreenView) ? 
                (file.category == 'folder') ||
                (permissions.hasPermission(selectedFirm, parentFolder, file, `${role}Read`)) ? 
                  <Link className="-filename" to={targetPath} disabled={isPublicFiles} onClick={clearSelectedFileIds}>
                    {file.filename}
                    {
                      (selectedFirm && !selectedFirm.showNewLabel) || (file.category === "folder" && file.wasAccessed) 
                      || (file.category !== "folder" && objFileActivityListItems && objFileActivityListItems[file._id]) ? null
                      : <span className="-new-file-status"><b> (</b>New<b>)</b></span>
                    }
                    {
                      rightClickStatusText ? <span className="-black-color">{rightClickStatusText}</span> : null
                    }
                  </Link>
                  :
                  file.filename
                :
                file.filename
                // admin debugging purposes
                // !loggedInUser.admin ? 
                // file.filename
                // :
                // <Link className="-filename" to={targetPath} disabled={isPublicFiles} onClick={clearSelectedFileIds}>
                //   {file.filename}
                //   {
                //     !(selectedFirm && selectedFirm.showNewLabel) || (file.category === "folder" && file.wasAccessed) || hasViewedLog ? null :
                //     <span className="-new-file-status">
                //       <b> (</b>New<b>)</b>
                //     </span>
                //   }
                //   {
                //     rightClickStatusText ? <span className="-black-color">{rightClickStatusText}</span> : null
                //   }
                // </Link>
              }
              </div>
            }
          </div>
        </div>
        {
          selectedFirm && selectedFirm.fileVersionType === "enable" ? 
          <div className="table-cell _10">
            <i className={`fas fa-copy ${file && file.fileVersionCount ? '-active' : ''}`}
              onClick={file && file.fileVersionCount ? handleOpenFileVersionModal : null}
              aria-hidden="true" />
            {file && file.fileVersionCount ? file.fileVersionCount : ""}
          </div>
          : null
        }
        <div className="table-cell">
          {file.consumedStorage}
        </div>
        { !isConfigScreenView &&
          <div className="table-cell">
              {file.totalChildFolder || 0 }
          </div>
        }
        { !isConfigScreenView &&
          <div className="table-cell">
              {file.totalChildFile || 0 }
          </div>
        }
        { !isConfigScreenView &&
        <div className="table-cell" onClick={() => this.setState({tagsDropDownOpen: true})}>
          <CloseWrapper
            isOpen={tagsDropDownOpen}
            closeAction={this._handleCloseTagsDropdown}
          />
          <SingleFileTagsDropdown
            isOpen={tagsDropDownOpen}
            fileTags={fileTags}
            file={file}
            sortedTagListItems={sortedTagListItems}
            tagNameList={tagNameList}
            isFirmOwner={isFirmOwner}
            cssInline={{ position: "absolute" }}
          />
        </div>
        }
        <div className="table-cell -visibility">
          { file.status == 'locked' || file.category === "folder" ? 
              // <i className="fas fa-lock"/>
              null
            : file.status == 'visible' ?
              <i onClick={this._handleVisibility.bind(this, 'hidden')} className=" fas fa-eye -pointer" />
            : 
              <i onClick={this._handleVisibility.bind(this, 'visible')} className="u-danger fad fa-eye-slash -pointer" />
          }
        </div>
        { !isConfigScreenView &&
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
        }
        <div className="table-cell -date" style={isConfigScreenView ? dateAddedLinkScreenStyle: null}>{DateTime.fromISO(file.updated_at).toLocaleString(DateTime.DATE_SHORT)}</div>
      </div>
    )
  }
}

FileTableListItem.propTypes = {
  checked: PropTypes.bool
  , client: PropTypes.object 
  , disabled: PropTypes.bool
  , dispatch: PropTypes.func.isRequired
  , file: PropTypes.object.isRequired
  , handleSelectFile: PropTypes.func 
  , handleOpenQuickTaskModal: PropTypes.func
  , showOptions: PropTypes.bool
  , viewingAs: PropTypes.oneOf(['workspace', 'general', 'admin', 'client', 'staff', 'personal', 'public', 'default']) 
  , isConfigScreenView: PropTypes.bool
}

FileTableListItem.defaultProps = {
  checked: false
  , client: null 
  , disabled: false
  , handleSelectFile: null
  , showOptions: false
  , viewingAs: 'workspace'
  , isConfigScreenView: false
}

const mapStoreToProps = (store) => {
  return {
    tagStore: store.tag
    , userStore: store.user 
    , loggedInUser: store.user.loggedIn.user
    , clientStore: store.client
    , firmStore: store.firm
    , staffStore: store.staff
    , staffClientStore: store.staffClient
    , userMap: store.user.byId
  }
}

export default withRouter(connect(
  mapStoreToProps
)(FileTableListItem));


// save for later
// <a href={`/api/files/download/${file._id}/${file.filename}`} target="_blank">{file.filename}</a>