import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import _ from 'lodash';

import Binder from '../../components/Binder.js.jsx';
import {
  FileInput,
  RadioInput,
  TextInput,
  SelectFromObject
} from '../../components/forms';

import * as clientActions from '../../../resources/client/clientActions';
import * as fileActions from '../../../resources/file/fileActions';
import * as firmActions from '../../../resources/firm/firmActions';
import * as staffActions from '../../../resources/staff/staffActions';
import * as staffClientActions from '../../../resources/staffClient/staffClientActions';
import * as userActions from '../../../resources/user/userActions';

// import utilities
import { filterUtils, permissions, routeUtils } from '../../utils';
import brandingName from '../../enum/brandingName.js.jsx';


class DesktopUploadFiles extends Binder {
  constructor(props) {
    super(props);

    this.state = {
      clientId: null
      , errorMessage: null
      , files: []
      , preparing: false
      , printFile: false
      , printFilename: ''
      , progressError: []
      , progressPercent: []
      , status: 'hidden'
      , submitting: false
      , uploadedFileIds: []
      , _personal: null
      , folders: []
      , selectedFolder: ''
    };

    this._bind(
      '_goToShareFiles'
      , '_goToRequestSignature'
      , '_handleFilesChange'
      , '_handleFormSubmit'
      , '_handleFormPrint'
      , '_handleFormChange'
      , '_uploadMore'
      , '_handlePrintFileStatus'
      , '_handleFolderChange'
    );

    const { loggedInUser, socket } = this.props;

    socket.on('disconnect', reason => {
      // console.log('socket disconnected!!!');
      // console.log(reason);
      // We've been disconnected for some reason. Reconnect.
      socket.open();
    })
    // The connect event also fires on reconnect. That's when this will be hit since this component will not
    // yet be mounted when the socket first connects (when desktop.pug is loaded).
    socket.on('connect', () => {
      // console.log('Connected!');
      if(loggedInUser && loggedInUser._id) {
        // console.log('subscribing to userid');
        socket.emit('subscribe', loggedInUser._id);
      }
    })

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
      console.log("finished upload", files);
      // this.setState({
      //   files: []
      //   , submitting: false
      //   , printFile: false
      //   , printFilename: ''
      //   , progressPercent: []
      //   , uploadedFileIds: []
      // });
      setTimeout(() => {
        this.setState({
          files: []
          , submitting: false
          , printFile: false
          , printFilename: ''
          , progressPercent: []
          , uploadedFileIds: files.map(file => file._id)
        }, () => {
          console.log("this.state", this.state);
        });
        files.map(file => this.props.dispatch(fileActions.addSingleFileToMap(file)))
      }, 500);
    })
  }

  componentDidMount() {
    const { dispatch, history, loggedInUser, selectedStaff, selectedStaffId, socket, selectedFirm } = this.props;
    console.log("this.props", this.props)
    if(socket && socket.disconnected) {
      socket.open();
    } else if(socket && socket.connected && loggedInUser && loggedInUser._id) {
      socket.emit('subscribe', loggedInUser._id);
    }
    // Fetch staff using the stored selectedStaffId so we can make sure it matches the logged in user.
    dispatch(staffActions.fetchSingleIfNeeded(selectedStaffId)).then(staffRes => {
      const staff = staffRes.item;
      console.log("Staff res", staff);
      if(!staff || staff._user != loggedInUser._id) {
        // NOTE: we have a missing or stale staff id in localStorage.
        localStorage.clear(); // clear the account selection
        history.replace('/'); // foward back to select an account.
      } else {
        dispatch(fileActions.fetchListIfNeeded('~firm', staff._firm, 'category', "folder")).then(folderRes => {
          console.log("folderRes", folderRes);

          if(folderRes && folderRes.list && folderRes.list.length > 0) {
            this.setState({folders: folderRes.list});
          }
        })
      }

    });

    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
    dispatch(staffActions.fetchListIfNeeded('_user', loggedInUser._id));
    if(selectedStaff) {
      dispatch(clientActions.fetchListIfNeeded('_firm', selectedStaff._firm));
      dispatch(staffClientActions.fetchListIfNeeded('_firm', selectedStaff._firm, '_user', loggedInUser._id, '~staff.status', 'active'));
      dispatch(userActions.fetchListIfNeeded('_firm', selectedStaff._firm));
    }

    // if(selectedStaffId) {
      
    //   console.log("selectedFirm is defined", selectedFirm)
    //   dispatch(fileActions.fetchListIfNeeded('~firm', selectedFirm._id, 'category', "folder"), (result) => {
    //     console.log("result", result);
    //   });
    // }

    

    window.addEventListener('print-file-status', this._handlePrintFileStatus);

    const event = new Event('print-file-ready');
    window.dispatchEvent(event);
  }

  componentDidUpdate(prevProps) {
    const { dispatch, loggedInUser, selectedStaff } = this.props;
    if(selectedStaff && (!prevProps.selectedStaff || !prevProps.selectedStaff._id || prevProps.selectedStaff._id != selectedStaff._id)) {
      dispatch(clientActions.fetchListIfNeeded('_firm', selectedStaff._firm));
      dispatch(staffClientActions.fetchListIfNeeded('_firm', selectedStaff._firm, '_user', loggedInUser._id, '~staff.status', 'active'));
      dispatch(userActions.fetchListIfNeeded('_firm', selectedStaff._firm));
    }
  }

  _handleFolderChange(e) {
    const val = e.target.value ? e.target.value.toString() : "";
    this.setState({selectedFolder: val});
  }

  _uploadMore() {
    this.setState({
      clientId: null
      , uploadedFileIds: []
    })
  }

  _goToShareFiles() {
    const { clientId, uploadedFileIds } = this.state

    console.log('uploadedFileIds', uploadedFileIds);

    this.props.history.push({
      pathname: '/share',
      state: { clientId, uploadedFileIds },
    });
  }

  _goToRequestSignature() {
    const { clientId, uploadedFileIds } = this.state
    this.props.history.push({
      pathname: '/signature',
      state: { clientId, uploadedFileIds },
    });
  }

  componentWillUnmount() {
    const { socket } = this.props;
    // Remove the socket event listeners defined in the constructor since they will be attached next time this component mounts.
    socket.off('disconnect')
    socket.off('connect')
    socket.off('upload_progress')
    socket.off('upload_progress_error')
    socket.off('upload_finished')
    window.removeEventListener('print-file-status', this._handlePrintFileStatus);
  }

  _handlePrintFileStatus(e) {
    // NOTE: This is where printFile gets set to true.
    this.setState({
      ...e.detail
    });
  }

  _handleFilesChange(files) {
    this.setState({
      files,
    });
  }


  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    const newState = _.cloneDeep(this.state);
    if(e.target.name == 'clientId') {
      const val = e.target.value ? e.target.value.toString() : "";
      newState._personal = val.includes("personal") ? val : null;
      newState.clientId = val.includes("personal") ? null : val;
    } else {
      newState[e.target.name] = e.target.value;
    }

    console.log("newState", newState);
    // const newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
    //   return e.target.value;
    // });
    this.setState(newState);
  }

  _handleFormSubmit() {
    const { dispatch, selectedFirm } = this.props;
    const { clientId, status, _personal, selectedFolder } = this.state;

    let { files } = this.state;
    files = files.filter(file => !file.virusDetected && !file.fileNotFound);

    if(files.length > 0) {

      this.setState({
        preparing: true
        , files
      });

      const formData = new FormData();

      Object.keys(files).forEach((key) => {
        const file = files[key];
        formData.append(
          key,
          new Blob([file], { type: file.type }),
          file.name || 'file'
        );
      });

      formData.append('_firm', selectedFirm._id);

      if (clientId) {
        formData.append('_client', clientId);
      }

      if (_personal) {
        formData.append('_personal', _personal.replace("personal", ""));
      }

      if(selectedFolder) {
        formData.append('_folder', selectedFolder);
      }

      formData.append('status', status);

      dispatch(fileActions.sendCreateFiles(formData)).then(result => {
        if(result.success) {
          this.setState({
            submitting: true
            , preparing: false
          })
        } else {
          this.setState({
            preparing: false
            , submitted: false
          })
          alert("ERROR: " + result.error)
          // alert("ERROR - Check logs");
        }
      });
    }
  }

  _handleFormPrint() {
    const { selectedFirm } = this.props;
    const { clientId, printFilename, status } = this.state;

    this.setState({
      submitting: true,
      progressPercent: []
    });

    let options = {
      detail: {
        filename: `${printFilename}.pdf`,
        firmId: selectedFirm._id,
        status
      }
    };

    if (clientId) {
      options.detail.clientId = clientId;
    }

    const event = new CustomEvent('print-file-upload', options);
    window.dispatchEvent(event);
  }

  render() {
    const {
      errorMessage
      , files
      , preparing
      , progressError
      , progressPercent
      , submitting
      , printFile
      , printFilename
      , folders
    } = this.state;

    console.log("trigger render");

    const { loggedInUser, selectedFirm, selectedStaff, workspaceList } = this.props;
    const domain = selectedFirm && selectedFirm.domain ? selectedFirm.domain : 'app.' + brandingName.host;

    if(preparing) {
      return (
        <span><i className="fas fa-spinner fa-spin"/>{` Preparing file(s)...`}</span>
      )
    }
    
    if(submitting && printFile) {
      return (<div key={printFilename} style={{ padding: '1em' }}>
        <p><small><strong>{printFilename}</strong></small>{` - ${progressPercent[0] || 0}%`}</p>
        <div className={`progress-bar-${progressPercent[0] || 0}`} >
          <div className="-progress">
            <div className="-complete">
            </div>
          </div>
        </div>
      </div>)
    } else if(submitting) {
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

    const btnFileValid = !files.some(f => !f.virusDetected && !f.fileNotFound);

    let filterFolders = [];

    if(this.state.clientId) {
      filterFolders = folders.filter((folder) => {
        return folder._client == this.state.clientId
      })
    } else {
      if(this.state._personal) {
        filterFolders = folders.filter((folder) => {
          return !folder._client && folder._personal == this.props.selectedStaffId;
        });
      } else {
        filterFolders = folders.filter((folder) => {
          return !folder._client && !folder._personal;
        });
      }
    }
    
    return (
      <div>
        <div className="yt-row center-vert space-between">
          <h4>Hello, {loggedInUser.firstname}</h4>
          <Link to="/settings" >
            <i className="fal fa-cog" />
          </Link>
        </div>
        <h2>Secure Print </h2>
        <hr />
        <br />
        {errorMessage && (
          <div className="input-group">
            <div className="-error-message">{errorMessage}</div>
          </div>
        )}
        {this.state.uploadedFileIds.length > 0 ?
          <div>
            <p>Files uploaded to
              {this.state.clientId ?
                <span> the {this.props.clientStore.byId[this.state.clientId].name} workspace</span>
                :
                <span> the general files directory</span>
              }
            </p>
            <div className="-desktop-action-btns">
              {this.state.clientId ?
                <a className="-btn" href={`https://${domain}/firm/${selectedFirm._id}/workspaces/${this.state.clientId}/files`} target="_blank">
                  <div className="-icon">
                    <i className="fad fa-cabinet-filing " />
                  </div>
                  <div className="-text">
                    View in portal
                  </div>
                </a>
                :
                <a className="-btn" href={`https://${domain}/firm/${selectedFirm._id}/files`} target="_blank">
                  <div className="-icon">
                    <i className="fad fa-cabinet-filing " />
                  </div>
                  <div className="-text">
                    View in portal
                  </div>
                </a>
              }
              <div className="-btn" onClick={this._uploadMore}>
                <div className="-icon">
                  <i className="fad fa-cloud-upload " />
                </div>
                <div className="-text">
                  Upload more files
                </div>
              </div>
              <div className="-btn" onClick={this._goToShareFiles}>
                <div className="-icon">
                  <i className="fad fa-paper-plane " />
                </div>
                <div className="-text">
                  Share files
                </div>
              </div>
              { selectedFirm && selectedFirm.eSigAccess && selectedStaff && selectedStaff.eSigAccess ? 
                <div className="-btn" onClick={this._goToRequestSignature}>
                  <div className="-icon">
                    <i className="fad fa-file-signature " />
                  </div>
                  <div className="-text">
                    Request signature
                  </div>
                </div>
                :
                <div className="-btn -disabled" >
                  <div className="-icon">
                    <i className="fad fa-file-signature " />
                  </div>
                  <div className="-text">
                    Request signature | <i className="fas fa-lock" />
                  </div>
                </div>
              }
            </div>

          </div>
          :
          <div>
            {printFile ? (
              <div>
                <TextInput
                  name="printFilename"
                  label="File name"
                  change={this._handleFormChange}
                  helpText="This will always upload as a .pdf"
                  suffix=".pdf"
                  value={printFilename}
                  required
                />
                {workspaceList && workspaceList.length > 0 ?
                  <SelectFromObject
                    change={this._handleFormChange}
                    isClearable={true}
                    display="name"
                    displayStartCase={false}
                    filterable={true}
                    items={workspaceList}
                    label="Select a workspace"
                    name="clientId"
                    placeholder="Upload to general files"
                    selected={this.state.clientId || this.state._personal}
                    value="_id"
                  />
                  :
                  <p><em>You do not have any workspaces available. Files will upload to General Files.</em></p>
                }
                {this.state.clientId ?
                  <RadioInput
                    label="Should this file be visible to the client or hidden?"
                    options={[
                      { val: 'visible', display: 'Visible to client' },
                      { val: 'hidden', display: 'Hidden from client' },
                    ]}
                    name="status"
                    value={this.state.status}
                    change={this._handleFormChange}
                    inLine={true}
                  />
                  :
                  null
                }
                <div className="yt-container">
                  <div className="yt-row space-between">
                    <div></div>
                    <button
                      type="button"
                      className="yt-btn info small"
                      onClick={this._handleFormPrint}
                      disabled={submitting || !printFilename}
                    >
                      Upload
                    </button>
                  </div>
                </div>
              </div>
            ) : (
                <div>
                  <FileInput
                    change={this._handleFilesChange}
                    multiple
                    required
                    dispatch={this.props.dispatch}
                  />
                  {workspaceList && workspaceList.length > 0 ?
                    <SelectFromObject
                      change={this._handleFormChange}
                      isClearable={true}
                      display="name"
                      displayStartCase={false}
                      filterable={true}
                      items={workspaceList}
                      label="Select a workspace"
                      name="clientId"
                      placeholder="Upload to general files"
                      selected={this.state.clientId || this.state._personal}
                      value="_id"
                    />
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
                      label="Should this file be visible to the client or hidden?"
                      options={[
                        { val: 'visible', display: 'Visible to client' },
                        { val: 'hidden', display: 'Hidden from client' },
                      ]}
                      name="status"
                      value={this.state.status}
                      change={this._handleFormChange}
                      inLine={true}
                    />
                    :
                    null
                  }
                  <div className="yt-container">
                    <div className="yt-row space-between">
                      <div></div>
                      <button
                        type="button"
                        className="yt-btn info small"
                        onClick={this._handleFormSubmit}
                        disabled={submitting || !files || files.length < 1 || btnFileValid}
                      >
                        Upload
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>
        }
      </div>
    );
  }
}

DesktopUploadFiles.propTypes = {
  dispatch: PropTypes.func.isRequired
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
  
  const staffClientListItems = selectedStaff && selectedStaff._firm ? staffClientStore.util.getList('_firm', selectedStaff._firm, '_user', loggedInUser._id, '~staff.status', 'active') : [];
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

  console.log('isStaffOwner', isStaffOwner);
  console.log('workspaceList1', workspaceList);

  workspaceList = workspaceList.length > 0 ? workspaceList.filter(client => client && client.status && client.status === "visible") : [];
  workspaceList.sort((a, b) => {
    if(a.name.toLowerCase() < b.name.toLowerCase()) {
      return -1
    } else {
      return 1
    }
  });

  if(selectedFirm && workspaceList && loggedInUser) {
    workspaceList.unshift({
      _id: `personal${loggedInUser._id}`
      , name: "Personal Files"
      , _firm: selectedFirm._id
      , _staff: loggedInUser._id
      , status: 'visible'
    });
  }

  console.log('workspaceList', workspaceList);

  return {
    clientStore: store.client
    , loggedInUser
    , selectedFirm
    , selectedStaff
    , socket: store.user.socket
    , workspaceList
    , firmStore
  }
};

export default withRouter(connect(mapStoreToProps)(DesktopUploadFiles));
