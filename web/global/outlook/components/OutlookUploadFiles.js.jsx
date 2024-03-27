/* global Office:false */

import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

import Binder from '../../components/Binder.js.jsx';
import { 
  FileInput,
  RadioInput,
  SelectFromObject,
} from '../../components/forms';

import * as clientActions from '../../../resources/client/clientActions';
import * as fileActions from '../../../resources/file/fileActions';
import * as staffClientActions from '../../../resources/staffClient/staffClientActions';
import * as userActions from '../../../resources/user/userActions';
import * as activityActions from '../../../resources/activity/activityActions';
import * as staffActions from '../../../resources/staff/staffActions';

import { displayUtils } from '../../utils';
import apiUtils from '../../utils/api';

const dataURLtoFile = (dataurl, filename) => {
  let arr = dataurl.split(','),
    bstr = atob(arr[1]),
    // eslint-disable-next-line prefer-destructuring
    mime = arr[0].match(/:(.*?);/)[1],
    n = bstr.length,
    u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

class OutlookUploadFiles extends Binder {
  constructor(props) {
    super(props);

    this.state = {
      attachments: props.location.state ? props.location.state.attachments : []
      , clientId: null
      , convertedAttachments: []
      , errorMessage: null
      // , files: props.location.state.attachments ? this._convertAttachments(props.location.state.attachments) : []
      , files: []
      , preparing: false
      , progressError: []
      , progressPercent: []
      , status: 'visible'
      , submitting: false
      , _personal: null
      , folderList: []
      , selectedFolder: {}
      , folders: []
      , fileIds: []
    };

    this._bind(
      '_convertAttachments'
      , '_handleClose'
      , '_handleFilesChange'
      , '_handleFormChange'
      , '_handleFormSubmit'
      , '_removeConverted'
      , 'convertAttachment'
      , 'removeAttachments'
      , 'removeAttachment'
      , '_handleFolderChange'
      , '_handleShowFolderTree'
    );

    const { loggedInUser, socket, isIframeInitialized, dispatch, location, shareLinkStore } = this.props;
    const { uploadedFileIds } = location && location.state ? location.state : {};
    const shareLink = shareLinkStore.selected.getItem();
    const forward = this.props.computedMatch.params.forward;

    socket.on('disconnect', reason => {
      // console.log('socket disconnected!!!');
      // console.log(reason);
      // We've been disconnected for some reason. Reconnect.
      socket.open();
    })
    // The connect event also fires on reconnect. That's when this will be hit since this component will not
    // yet be mounted when the socket first connects (when outlook.pug is loaded).
    socket.on('connect', () => {
      // console.log('Connected!');
      if(loggedInUser && loggedInUser._id) {
        // console.log('subscribing to userid');
        socket.emit('subscribe', loggedInUser._id);
      }
    })
    
    socket.on('created_folder_finished', (folders) => {
      if (forward === "share") {
        const fileIds = [];
        folders.forEach(item => fileIds.push(item._id));
        this.setState({ fileIds });
      }
    });

    socket.on('upload_progress', (progress, index) => {
      let newProgress = _.update(_.cloneDeep(this.state.progressPercent), index, () => {
        return progress;
      });
      this.setState({ progressPercent: newProgress });
    })

     // Used to display an error on a single file upload.
     socket.on('upload_progress_error', (error, index) => {
      // console.log('Upload progress error', error);
      let newProgressError = _.update(_.cloneDeep(this.state.progressError), index, () => {
        return error;
      });
      this.setState({progressError: newProgressError});
    })

    socket.on('upload_finished', (files) => {
      if (!isIframeInitialized) {
        this.removeAttachments() // async
      }

      this.setState({
        // files: []
        progressPercent: []
        , submitting: false
      });
      if (this.props.handleUploaded) {
        this.props.handleUploaded(files)
      }

      if (isIframeInitialized) {
        dispatch(activityActions.sendCreateActivityOnStaffFileUpload({files}))
      }
      
      files.map(file => this.props.dispatch(fileActions.addSingleFileToMap(file)))
      let newUploadedFileIds = [];
      const fileIds = _.cloneDeep(this.state.fileIds);
      const selectedFolder = _.cloneDeep(this.state.selectedFolder);
      if (newUploadedFileIds && fileIds && fileIds.length) {
        newUploadedFileIds = newUploadedFileIds.concat(fileIds);
      }
      if (uploadedFileIds && uploadedFileIds.length) {
        newUploadedFileIds = newUploadedFileIds.concat(uploadedFileIds);
      }

      files.forEach(file => {
        if (!file._folder || (file._folder && (!fileIds.includes(Number(file._folder)) && file._folder == selectedFolder._id))) {
          newUploadedFileIds.push(file._id);
        }
      });
      
      this.props.history.replace({
        pathname: `/${forward}`,
        state: { 
          clientId: this.state.clientId
          , uploadedFileIds: newUploadedFileIds
          , currentFile: !!files[0] ? files[0]: {}
          , files: this.state.files 
          , attachments: this.state.attachments
          , shareLink: shareLink
        },
      });
    })
  }

  componentDidMount() {
    const { dispatch, loggedInUser, selectedStaff, socket, fileStore, selectedFirm } = this.props;
    if(socket && socket.disconnected) {
      socket.open();
    } else if(socket && socket.connected && loggedInUser && loggedInUser._id) {
      socket.emit('subscribe', loggedInUser._id);
    }
    if(this.props.location.state && this.props.location.state.attachments) {
      this._convertAttachments(this.props.location.state.attachments)
    }

    console.log("this.props", this.props);
    
    if (selectedStaff) {
      // fetch client info for this staff member
      dispatch(clientActions.fetchListIfNeeded('_firm', selectedStaff._firm));
      dispatch(staffClientActions.fetchListIfNeeded('_firm', selectedStaff._firm, '_user', loggedInUser._id, '~staff.status', 'active'));
      dispatch(userActions.fetchListIfNeeded('_firm', selectedStaff._firm));
    }

    if(selectedFirm && selectedFirm._id) {
      dispatch(fileActions.fetchListIfNeeded('~firm', selectedFirm._id, 'category', "folder")).then(folderRes => {
        console.log("folderRes", folderRes);

        if(folderRes && folderRes.list && folderRes.list.length > 0) {
          this.setState({folderList: folderRes.list});
        }
      })
    }
  }

  componentWillUnmount() {
    const { socket } = this.props;
    socket.off('disconnect')
    socket.off('connect')
    socket.off('upload_progress')
    socket.off('upload_progress_error')
    socket.off('upload_finished')
  }

  // componentDidUpdate(prevProps) {
  //   // Typical usage (don't forget to compare props):
  //   if (this.props.userID !== prevProps.userID) {

  //   }
  // }

  _convertAttachments(attachments) {
    return Promise.all(attachments.map(attachment => this.convertAttachment(attachment)))
  }

  _removeConverted = index => {
    let converted = [...this.state.convertedAttachments]
    // console.log(converted)
    // converted.splice(index, 1);
    this.setState({convertedAttachments: converted})
  }

  convertAttachment(attachment) {
    return new Promise((resolve) => {
      Office.context.mailbox.item.getAttachmentContentAsync(attachment.id, (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          this.setState({
            errorMessage: 'Error code 511 - Unable to fetch attachment.',
          });
        } else if (result.value.format === Office.MailboxEnums.AttachmentContentFormat.Base64) {
          const file = dataURLtoFile(`data:${attachment.contentType};${result.value.format},${result.value.content}`, attachment.name);

          this.setState(prevState => ({
            convertedAttachments: [...prevState.convertedAttachments, file]
          }))
        } else {
          this.setState({
            errorMessage: 'Error code 512 - Unable to convert attachment.',
          });
        }
        resolve(true)
      });
    });
  }

  removeAttachments() {
    const { attachments } = this.state
    return Promise.all(attachments.map(attachment => this.removeAttachment(attachment)));
  }

  removeAttachment(attachment) {
    return new Promise((resolve) => {
      Office.context.mailbox.item.removeAttachmentAsync(attachment.id, (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          this.setState({
            errorMessage: 'Error code 512 - Unable to remove attachment.',
          });
        } else {
          // TODO
        }
        resolve()
      });
    });
  }

  _handleClose() {
    const { history, uploadedFileIds } = this.props;

    this.setState({
      errorMessage: null,
      files: uploadedFileIds || [],
      submitting: false,
    });

    // history.goBack();
    // for chrome store purposes history.replace("/actions");
    history.replace("/actions");
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    const newState = _.cloneDeep(this.state);
    if (e.target.name === "clientId") {
      const val = e.target.value ? e.target.value.toString() : "";
      newState._personal = val.includes("personal") ? val : null;
      newState.clientId = val.includes("personal") ? null : val;
      newState.selectedFolder = {};
    } else {
      newState[e.target.name] = e.target.value;
    }

    // const newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
    //   return e.target.value;
    // });

    this.setState(newState);
  }

  _handleFilesChange(files, folders) {
    if (folders && folders.length) {
      this.setState({files, folders});
    } else {
      this.setState({files});
    }
  }

  _handleFolderChange(e) {
    const val = e.target.value ? e.target.value.toString() : "";
    this.setState({selectedFolder: val});
  }

  _handleFormSubmit() {
    const { dispatch, loggedInUser, selectedFirm, socket } = this.props;
    const { selectedFolder, clientId, convertedAttachments, status, _personal } = this.state;

    let { files, folders } = this.state;
    files = files.filter(file => !file.virusDetected && !file.fileNotFound);

    if(files.length > 0 || convertedAttachments.length > 0 || folders.length) {
      this.setState({
        preparing: true
        , files
      });

      const newFiles = files.concat(convertedAttachments);
      const params = {
        _firm: selectedFirm._id
        , status
        , viewingAs: "workspace"
      }

      if (clientId) {
        params._client = clientId;
      }
      if (_personal) {
        params._personal = _personal.replace("personal", "");
      }
      if(selectedFolder && selectedFolder._id) {
        params._folder = selectedFolder._id;
      }

      apiUtils.upload(this.props, newFiles, folders, params, result => {
        if(result.success) {
          this.setState({
            submitting: true  
            , preparing: false
          });
        } else {
          this.setState({
            preparing: false
            , submitted: false
          });
          alert("ERROR: " + result.error)
          // alert("ERROR - Check logs");
        }
      });
    }
  }

  _handleShowFolderTree() {    
    const { selectedFirm } = this.props;

    const appUrl = !!window.location.host ? window.location.host : window.appUrl;
    const domain = appUrl.includes('localhost') ? 'localhost:9191' : appUrl;
    const tmpthis = this;
    let dialog = Office.dialog;

    console.log('selectedFirm', selectedFirm);

    const firmId = selectedFirm._id;
    const clientId = !!this.state.clientId ? this.state.clientId : null;

    function processMessage(arg) {
      const messageFromDialog = JSON.parse(arg.message);

      const { messageText, selectedFolder } = messageFromDialog;

      console.log('received message', messageFromDialog);

      if(messageText == "dialogClosed") {
        tmpthis.setState({
          selectedFolder
        }, () => dialog.close());
      }
    }

    const url = !!clientId ? `https://${domain}/outlook/#/select-folder/${firmId}/${clientId}`
      : `https://${domain}/outlook/#/select-folder/${firmId}/public/${!!this.state._personal ? this.state._personal.replace("personal", "") : 'general'}`

    Office.context.ui.displayDialogAsync(url, 
    { height: 85, width: 60, displayInIframe: true }, function(result) {

            
      console.log('domain', domain);
      console.log('dialog result', result);
      console.log(Office.AsyncResultStatus)


      if (result.status === Office.AsyncResultStatus.Failed) {
        console.log(result.error.code + ": " + result.error.message)
        // alert("Outlook client not supported");
      } else {
        dialog = result.value;
        // passing file to custom template

        dialog.addEventHandler(Office.EventType.DialogMessageReceived, processMessage);
      }

    });
  }

  _getFileIcon = (file) => {
    if(file.type.includes('pdf') || file.type.includes('text')) {
      return displayUtils.getFileIcon('document', file.type, file)
    } else if(file.type.includes('image')) {
      return displayUtils.getFileIcon('image', file.type, file);
    } else if(file.type.includes('video')) {
      return displayUtils.getFileIcon('video', file.type, file);
    } else {
      return 'file-80'
    }
  }

  render() {
    const { selectedFolder, folderList, convertedAttachments, errorMessage, files, preparing, progressError, progressPercent, submitting } = this.state;
    const { firm, loggedInUser, workspaceList, uploadedFiles, location, computedMatch, isIframeInitialized } = this.props;
    // console.log("attachments", this.state.attachments)
    // console.log("convertedAttachments", this.state.convertedAttachments)
    // console.log("files", this.state.files)
    const allowMultiple = (
      // Do not allow multiple files on signtature requests.
      computedMatch
      && computedMatch.params
      && computedMatch.params.forward
      && computedMatch.params.forward !== 'signature'
    )
    if(preparing) {
      return (
        <span><i className="fas fa-spinner fa-spin"/>{` Preparing file${files.length > 1 ? 's...' : '...'}`}</span>
      )
    }
    if(submitting) {
      // return (<OutlookLoading />);
      return files.map((file, i) =>
        <div key={file.name + "_" + i} style={{ padding: '1em' }}>
        { progressError[i] ?
          <p><small><strong>{file.name}</strong></small>{` - ${progressError[i]}`}</p>
          :
          <p><small><strong>{file.name}</strong></small>{` - ${progressPercent[i] || 0}%`}</p>
        }
          <div className={`progress-bar-${progressPercent[i] || 0}`} >
            <div className="-progress">
              <div className="-complete">
              </div>
            </div>
          </div>
        </div>
      )
    }

    let filterFolders = [];

    if(this.state.clientId) {
      filterFolders = folderList.filter((folder) => {
        return folder._client == this.state.clientId
      })
    } else {
      if(this.state._personal) {
        filterFolders = folderList.filter((folder) => {
          return !folder._client && folder._personal == this.props.selectedStaffId;
        });
      } else {
        filterFolders = folderList.filter((folder) => {
          return !folder._client && !folder._personal;
        });
      }
    }

    return (
      <div>
        <h4>Upload files</h4>
        <hr />
        <br />
        {errorMessage && (
          <div className="input-group">
            <div className="-error-message">{errorMessage}</div>
          </div>
        )}
        <FileInput
          change={this._handleFilesChange}
          multiple={allowMultiple}
          required
          dispatch={this.props.dispatch}
          computedMatch={computedMatch}
        />
        { convertedAttachments.length > 0 ?
          <div className='files-list 1'>
            <h4>Converted attachments</h4>
            <ul>
              { convertedAttachments.map((file, i) =>
                <div className="file-micro-list-item 2" key={'attachment_' + i}>
                <div className="-icon">
                  <img src={`/img/icons/${this._getFileIcon(file)}.png`} />
                </div>
                { file ? 
                  <div className="-info">
                    <div className="-title">
                      {file.name}
                    </div>
                  </div>
                  :
                  <div className="-info">
                    <i className="far fa-spinner fa-spin"/>
                  </div>
                }
                <div className="-times">
                  <button onClick={() => this._removeConverted(i)} className="yt-btn link xx-small u-pullRight">
                    <i className="far fa-times"/>
                  </button>
                </div>
              </div>
              )}
            </ul>
          </div>
          :
          null 
        }
        <hr/>
        <h4>Select a workspace or upload to general files</h4>

        {workspaceList && workspaceList.length > 0 ?
          <div>
            <SelectFromObject
              change={this._handleFormChange}
              isClearable={true}
              display="name"
              displayStartCase={false}
              filterable={true}
              items={workspaceList}
              name="clientId"
              placeholder="Upload to general files"
              //selected={this.state.clientId}
              selected={this.state.clientId || this.state._personal}
              value="_id"
            />
            {
              !isIframeInitialized ? 
              <div style={{
                  "color": "#4ebac5",
                  "cursor": "pointer",
                  "padding": "2px 8px",
                  "marginBottom": "16px"
                }}
                onClick={() => this._handleShowFolderTree()}
              >
                {
                  selectedFolder && selectedFolder._id ?
                  `Folder - ${selectedFolder.filename}`
                  :
                  'Select a folder'
                }
              </div>
              :
              null
            }
          </div>
          :
          <p><em>You do not have any workspaces available. Files will upload to General Files.</em></p>
          
        }
        {/* <SelectFromObject
          change={this._handleFolderChange}
          items={filterFolders}
          disabled={false}
          display='filename'
          displayStartCase={false}
          filterable={true}
          isClearable={true}
          label="Select file location"
          name='folderId'
          placeholder='Upload to root folder'
          selected={this.state.selectedFolder}
          value='_id'
        /> */}
        
        {this.state.clientId ?
          <RadioInput
            label="Should these files be visible to everyone in the client's portal or hidden?"
            options={[
              { val: 'visible', display: `Visible in the client's portal` },
              { val: 'hidden', display: `Hidden from client's portal` },
            ]}
            name="status"
            value={this.state.status}
            change={this._handleFormChange}
            inLine={false}
          />
          :
          null
        }
        <div className="yt-container">
          <div className="yt-row space-between">
            <button
              type="button"
              className="yt-btn info small link"
              onClick={this._handleClose}
            >
              cancel
            </button>
            <button
              type="button"
              className="yt-btn info small"
              onClick={this._handleFormSubmit}
              disabled={submitting || ((!convertedAttachments || convertedAttachments.length < 1) && (!files || files.length < 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }
}

OutlookUploadFiles.propTypes = {
  attachmentIds: PropTypes.array
  , dispatch: PropTypes.func.isRequired
  , history: PropTypes.object.isRequired
  , selectedStaffId: PropTypes.number.isRequired
};

const mapStoreToProps = (store, props) => {
  const { selectedStaffId } = props;
  const staffStore = store.staff;
  const firmStore = store.firm;
  const selectedStaff = staffStore.byId[selectedStaffId]
  const selectedFirm = selectedStaff && firmStore.byId[selectedStaff._firm];
  const loggedInUser = store.user.loggedIn.user;
  const staffClientStore = store.staffClient;

  const isStaffOwner = selectedStaff && selectedStaff.owner // permissions.isStaffOwner(selectedStaff, loggedInUser, selectedFirm._id);
  
  const staffClientListItems = selectedStaff ? staffClientStore.util.getList('_firm', selectedStaff._firm, '_user', loggedInUser._id, '~staff.status', 'active') : null;
  const staffOnlyClientList = staffClientListItems ? staffClientListItems.map((item => item._client)) : [];

  const clientList = store.client.lists && store.client.lists._firm && store.client.lists._firm[selectedStaff._firm] && !store.client.lists._firm[selectedStaff._firm].isFetching ? store.client.lists._firm[selectedStaff._firm].items : [];
  let workspaceList = [];
  if(clientList && clientList.length > 0) {
    if(isStaffOwner) {
      workspaceList = clientList.map(clientId => store.client.byId[clientId])
    } else {
      workspaceList = staffOnlyClientList.map(clientId => store.client.byId[clientId])
    }
  }

  workspaceList = workspaceList.filter(client => client ? client.status === "visible" : null);
  workspaceList.sort((a, b) => {
    if(a.name.toLowerCase() < b.name.toLowerCase()) {
      return -1
    } else {
      return 1
    }
  });

  if (selectedFirm && workspaceList && loggedInUser) {
    workspaceList.unshift({
      _id: `personal${loggedInUser._id}`
      , name: "Your Staff Files"
      , _firm: selectedFirm._id
      , _staff: loggedInUser._id
    });
  }

  const uploadedFiles = store.file && store.file.byId ?
    Object.keys(store.file.byId).map(fileId => {
      return store.file.byId[fileId];
    }) : null;

  return {
    clientStore: store.client
    , loggedInUser
    , selectedFirm
    , selectedStaff
    , socket: store.user.socket
    , workspaceList
    , fileStore: store.file
    , uploadedFiles
    , shareLinkStore: store.shareLink
  }
};

export default withRouter(connect(mapStoreToProps)(OutlookUploadFiles));
