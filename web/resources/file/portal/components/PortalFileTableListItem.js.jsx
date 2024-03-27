/**
 * TODO: @ffugly
 * open file preview instead of download link
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import third-party libraries
import classNames from 'classnames';
// import moment from 'moment';
import { DateTime } from 'luxon';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import { displayUtils } from '../../../../global/utils';
import { CheckboxInput, TextInput } from '../../../../global/components/forms';
import brandingName from '../../../../global/enum/brandingName.js.jsx';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';
import SingleFileOptions from '../../practice/components/SingleFileOptions.js.jsx';
import { validationUtils, permissions } from "../../../../global/utils";

// import actions
import * as fileActions from '../../fileActions'; 

// import event tracking
// import UserClickEvent from '../../userEvent/components/UserClickEvent.js.jsx';

class PortalFileTableListItem extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      hasViewedLog: true
      , singleFileOptionsOpen: false
      , isAutoChecked: false
      , changeFilename: false
      , isFilenameValid: false
      , newFilename: ''
      , baseFilename: ''
    };
    this._bind(
      '_handleSingleFileOption'
      , '_handleCheckBox'
      , '_handleOpenMoveFileModal'
      , '_handleDeleteFile'
      , '_toggleUpdateFilename'
      , '_handleFormChange'
      , '_handleUpdateFilename'
    )
  }

  componentDidMount() {
    const { file, loggedInUser, fileActivityListItems } = this.props;
    if (file && loggedInUser && fileActivityListItems) {
      this.setState({
        hasViewedLog: fileActivityListItems && loggedInUser ? fileActivityListItems.some(item => item &&
          item._file === file._id && loggedInUser._id === item._user && item.text && item.text.includes("Viewed")) : true
      });  
    }
  }

  _handleSingleFileOption(e) {
    e.stopPropagation();
    const { handleSelectFile, file } = this.props;
    if (this.state.isAutoChecked && handleSelectFile) {
      if (handleSelectFile) {
        handleSelectFile(file._id);
      }
    }

    this.setState({
      singleFileOptionsOpen: false
      , isAutoChecked: false
    })
  }

  _handleCheckBox() {
    const { handleSelectFile, file } = this.props;
    this.setState({ singleFileOptionsOpen: true, isAutoChecked: true, }, () => {
      if (handleSelectFile) {
        handleSelectFile(file._id);
      }
    });
  }

  _handleOpenMoveFileModal() {
    const { handleOpenMoveSingleFileModal, file } = this.props;
    this.setState({ singleFileOptionsOpen: false }, () => {
      if (handleOpenMoveSingleFileModal) {
        handleOpenMoveSingleFileModal(file._id);
      }
    });
  }

  _handleDeleteFile() {
    const { dispatch, file, selectedClient } = this.props; 
    const sendData = { 
      status: 'archived'
      , filesId: [file._id]
      , action: "status"
      , portal: true
      , firmId: selectedClient._firm
      , viewingAs: "portal"
    };

    dispatch(fileActions.sendUBulkupdateFiles(sendData)).then(json => {
      if (!json.success) {
        alert("ERROR: " + json.error)
      }
    });
  }

  _toggleUpdateFilename(e) {
    e.stopPropagation();
    console.log('_toggleUpdateFilename')
    const { file } = this.props;
    const baseFilename = file.category === "folder" ? file.filename : file.filename.slice(0, file.filename.indexOf(file.fileExtension));
    this.setState({
      changeFilename: !this.state.changeFilename
      , newFilename: baseFilename
      , singleFileOptionsOpen: false
      , isFilenameValid: true
      , baseFilename
    });
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
    newFile.viewingAs = "portal";
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

  // shouldComponentUpdate(nextProps, nextState) {
  //   if(this.props.file && this.props.file._id && nextProps.file && nextProps.file._id) {
  //     return true;
  //   }
  //   return false;
  // }

  render() {
    const { 
      checked
      , disabled
      , file
      , match
      , tagStore
      , userStore
      , firmStore
      , handleOpenFileVersionModal
      , parentFolder
      , role
    } = this.props;

    const { hasViewedLog, singleFileOptionsOpen, changeFilename, isFilenameValid
      , newFilename
      , baseFilename 
    } = this.state;
    console.log('_toggleUpdateFilename', changeFilename)

    // get firm 
    const selectedFirm = firmStore.selected.getItem();

    // let foundComment = _.find(commentMap, { '_file': file._id });
    let foundComment = true;
    const fileTags = file._tags ? file._tags.map(tagId => tagStore.byId[tagId] || '' ) : []

    let icon = displayUtils.getFileIcon(file.category, file.contentType, file);

    return (
      <div className="table-row -file-item">
        <div className="table-cell">
          <CheckboxInput
            disabled={(disabled && !checked)}
            name="file"
            value={checked}
            change={() => this.props.handleSelectFile(file._id)}
            checked={checked}
          />
        </div>

        <div className="table-cell">
          {
            selectedFirm.allowDeleteFiles || selectedFirm.allowMoveFiles || selectedFirm.allowRenameFiles ?
            <div className="-options" onClick={() => this.setState({ singleFileOptionsOpen: !singleFileOptionsOpen })}>
              <div className="-inherit">
                <CloseWrapper
                  isOpen={singleFileOptionsOpen}
                  closeAction={this._handleSingleFileOption}
                />
                <i className="far fa-ellipsis-v"></i>
                {
                  singleFileOptionsOpen ? 
                  <SingleFileOptions
                    isOpen={singleFileOptionsOpen}
                    closeAction={this._handleSingleFileOption}
                    file={file}
                    selectedFirm={selectedFirm}
                    viewingAs="portal"
                    sendDeleteFile={this._handleDeleteFile}
                    handleOpenMoveFileModal={this._handleOpenMoveFileModal}
                    toggleUpdateFilename={this._toggleUpdateFilename}
                    role={role}
                    parentFolder={parentFolder}
                  /> : null
                }
              </div>
            </div>
            : null
          }
        </div>

        <div className="table-cell -title">
          <div className="yt-row center-vert">
            <span className="-icon">
              <img src={brandingName.image[icon] || `/img/icons/${icon}.png`} />
            </span>
            <div className="-file-info">
              {
                changeFilename ?
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
                    <button className="yt-btn x-small success" onClick={this._handleUpdateFilename} disabled={!isFilenameValid || newFilename === baseFilename || !newFilename}>save</button>
                  </div>
                  {
                    !isFilenameValid ? <p className="-error-color">{filenameErrorMessage}</p> : ""
                  }
                </div>
                : 
                (file.category == "folder") || permissions.hasPermission(selectedFirm, parentFolder, file, `${role}Read`) ?
                <Link className="-filename" to={file.category === "folder" ? `/portal/${file._client}/files/folder/${file._id}` : `/portal/${file._client}/files/${file._id}`}>
                  {file.filename}
                  {
                    (file.category === "folder" || hasViewedLog) ? null :
                    <span className="-new-file-status">
                      <b> (</b>New<b>)</b>
                    </span>
                  }
                </Link>
                :
                file.filename
              }
              { changeFilename ? null: <br/> }
              <small>
              { userStore.byId[file._user] ?
                <span>by {userStore.byId[file._user].firstname} {userStore.byId[file._user].lastname}</span>
                :
                file.uploadName ?
                <span>by <em>{file.uploadName} (not logged in)</em></span>
                :
                null
              }
                {/* <span> | </span>
                { file._clientWorkflow ? 
                  <Link 
                    to={ match.params.firmId ? 
                          `/firm/${match.params.firmId}/clients/${match.params.clientId}/client-workflows/${file._clientWorkflow}` 
                          : 
                          `/portal/${match.params.clientId}/client-workflows/${file._clientWorkflow}`
                    }
                  >
                    {clientWorkflowStore.byId[file._clientWorkflow] ? clientWorkflowStore.byId[file._clientWorkflow].title : 'For a clientWorkflow'} 
                  </Link>
                  :
                  null 
                } */}
              </small>
            </div>
          </div>
        </div>
        {
          selectedFirm && selectedFirm.fileVersionType === "enable" ? 
          <div className="table-cell">
            <i className={`fas fa-copy ${file && file.fileVersionCount ? '-active' : ''}`}
              onClick={file && file.fileVersionCount ? handleOpenFileVersionModal : null}
              aria-hidden="true" />
            {file && file.fileVersionCount || ""}
          </div>
          : null
        }
        <div className="table-cell -tags">
          { fileTags.map((tag, i) =>
            tag.name ?
            <span className="tag-pill" key={tag._id + '_' + i}>{tag.name}</span>
            :
            null
          )}
        </div>
        {/* <td className="-date">{file.year}</td> */}
        <div className="table-cell -date">{DateTime.fromISO(file.created_at).toLocaleString(DateTime.DATE_SHORT)}</div>
        {/* <td className="-comments">
          { foundComment ?
            <i className="fal fa-comment-lines" />
            :
            null
          }
        </td> */}
      </div>
    )
  }
}

PortalFileTableListItem.propTypes = {
  checked: PropTypes.bool
  , disabled: PropTypes.bool
  , dispatch: PropTypes.func.isRequired
  , file: PropTypes.object.isRequired
  , handleFileSelect: PropTypes.func 
}

PortalFileTableListItem.defaultProps = {
  checked: false
  , disabled: false
  , handleFileSelect: null 
}

const mapStoreToProps = (store) => {
  return {
    tagStore: store.tag
    , userStore: store.user 
    , loggedInUser: store.user.loggedIn.user
    , firmStore: store.firm
  }
}

export default withRouter(connect(
  mapStoreToProps
)(PortalFileTableListItem));


// save for later
// <a href={`/api/files/download/${file._id}/${file.filename}`} target="_blank">{file.filename}</a>
