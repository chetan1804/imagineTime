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
import _, { filter } from 'lodash';

// import actions
import * as folderActions from '../folderActions';
import * as fileActions from "../../file/fileActions";
import * as clientActions from "../../client/clientActions";
// import global components
import Binder from "../../../global/components/Binder.js.jsx";

import {
  SelectFromObject
  , TextInput
} from '../../../global/components/forms';
import { validationUtils, routeUtils } from "../../../global/utils";


import brandingName from '../../../global/enum/brandingName.js.jsx';

// import file components

class SelectFolderList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      selectedFolder: false,
      filteredFolders: [],
      allFolders: [],
      workspaces: [],
      rootFolders: [],
      selectedClient: {},
      selectedFolder: '',
      newFolders: {},
      submitting: false,
      listArgs: {
        '~firm': props.match.params.firmId
        , 'category': 'folder'
        , 'status': 'not-archived'
      }
    }

    this._bind(
      '_handleSelectChange',
      '_handleSubmit',
      '_handleAddNew',
      '_handleFormChange',
      '_handleCancelNew',
      '_handleFormSubmit'
    )
  }

  componentDidMount() {

    const { dispatch, match, selectedUserId, selectedClientId } = this.props;

    const firmId = match.params.firmId;

    const clientId = !!match.params.clientId ? match.params.clientId : selectedClientId ? selectedClientId : null;

    const userId = !!match.params.userId ? match.params.userId : selectedUserId ? selectedUserId : null;

    if(clientId) {
      dispatch(clientActions.fetchListIfNeeded('_firm', firmId, '_id', clientId)).then((clients) => {
        if(clients && 
          clients.list && 
          clients.list.length > 0) {
            this.setState({selectedClient: clients.list[0]});
        }
      });
    }

    const listArgs = _.cloneDeep(this.state.listArgs);
    if (!!clientId) {
      listArgs._client = clientId;
    }

    this.setState({ listArgs });

    dispatch(fileActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(listArgs))).then(folderRes => {

      if(folderRes && folderRes.list && folderRes.list.length > 0) {
        const allFolders = folderRes.list
        const filteredFolders = allFolders.filter(f => {
          if(!!clientId) {
            return f.status == 'visible' && f._client == clientId
          } else if(userId && userId == 'general') {
            return f.status == 'visible' && !f._client && !f._personal;
          } else if(userId && userId != 'general') {
            return f.status == 'visible' && !f._client && f._personal == userId;
          } else if (!userId && !clientId) {
            return f.status == 'visible' && !f._client && !f._personal;
          } else {
            return false;
          }
        });

        const rootFolders = filteredFolders.filter(f => {
          return !f._folder
        })

        this.setState({
          allFolders,
          filteredFolders,
          rootFolders
        });
      }
    });

  }

  _handleSelectChange(e) {

    console.log('e', e.target.name);
    console.log('e', e.target.value);

    this.setState({
      selectedFolder: e.target.value
    })
  }

  _handleSubmit(e) {
    e.preventDefault();

    const {
      handleSelectFolder
    } = this.props;

    const {
      allFolders
    } = this.state;

    const selectedFolderObj = allFolders.filter(f => f._id == this.state.selectedFolder)[0];
    handleSelectFolder(selectedFolderObj);
  }

  _renderChildFolders(folderId) {

    const {
      selectedFolder,
      newFolders,
      submitting
    } = this.state

    const filteredFolders = _.cloneDeep(this.state.filteredFolders);
    const childFolders = filteredFolders.filter(f => f._folder == folderId);

    return (
      childFolders && childFolders.length > 0 ?
        <ul style={{
          "listStyleType": "none"
        }}>
          {
            childFolders.map((folder, i) => (
              <li key={folder._id}>
                {
                  folder._id && folder._id.toString().indexOf('temporaryId') === -1 ?
                  <div
                    style={{
                      "marginBottom": "6px",
                      "display": "flex",
                      "alignItems": "center"
                    }}
                  >
                    <input
                      type="radio"
                      name={`${folder.filename}${i}`}
                      value={folder._id}
                      onChange={(e) => this._handleSelectChange(e)}
                      checked={folder._id == selectedFolder}
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
                    <span htmlFor={`${folder.filename}${i}`} className="display">{folder.filename}</span>
                    <span><i className="fas fa-plus" onClick={this._handleAddNew.bind(this, folder)}></i></span>
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
                          name={folder._id}
                          value={newFolders && newFolders[folder._id] && newFolders[folder._id].filename}
                        />
                        </div>
                        <div className="center-vert">
                          <button className="yt-btn x-small link" onClick={this._handleCancelNew.bind(this, folder._id)}>cancel</button>
                          <button className="yt-btn x-small success" onClick={this._handleFormSubmit.bind(this, folder._id)} 
                            disabled={submitting || !newFolders || !newFolders[folder._id] || !newFolders[folder._id].filename || !newFolders[folder._id].isFilenameValid || !(newFolders[folder._id].filename && newFolders[folder._id].filename.trim())}
                          >save</button>
                        </div>
                      </div>
                      {
                        newFolders && newFolders[folder._id] && newFolders[folder._id].isFilenameValid ? ""
                        : 
                        <small className="help-text"><em>A filename can't contain any of the following characters:  / : * ? " &lt; &gt; |</em></small>
                      }
                    </div> 
                  </div>
                }
                {this._renderChildFolders(folder._id)}
              </li>
            ))
          }
        </ul>
        :
        null
    )
  }

  _renderFolders() {

    const {
      selectedFolder,
      selectedClient,
      newFolders,
      submitting
    } = this.state

    const rootFolders = _.cloneDeep(this.state.rootFolders);

    return(
      <div style={{
        "border": "1px solid rgba(0,0,0,.15)",
        "marginBottom": "16px",
        "padding": "16px"
      }}>
        {
          !!selectedClient._id ?
          <div>
            {`${selectedClient.name} Folders`}
          </div>
          :
          null
        }

        <button
          className="yt-btn x-small info" 
          onClick={this._handleAddNew.bind(this, null)}>New Folder
        </button>
        {
          rootFolders && rootFolders.length > 0 ?
            <ul style={{
              "listStyleType": "none",
              "padding": "0"
            }}>
              {
                rootFolders.map((folder, i) => (
                  <li key={folder._id}>
                    {
                      folder._id && folder._id.toString().indexOf('temporaryId') === -1 ?
                      <div
                        style={{
                          "marginBottom": "6px",
                          "display": "flex",
                          "alignItems": "center"
                        }}
                      >
                        <input
                          type="radio"
                          name={`${folder.filename}${i}`}
                          value={folder._id}
                          onChange={this._handleSelectChange}
                          checked={folder._id == selectedFolder}
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
                        <span htmlFor={`${folder.filename}${i}`} className="display">
                          {folder.filename}
                        </span>
                        <span><i className="fas fa-plus" onClick={this._handleAddNew.bind(this, folder)}></i></span>
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
                              name={folder._id}
                              value={newFolders && newFolders[folder._id] && newFolders[folder._id].filename}
                            />
                            </div>
                            <div className="center-vert">
                              <button className="yt-btn x-small link" onClick={this._handleCancelNew.bind(this, folder._id)}>cancel</button>
                              <button className="yt-btn x-small success" onClick={this._handleFormSubmit.bind(this, folder._id)} 
                                disabled={submitting || !newFolders || !newFolders[folder._id] || !newFolders[folder._id].filename || !newFolders[folder._id].isFilenameValid || !(newFolders[folder._id].filename && newFolders[folder._id].filename.trim())}
                              >save</button>
                            </div>
                          </div>
                          {
                            newFolders && newFolders[folder._id] && newFolders[folder._id].isFilenameValid ? ""
                            : 
                            <small className="help-text"><em>A filename can't contain any of the following characters:  / : * ? " &lt; &gt; |</em></small>
                          }
                        </div> 
                      </div>
                    }
                    {this._renderChildFolders(folder._id)}
                  </li>
                ))
              }
            </ul>
            :
            "No Folders Present"
        }
      </div>
    )
  }

  _handleAddNew(folder) {
    if (!folder) {
      const { match, selectedUserId, selectedClientId } = this.props;
      const { selectedClient } = this.state;
      const firmId = match.params.firmId;
      const clientId = !!match.params.clientId ? match.params.clientId : selectedClientId ? selectedClientId : null;
      const userId = !!match.params.userId ? match.params.userId : selectedUserId ? selectedUserId : null;
  
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

    const newFolder = _.cloneDeep(folder);
    const newFolders = _.cloneDeep(this.state.newFolders);
    newFolder._id = "temporaryId-" + new Date().getTime();
    newFolder._folder = folder._id;
    newFolder.filename = "";
    newFolder.isFilenameValid = true;
    newFolders[newFolder._id] = newFolder;
    
    if (folder._id) {
      const filteredFolders = _.cloneDeep(this.state.filteredFolders);
      filteredFolders.unshift(newFolder);
      this.setState({ newFolders, filteredFolders });
    } else {
      const rootFolders = _.cloneDeep(this.state.rootFolders);
      rootFolders.unshift(newFolder);
      this.setState({ newFolders, rootFolders });
    }
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

  _handleCancelNew(folderId) {
    const newFolders = _.cloneDeep(this.state.newFolders);
    const filteredFolders = _.cloneDeep(this.state.filteredFolders);
    const rootFolders = _.cloneDeep(this.state.rootFolders);
    delete newFolders[folderId];
    if (newFolders[folderId] && newFolders[folderId]._folder) {
      const newFolderListItems = filteredFolders.filter(item => item._id !== folderId);
      this.setState({ newFolders, filteredFolders: newFolderListItems });
    } else {
      const newFolderListItems = rootFolders.filter(item => item._id !== folderId);
      this.setState({ newFolders, rootFolders: newFolderListItems });
    }
  }

  _handleFormSubmit(folderId) {
    const listArgs = _.cloneDeep(this.state.listArgs);
    const newFolders = _.cloneDeep(this.state.newFolders);
    const folder = newFolders[folderId];

    const { 
      dispatch,
      loggedInUser,
      match
    } = this.props;

    const firmId = match.params.firmId;
    this.setState({ submitting: true });

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

    if (sendData && sendData._personal === "general") {
      delete sendData._personal;
    }
    
    dispatch(fileActions.sendCreateFolder(sendData)).then(folderRes => {
      if (folderRes.success && folderRes.files && folderRes.files.length) {
        const file = folderRes.files[0];
        const allFolders = _.cloneDeep(this.state.allFolders);
        allFolders.push(file);
        dispatch(fileActions.addSingleFileToMap(file));
        dispatch(fileActions.addFilesToList([file._id], ...routeUtils.listArgsFromObject(listArgs)));

        if (file._folder) {
          const filteredFolders = _.cloneDeep(this.state.filteredFolders);
          let newFolderListItems = filteredFolders;
          newFolderListItems = newFolderListItems.map(item => {
            return item._id === folderId ? file : item;
          });
          delete newFolders[folderId];
          this.setState({ submitting: false, allFolders, newFolders, filteredFolders: newFolderListItems }, () => {
            this._handleSelectChange({ target: { value: file._id } })
          });
        } else {
          const rootFolders = _.cloneDeep(this.state.rootFolders);
          let newFolderListItems = rootFolders;
          newFolderListItems = newFolderListItems.map(item => {
            return item._id === folderId ? file : item;
          });
          delete newFolders[folderId];
          this.setState({ submitting: false, allFolders, newFolders, rootFolders: newFolderListItems }, () => {
            this._handleSelectChange({ target: { value: file._id } })
          });
        }
      } else {
        alert("ERROR - Check logs");
        this.setState({ submitting: false });
      }
    });
  }
  

  render() {

    const {
      fileStore,
      match,
      hideHeader
    } = this.props;

    const listArgs = _.cloneDeep(this.state.listArgs);
    const fileStoreInfo = fileStore.util.getSelectedStore(...routeUtils.listArgsFromObject(listArgs));
    
    const isEmpty = (
      !fileStoreInfo
      || fileStoreInfo.isFetching
    );

    const isFetching = (
      !fileStoreInfo
        || fileStoreInfo.isFetching
    );

    return (
      <div style={{
        "width": "100%"
      }}>
        <div className="-select-folder">
          <div className="card">
            {
              hideHeader ? null
              : 
              <div className="card-header">
                <div className="yt-row center-vert space-between">
                  Select Folder
                </div>
              </div>
            }
            <div className="card-body">
            { isEmpty ?
              (isFetching ? 
                <div className="-loading-hero hero">
                  <div className="u-centerText">
                    <div className="loading"></div>
                  </div>
                </div>
                : 
                <h2>Empty.</h2>
              )
              : this._renderFolders()
            }
            </div>
            <div className="card-footer">
              <div className="yt-row space-between">
                <button style={{"visibility": "hidden"}}></button>
                <button type="button" className="yt-btn small info" onClick={this._handleSubmit}>Select Folder</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

SelectFolderList.propTypes = {
  dispatch: PropTypes.func.isRequired
  , history: PropTypes.object.isRequired
  , handleSelectFolder: PropTypes.func
}

SelectFolderList.defaultProps = {
  hideHeader: false
}

const mapStoreToProps = (store, props) => {

  const loggedInUser = store.user.loggedIn.user;

  return {
    loggedInUser
    , fileStore: store.file
  }
}

export default withRouter(
    connect(
        mapStoreToProps
    )(SelectFolderList)
);
