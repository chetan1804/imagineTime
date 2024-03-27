/**
 * View component for /files/new
 *
 * Creates a new file from a copy of the defaultItem in the file reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
const async = require('async');

// import actions
import * as fileActions from '../fileActions';

// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from '../../../global/components/modals/Modal.js.jsx';
import { TextInput } from '../../../global/components/forms';
import brandingName from '../../../global/enum/brandingName.js.jsx';
import { validationUtils, routeUtils } from "../../../global/utils";

// import file components

class FileLocation extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      targetLocation: props.targetLocation ? props.targetLocation : {}
      , targetLocationUpdate: props.targetLocation ? props.targetLocation : {}
      , openFolder: {}
      , selectedClient: props.selectedClient ? props.selectedClient : null
      , folderListItems: []
      , type: ""
      , newFolders: {}
      , submitting: false
      , selectedFolder: props.selectedFolder || null
      , listArgs: {
        '~firm': props.match.params.firmId
        , _client: props.match.params.clientId || 'null'
        , _personal: props.match.params.userId || 'null'
        , category: 'folder'
        , status: 'folder-only'
      }
    }
    this._bind(
      '_handleClose'
      , '_handleFormSubmit'
      , '_handleFilesChange'
      , '_handleStatusChange'
      , '_handleAddNew'
      , '_handleFormChange'
      , '_handleCancelNew'
      , '_handleSelectChange'
      , '_handleOpenModal'
    );

    this.submitting = false;
  }

  componentWillUnmount() {
    this.setState({
      targetLocation: {}
      , locationShowModal: false
      , openFolder: {}
      , disableConfirm: true
      , selectedClient: {}
    })
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.selectedFolder, this.state.selectedFolder )) {
      this.setState({ selectedFolder: nextProps.selectedFolder });
    }
  }

  _handleOpenModal(locationShowModal) {
    this.setState({ locationShowModal }, () => {
      if (locationShowModal) {
        const {  dispatch, match, fileStore, viewingAs } = this.props;
        const getDetail = _.cloneDeep(this.props.getDetail);
        this.setState({ locationShowModal: true });
        const listArgs =  {
          '~firm': getDetail.firmId
          , category: 'folder'
          , status: viewingAs === "portal" ? 'portal-view' : 'folder-only'
        }
  
        if (getDetail.type === "workspace") {
          listArgs['~client'] = getDetail.id;
        } else if (getDetail.type === "personal") {
          listArgs._personal = getDetail.id && getDetail.id.replace('personal', '') || null;
        }
        dispatch(fileActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(listArgs))).then(json => {
          if (json && json.success && json.list) {
            this.setState({ folderListItems: json.list });
          }
        });
      }
    });
  }

  _handleFilesChange(files) {

  }

  _handleStatusChange(e) {

  }

  _handleClose() {
    const { targetLocationUpdate } = this.state;
    this.setState({ locationShowModal: false, targetLocation: targetLocationUpdate, folderListItems: [] });
  }

  _handleSelectChange(value) {
    this.setState({ selectedFolder: value });
  }

  _handleAddNew(folder) {

    if (!folder) {
      const { match, selectedClient, targetLocation, personalId } = this.props;
      const firmId = match.params.firmId ? match.params.firmId : selectedClient && selectedClient._firm ? selectedClient._firm : null;
      const clientId = selectedClient && selectedClient._id || null;
      const userId = personalId || null;
  
      folder = {
        _id: null
        , _client: clientId
        , _folder: null
        , _firm: firmId
        , _personal: userId
        , category: "folder"
        , status: "visible"
        , wasAccessed: false
        , mangoClientID: selectedClient && selectedClient.mangoClientID ? selectedClient.mangoClientID : null
        , mangoCompanyID: selectedClient && selectedClient.mangoCompanyID ? selectedClient.mangoCompanyID : null 
      }
    }

    const folderListItems = _.cloneDeep(this.state.folderListItems);
    const newFolder = _.cloneDeep(folder);
    const newFolders = _.cloneDeep(this.state.newFolders);
    newFolder._id = "temporaryId-" + new Date().getTime();
    newFolder._folder = folder._id;
    newFolder.filename = "";
    newFolder.isFilenameValid = true;
    newFolders[newFolder._id] = newFolder;
    folderListItems.unshift(newFolder);
    this.setState({ newFolders, folderListItems });
  }
  
  _handleFormChange(e) {
    const value = e.target.value;
    const name = e.target.name;
    const newFolders = _.cloneDeep(this.state.newFolders);
    if (name && newFolders && newFolders[name]) {
      const folder = newFolders[name];
      const newValue = value ? value.replaceAll(/(\r\n|\n|\r)/gm, "") : value;
      folder.filename = newValue;
      if(!validationUtils.checkFilenameIsValid(newValue)) {
        folder.isFilenameValid = false;
      } else {
        folder.isFilenameValid = true;
      }
      newFolders[folder._id] = folder;
      this.setState({ newFolders });
    }
  }

  _handleCancelNew(fileId) {
    const newFolders = _.cloneDeep(this.state.newFolders);
    const folderListItems = _.cloneDeep(this.state.folderListItems);
    delete newFolders[fileId];
    const newFolderListItems = folderListItems.filter(item => item._id !== fileId);
    this.setState({ newFolders, folderListItems: newFolderListItems });
  }

  _handleFormSubmit(fileId) {
    const newFolders = _.cloneDeep(this.state.newFolders);
    const folderListItems = _.cloneDeep(this.state.folderListItems);
    const folder = newFolders[fileId];
    const { 
      dispatch,
      loggedInUser
    } = this.props;

    this.setState({ submitting: true });
    this.submitting = true;

    const sendData = {
      _user: loggedInUser._id
      , _client: folder._client
      , _folder: folder._folder
      , _firm: folder._firm
      , _personal: folder._personal
      , category: "folder"
      , filename: folder.filename
      , status: "visible"
      , wasAccessed: true
      , mangoClientID: folder.mangoClientID
      , mangoCompanyID: folder.mangoCompanyID
      , ParentID: folder.ParentID
      , YellowParentID: folder.YellowParentID
    }
    
    dispatch(fileActions.sendCreateFolder(sendData)).then(folderRes => {
      this.submitting = false;
      if (folderRes.success && folderRes.files && folderRes.files.length) {
        const file = folderRes.files[0];
        const newFolderListItems = folderListItems.filter(item => item._id !== fileId);
        newFolderListItems.unshift(file);
        delete newFolders[fileId];
        // dispatch(fileActions.addSingleFileToMap(file));
        // dispatch(fileActions.addFilesToList([file._id], ...this.props.listArgs));
        this.setState({ submitting: false, newFolders, folderListItems: newFolderListItems }, () => {
          this._handleSelectChange(file);
          if (this.props.handleSetInvalidList) {
            this.props.handleSetInvalidList();
          }
        })
      } else {
        alert("ERROR - Check logs");
        this.setState({ submitting: false });
      }
    });
  }

  render() {
    const selectedFolder = _.cloneDeep(this.state.selectedFolder);
    const { 
      targetLocation
      , locationShowModal
      , openFolder
      , targetLocationUpdate
      , folder
      , type 
      , newFolders
      , submitting
    } = this.state;
    const {
      selectedClient
      , handleLocationChange
      , selectedFileIds = []
      , action
      , viewingAs
      , allowCreateFolder
      , fileStore
      , personalId
      , match
    } = this.props;

    const folderListItems = _.cloneDeep(this.state.folderListItems);
    const listArgs = _.cloneDeep(this.state.listArgs);
    const utilFileStore = fileStore.util.getSelectedStore(...routeUtils.listArgsFromObject(listArgs));
    const isFetching = utilFileStore.isFetching;

    const renderElememt = (file) => {
      const filteredFiles = folderListItems.filter(item => 
        item._folder == file._id
        && !selectedFileIds.includes(item._id)
        && item.status != "archived"
        && item.status != "deleted"
      )
      return (
        <li key={file._id}>
          {
            file._id && file._id.toString().indexOf('temporaryId') === -1 ?
            <div
              style={{
                "marginBottom": "6px",
                "display": "flex",
                "alignItems": "center"
              }}
            >
              <input
                type="radio"
                value={file._id}
                onChange={this._handleSelectChange.bind(this, file)}
                checked={selectedFolder && file._id == selectedFolder._id}
              />
              <span className="-icon"
                style={{
                  "display": "flex",
                  "alignItems": "center",
                  "margin": "0 10px"
                }}
              >
                <img src={brandingName.image["folder-template"] || "/img/icons/folder-empty.png"} 
                  style={{
                    "width": "30px",
                    "height": "30px"
                  }}
                /> 
              </span>
              <span htmlFor={file.filename} className="display">{file.filename}</span>
              { allowCreateFolder ? <span><i className="fas fa-plus" onClick={this._handleAddNew.bind(this, file)}></i></span> : null }
            </div>
            :
            <div
              style={{
                "marginBottom": "6px",
                "display": "flex",
                "alignItems": "center"
              }}
            >
              <div className="-addnew-folder">
                <div className="yt-row center-vert">
                  <div className="-pB_10"> 
                  <TextInput
                    change={this._handleFormChange}
                    name={file._id}
                    value={newFolders && newFolders[file._id] && newFolders[file._id].filename}
                  />
                  </div>
                  <div className="center-vert">
                    <button className="yt-btn x-small link" onClick={this._handleCancelNew.bind(this, file._id)}>cancel</button>
                    <button className="yt-btn x-small success" onClick={this._handleFormSubmit.bind(this, file._id)} 
                      disabled={submitting || !newFolders || !newFolders[file._id] || !newFolders[file._id].filename || !newFolders[file._id].isFilenameValid || !(newFolders[file._id].filename && newFolders[file._id].filename.trim())}
                    >save</button>
                  </div>
                </div>
                {
                  newFolders && newFolders[file._id] && newFolders[file._id].isFilenameValid ? ""
                  : 
                  <small className="help-text"><em>A filename can't contain any of the following characters:  / : * ? " &lt; &gt; |</em></small>
                }
              </div> 
            </div>
          }
          { filteredFiles && filteredFiles.length ? 
            <ul style={{
              "listStyleType": "none"
            }}>
              {filteredFiles.map(item => renderElememt(item))}
            </ul>
            : null
          }
        </li>
      )
    }

    
    let filteredFolders = null;
    let renderFolders = null;

    if (folderListItems) {
      filteredFolders = folderListItems.filter(file => !file._folder && !selectedFileIds.includes(file._id));
    }

    if (filteredFolders && action === "move") {
      filteredFolders.unshift({
        _id: "rootfolder"
        , _folder: null
        , filename: "Root Folder"
        , _client: selectedFolder && selectedFolder._client || null
        , _personal: selectedFolder && selectedFolder._personal || ""
      })
    }

    renderFolders = (
      <div className="-select-folder" style={{
        "border": "1px solid rgba(0,0,0,.15)",
        "marginBottom": "16px",
        "padding": "16px"
      }}>
        {
          allowCreateFolder ? 
          <button
            className="yt-btn x-small info" 
            onClick={this._handleAddNew.bind(this, null)}>New Folder
          </button>
          :
          null
        }
        <ul style={{
          "listStyleType": "none",
          "padding": "0"
        }}>
          {
            filteredFolders && filteredFolders.length ?
            filteredFolders.map(item => renderElememt(item))
            : (
              <div className="hero -empty-hero">
                <div className="u-centerText">
                  <p>Empty folder. </p>
                </div>
              </div>
            )
          }
        </ul>
      </div>
    )

    let selectedFolderName = "Select Folder";
    if (selectedFolder && selectedFolder._id) {
      if (selectedFolder.filename) {
        selectedFolderName = selectedFolder.filename;
      } else if (fileStore && fileStore.byId && fileStore.byId[selectedFolder._id] && fileStore.byId[selectedFolder._id].filename) {
        selectedFolderName = fileStore.byId[selectedFolder._id].filename;
      }
    }

    return (
      // action === "move" ?  
      // <div style={{ marginBottom: "1em" }}>
      //   <small>Note: All Selected Folders is not visible.</small>
      //   <br/>
      //   <label>Location:</label>
      //   <span className="-target-location">{ targetLocation.path }</span>
      //   <div style={{ float: "right" }}>
      //     <span>
      //       <p style={{ fontSize: 12, display: "inline", cursor: "pointer" }} onClick={() => sort(type)}>
      //         <i className={type === "" ? "fad fa-sort" : type === "asc" ? "fad fa-sort-up" : "fad fa-sort-down"}></i>
      //         {type === "" ? "sort" : type === "asc" ? "ascending" : "descending"}
      //       </p>
      //     </span>
      //   </div>
      //   <div className="-folder-location">{ renderFolders ? renderFolders.length ? renderFolders : <em>No folders</em> : null }</div>
      // </div> 
      // : 
      <div className="input-group">
        <button type="button" className="yt-btn link info"
          onClick={this._handleOpenModal.bind(this, !locationShowModal)}>
          {selectedFolderName}
        </button>
        <span className="-target-location">{ targetLocation.path }</span>
        <Modal
            closeAction={this._handleClose}
            closeText="Cancel"
            confirmAction={() => this.setState({ locationShowModal: false, targetLocationUpdate: targetLocation }, () => {
              handleLocationChange(selectedFolder);
            })}
            confirmText="Save"
            isOpen={locationShowModal}
            modalHeader={`Select Folder`} // "Select Folder"
            cardSize="jumbo"
        >
          {
              isFetching ? (
                <div className="-loading-hero hero">
                  <div className="u-centerText">
                    <div className="loading"></div>
                  </div>
                </div>  
              ) 
              :
              renderFolders
              // (<div className="hero -empty-hero">
              //   <div className="u-centerText">
              //     <p>Empty folders. </p>
              //   </div>
              // </div>)
          }
        </Modal>
      </div>
    )
  }
}

FileLocation.propTypes = {
  // fileFolderLocation: PropTypes.object
  // , selectedClient: PropTypes.object
  // , handleLocationChange: PropTypes.func
}

FileLocation.defaultProps = {
}

const mapStoreToProps = (store, props) => {
    return {
      loggedInUser: store.user.loggedIn.user
      , fileStore: store.file
    }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(FileLocation)
);
