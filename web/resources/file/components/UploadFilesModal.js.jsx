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
import { FileInput, CheckboxInput, SelectFromArray } from '../../../global/components/forms';
import apiUtils from '../../../global/utils/api';

// import file components
import FileLocation from './FileLocation.js.jsx';

class UploadFilesModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      awaitingFiles: false
      , files: []
      , preparing: false
      , submitting: false
      , status: props.filePointers.status ? props.filePointers.status : 'visible'
      , progressError: []
      , progressPercent: []
      , match: props.match
      , folders: []
      , folderList: []
      , uuid: props.uuid ? props.uuid : ''
      , selectedFolder: {
        _client:  props.match.params.clientId ? props.match.params.clientId : null
        , _personal: props.match.params.userId ? props.match.params.userId : "" 
        , _id: props.match.params.folderId ? props.match.params.folderId : ""
      }
    }
    this._bind(
      '_handleClose'
      , '_handleFormSubmit'
      , '_handleFilesChange'
      , '_handleStatusChange'
      , '_handleLocationChange'
    );

  }

  componentDidMount() {
    const { socket, dispatch, match, fileStore } = this.props;

    socket.on('upload_progress', (progress, index) => {
      if(this.state.awaitingFiles) {
        let newProgress = _.update(_.cloneDeep(this.state.progressPercent), index, () => {
          return progress;
        });
        this.setState({progressPercent: newProgress});
      }
    });

    // Used to display an error on a single file upload.
    socket.on('upload_progress_error', (error, index) => {
      // console.log('Upload progress error', error);
      
      let newProgressError = _.update(_.cloneDeep(this.state.progressError), index, () => {
        return error;
      });
      this.setState({progressError: newProgressError});
    })

    socket.on('upload_finished', (files) => {
      console.log("upload_finished", files);
      // console.log("UPLOAD FINISHED!!!", files);
      // If there are any errors display the individual file status here.
      if(this.state.progressError.length > 0) {
        let alertString = 'There was a problem uploading your files.\n'
        this.state.files.forEach((file, i) => {
          alertString += `${file.name} - ${this.state.progressError[i] || 'Successfully uploaded'}\n`
        })
        alert(alertString)
      }

      if (this.props.handleSetInvalidList) {
        this.props.handleSetInvalidList();
      }

      setTimeout(() => {
        this._handleClose();
      }, 500);
    });

    // Used to display an overall file upload error.
    socket.on('upload_finished_error', (error) => {
      console.log("UPLOAD FINISHED ERROR!!!", error);
      alert("There was a problem uploading your files. " + error)
      this._handleClose();
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.match.params.folderId && prevProps.match.params.folderId != prevState.match.params.folderId) {
      const selectedFolder = _.cloneDeep(this.state.selectedFolder);
      selectedFolder._id = prevProps.match.params.folderId;
      selectedFolder._personal = prevProps.match.params.userId;
      selectedFolder._client = prevProps.match.params.clientId;
      this.setState({ selectedFolder, match: prevProps.match });
    }
  }

  componentWillUnmount() {
    const { socket, match } = this.props;
    // Remove the event listeners defined in the constructor since they will be attached every time the modal is opened.
    socket.off('upload_progress')
    // socket.off('upload_finished')
    socket.off('upload_progress_error')
    socket.off('upload_finished_error')
  }

  _handleFilesChange(files, folders) {
    console.log('-------- files -----');
    console.log(files);
    console.log(folders);
    this.setState({files, folders});
  }

  _handleStatusChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleFormSubmit(e) {

    const { match, selectedClient, location, folderListItems, viewingAs, filePointers, firm, uuid } = this.props;

    console.log('this.props', this.props)
    if(e) {
      e.preventDefault();
    }
    this.setState({preparing: true});
    
    // convert to a FormData objet to allow uploading file=
    let { files, status, folders, folderList } = this.state;
    files = files.filter(file => !file.virusDetected && !file.fileNotFound);

    if(!files.length && !folders.length) {
      alert("No files present");
    } else {

      const selectedFolder = _.cloneDeep(this.state.selectedFolder);

      // save new files list;
      this.setState({ files });

      const _folder = selectedFolder._id || "";
      const _personal = selectedFolder._personal ? isNaN(selectedFolder._personal) ? "" : selectedFolder._personal : "";

      // let mangoSubFolder = this.folderList.filter(folder => folder._id == match.params.fileId);
      // mangoSubFolder = mangoSubFolder.length > 0 ? mangoSubFolder[0] : null;

      let mangoSubFolder;
      let rootFolder;

      if(match.params.folderId) {

        // const urls = location.state.breadcrumbs;
        // const rootFolderPath = urls.length >= 3 ? urls[2].path.split('/') : [];
        // const rootFolderId = rootFolderPath.length >= 2 ? rootFolderPath[rootFolderPath.length - 2] : null;
        // rootFolder = this.folderList.filter(folder => folder._id == rootFolderId);

        const urls = location.state.breadcrumbs;
        let rootFolderId = null;
        if (viewingAs === "portal") {
          const rootFolderPath = urls.length >= 2 ? urls[1].path.split('/') : [];
          rootFolderId = rootFolderPath.length >= 1 ? rootFolderPath[rootFolderPath.length - 1] : null;
        } else {
          const rootFolderPath = urls.length >= 3 ? urls[2].path.split('/') : [];
          rootFolderId = rootFolderPath.length >= 2 ? rootFolderPath[rootFolderPath.length - 2] : null;
        }

        mangoSubFolder = match.params.folderId

        rootFolder = rootFolderId;
      }

      const params = {
        status : firm && firm.default_file_status !== '' ? firm.default_file_status : status
        , _folder
        , _personal
        , viewingAs: viewingAs === "default" ? "workspace" : viewingAs
        // , ParentID: mangoSubFolder && mangoSubFolder.DMSParentID ? mangoSubFolder.DMSParentID : null
        // , YellowParentID: rootFolder && rootFolder.DMSParentID ? rootFolder.DMSParentID : null
        , ParentID: mangoSubFolder ? mangoSubFolder : null
        , YellowParentID: rootFolder ? rootFolder : null
        , client: selectedClient
        , ...filePointers
        , uuid: !!uuid ? uuid : ''
      }

      console.log('file params', params);

      apiUtils.upload(this.props, files, folders, params, result => {
        if(result.success) {
          this.setState({
            awaitingFiles: true
            , submitting: true  
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

  _handleClose() {
    const { close, match } = this.props;
    this.setState({
      awaitingFiles: false
      , files: []
      , preparing: false
      , submitting: false
      , progressError: []
      , progressPercent: []
      , selectedFolder: { 
        _client: match.params.clientId ? match.params.clientId : null
        , _personal: match.params.userId ? match.params.userId : "" 
        , _id: match.params.folderId ? match.params.folderId : ""
      }
    }, () => {
      if(close) {
        close()
      }
    });
  }

  _handleLocationChange(folder) {
    this.setState({ selectedFolder: folder });
  }

  render() {

    const { 
      isOpen
      , multiple
      , showStatusOptions
      , folderListItems
      , selectedClient
      , viewingAs
      , firm
    } = this.props;
    
    const { files, preparing, progressError, progressPercent, submitting, selectedFolder } = this.state;
    // const btnFileValid = !files.some(f => !f.virusDetected && !f.fileNotFound);

    return (
      <Modal
        closeAction={this._handleClose}
        closeText="Cancel"
        confirmAction={files.length > 0 ? this._handleFormSubmit : null}
        confirmText={submitting ? "Uploading..." : "Upload & save" }
        disableConfirm={submitting || !files || files.length < 1 || preparing}
        isOpen={isOpen}
        modalHeader="Upload files"
      >
        { preparing ?
          <span><i className="fas fa-spinner fa-spin"/>{` Preparing file${files.length > 1 ? 's...' : '...'}`}</span>
          :
          !submitting ?
          <FileInput
            change={this._handleFilesChange}
            label="Select Files"
            multiple={multiple}
            required={true}
            dispatch={this.props.dispatch}
          />
          :
          files.map((file, i) => 
            file && file._folder ? null
            :
            <div key={file.name + "_" + i} style={{padding: '1em'}}>
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
        <div className="-container-upload-location">
          { showStatusOptions && firm && firm.default_file_status === '' ? 
              <SelectFromArray
                items={[
                  'hidden'
                  , 'visible'
                ]}
                change={this._handleStatusChange}
                label="Visibility to client"
                name="status"
                value={this.state.status}
              />
            : ''
          }
          {
            // fromFiles ? null :
            viewingAs === "default" || preparing || submitting ? null :
            <FileLocation 
              selectedClient={selectedClient}
              handleLocationChange={this._handleLocationChange}
              folderListItems={folderListItems}
              listArgs={this.props.listArgs}
              allowCreateFolder={(firm.allowCreateFolder && viewingAs === "portal") || (viewingAs !== "portal")}
              handleSetInvalidList={this.props.handleSetInvalidList}
              getDetail={this.props.getDetail}
              viewingModal="uploadFiles"
              viewingAs={viewingAs}
            />
          }
        </div>
      </Modal>
    )
  }
}

UploadFilesModal.propTypes = {
  close: PropTypes.func.isRequired
  , dispatch: PropTypes.func.isRequired
  , filePointers: PropTypes.object 
  , handleUploaded: PropTypes.func.isRequired
  , isOpen: PropTypes.bool.isRequired
  , multiple: PropTypes.bool
  , showStatusOptions: PropTypes.bool 
  , folderListItems: PropTypes.array
  , uuid: PropTypes.string
}

UploadFilesModal.defaultProps = {
  filePointers: {}
  , multiple: true
  , showStatusOptions: false
  , folderListItems: [] 
  , uuid: ''
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    loggedInUser: store.user.loggedIn.user
    , socket: store.user.socket
    , fileStore: store.file
    , firm: store.firm.selected.getItem()
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(UploadFilesModal)
);
