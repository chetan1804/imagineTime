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
import * as folderPermissionActions from '../../folderPermission/folderPermissionActions';

import { validationUtils } from "../../../global/utils";

// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from '../../../global/components/modals/Modal.js.jsx';
import { FileInput, CheckboxInput, SelectFromArray, TextInput } from '../../../global/components/forms';

// import file components

class CreateFolderModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      submitting: false
      , folderName: ""
      , isFolderNameValid: true
    }
    this._bind(
      '_handleClose'
      , '_handleFormSubmit'
      , '_handleFormChange'
    );
  }

  componentDidMount() {
    console.log("load CreateFolderModal");
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);

    if(e.target.name === "folderName") {
      if(!validationUtils.checkFilenameIsValid(e.target.value)) {
        this.setState({ isFolderNameValid: false });
      } else {
        this.setState({ isFolderNameValid: true });
      }
    }
  }

  _handleFormSubmit() {
    // e.preventDefault();
    const { 
      dispatch, 
      location,
      history, 
      match, 
      loggedInUser, 
      close, 
      handleUploaded, 
      viewingAs, 
      selectedFirm, 
      client,
      firm,
      folderListItems } = this.props;
    const { folderName } = this.state;

    if (folderName && folderName.trim()) {
      // e.preventDefault();
      this.setState({ submitting: true });

      let mangoSubFolder = folderListItems.filter(folder => folder._id == match.params.folderId);

      mangoSubFolder = mangoSubFolder.length > 0 ? mangoSubFolder[0] : null;

      let rootFolder;

      if(match.params.fileId) {
        const urls = location.state.breadcrumbs;
        const rootFolderPath = urls.length >= 3 ? urls[2].path.split('/') : [];
        const rootFolderId = rootFolderPath.length >= 2 ? rootFolderPath[rootFolderPath.length - 2] : null;
        rootFolder = folderListItems.filter(folder => folder._id == rootFolderId);
        rootFolder = rootFolder.length > 0 ? rootFolder[0] : null;
      }

      const sendData = {
        _user: loggedInUser._id
        , _client: match.params.clientId
        , _folder: match.params.folderId
        , _firm: match.params.firmId
        , category: "folder"
        , filename: folderName
        , status: "visible"
        , wasAccessed: false
        , mangoClientID: client && client.mangoClientID ? client.mangoClientID : null
        , mangoCompanyID: client && client.mangoCompanyID ? client.mangoCompanyID : null 
        , ParentID: mangoSubFolder && mangoSubFolder.DMSParentID ? mangoSubFolder.DMSParentID : null
        , YellowParentID: rootFolder && rootFolder.DMSParentID ? rootFolder.DMSParentID : null
      }

      if (sendData && match.params.userId) {
        sendData["_personal"] = match.params.userId;
      }

      if (viewingAs === "portal") {
        sendData["portal"] = true;
        sendData["_firm"] = firm._id;
      }

      dispatch(fileActions.sendCreateFolder(sendData)).then(folderRes => {
        if (folderRes.success) {
          console.log('successfully created a folder');

          if (this.props.handleSetInvalidList) {
            console.log('update folder list');
            this.props.handleSetInvalidList();
          }

          this.setState({
            submitting: false
          }, () => {
            this._handleClose()
          });

          //add folder permission
          // let permissionBody = firm.permission;

          // permissionBody['_firm'] = match.params.firmId ? match.params.firmId : firm._id;
          // permissionBody['_client'] = match.params.clientId;
          // permissionBody['_folder'] = folderRes.files[0]._id;

          //delete permissionBody['_id'];

          // dispatch(folderPermissionActions.sendCreateFolderPermission(permissionBody)).then(permissionRes => {
          //   console.log('permissionRes', permissionRes);
          //   this.setState({
          //     submitting: false
          //   }, () => {
          //     this._handleClose()
          //   });
          // })

        } else {
          alert("ERROR - Check logs");
          this.setState({ submitting: false });
        }
      });
    }
  }

  _handleClose() {
    const { close } = this.props;
    this.setState({
      submitting: false
      , folderName: ""
    }, () => {
      if(close) {
        close()
      }
    });
  }

  render() {
    const { isOpen, multiple, showStatusOptions, client } = this.props;
    const { submitting, folderName, isFolderNameValid } = this.state;
    // const btnDisabled = name ? false : true;  // !files.some(f => !f.virusDetected && !f.fileNotFound);
    const folderNameErrorMessage = `A folder name can't contain any of the following characters: \ / : * ? " < > |`;
    console.log('client', client);
    return (
      <Modal
        closeAction={this._handleClose}
        closeText="Cancel"
        confirmAction={this._handleFormSubmit}
        confirmText={submitting ? "Saving..." : "Save" }
        disableConfirm={submitting || !isFolderNameValid || !(folderName && folderName.trim())}
        isOpen={isOpen}
        modalHeader="Create Folder"
      >
        <div>
          <div className="-share-link-configuration">
              <div className="-body">
                  <div className="-setting yt-row space-between">
                    <TextInput
                      change={this._handleFormChange}
                      label="Folder Name"
                      name="folderName"
                      placeholder="Folder Name"
                      value={folderName}
                      required={false}
                      autoFocus={true}
                      onSubmit={this._handleFormSubmit}
                    />
                  </div>
                  {
                    !isFolderNameValid ? <p className="-error-color-folderName">{folderNameErrorMessage}</p> : ""
                  }
              </div>
          </div>
        </div>
      </Modal>
    )
  }
}

CreateFolderModal.propTypes = {
  close: PropTypes.func.isRequired
  , dispatch: PropTypes.func.isRequired
  , filePointers: PropTypes.object 
  , handleUploaded: PropTypes.func.isRequired
  , isOpen: PropTypes.bool.isRequired
  , multiple: PropTypes.bool
  , showStatusOptions: PropTypes.bool 
  , client: PropTypes.object
  , folderListItems: PropTypes.array
}

CreateFolderModal.defaultProps = {
  filePointers: {}
  , multiple: true
  , showStatusOptions: false
  , client: null
  , folderListItems: []
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    loggedInUser: store.user.loggedIn.user
    , socket: store.user.socket
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(CreateFolderModal)
);