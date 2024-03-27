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
import Select from 'react-select'; 

// import third-party libraries
import _ from 'lodash';
const async = require('async');

// import actions
import * as fileActions from '../fileActions';

import permissions from '../../../global/utils/permissions';
import sortUtils from '../../../global/utils/sortUtils';
import routeUtils from '../../../global/utils/routeUtils';

// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from '../../../global/components/modals/Modal.js.jsx';
import { FileInput, CheckboxInput, SelectFromArray, TextInput } from '../../../global/components/forms';

// import file components
import FileLocation from './FileLocation.js.jsx';

class FileMoveModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      submitting: false
      , name: ""
      , listArgs: props.match.params.firmId ? {
          '~firm': props.match.params.firmId
          , _client: props.match.params.clientId || 'null'
          , status: 'folder-only'
        } : {
          '~client': props.match.params.clientId
          , status: 'portal-view'
        }
      , selectedFolder: { 
        _client: props.match.params.clientId ? props.match.params.clientId : null
        , _personal: props.match.params.userId ? props.match.params.userId : "" 
        , _id: props.match.params.folderId ? props.match.params.folderId : ""
      }
    }
    this._bind(
        '_handleSubmit'
        , '_handleLocationChange'
        , '_handleSelectedChange'
    );
  }

  componentDidMount() {
    console.log("load FileMoveModal");
  }

  _handleSubmit() {
    const { dispatch, selectedFileIds, close, match, selectedClient, viewingAs } = this.props; 
    const selectedFolder = _.cloneDeep(this.state.selectedFolder);

    this.setState({ submitting: true });

    const sendData = {
      filesId: selectedFileIds
      , clientId: selectedFolder._client
      , _personal: selectedFolder._personal
      , _folder: selectedFolder._id
      , action: "move"
      , firmId:match.params.firmId || selectedClient && selectedClient._firm
      , viewingAs
    }
     
    // const { dispatch, file, fileListArgs } = this.props; 
    dispatch(fileActions.sendUBulkupdateFiles(sendData)).then(json => {
        this.setState({
            submitting: false
        }, () => {
          close()
          if (this.props.handleUpdateList) {
            this.props.handleUpdateList();        
          }
        })
    });
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(fileActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(this.state.listArgs)))
  }

  _handleLocationChange(folder) {
    folder._id = folder._id === "rootfolder" ? null : folder._id;
    this.setState({ selectedFolder: folder });
  }

  _handleSelectedChange(e) {
    const { dispatch, match } = this.props;
    const val = e.value.toString();
    const selectedFolder = {
      _id: "rootfolder"
      , filename: "Root Folder"
    };
    
    let userId = null;
    let type;
    if (val.includes("personal")) {
      userId = val.replace("personal", "");
      selectedFolder["_client"] = null;
      selectedFolder["_personal"] = userId;
      selectedFolder["_id"] = "";
    } else if (val === "public") {
      selectedFolder["_client"] = "";
      selectedFolder["_personal"] = "";
      selectedFolder["_id"] = "";
    } else {
      type = "client";
      selectedFolder["_client"] = val;
      selectedFolder["_personal"] = "";
      selectedFolder["_id"] = "";
    }
    this.setState({ selectedFolder });
  }

  render() {
    const {
        isOpen
        , close
        // , folderListItems
        , selectedFileIds
        , clientListItem
        , options
        , fileStore
        , viewingAs
        , selectedClient
        , match
    } = this.props;

    const {
        submitting
        , selectedFolder
    } = this.state;
  
    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);
    let selectedStaffId = selectedFolder && selectedFolder._personal ? `personal${selectedFolder._personal}` : "";
    let clientId = selectedFolder && selectedFolder._client ? selectedFolder._client : "";

    const newGetDetail = this.props.getDetail;
    if (viewingAs != "portal") {
      if (clientId) {
        newGetDetail.type = "workspace";
        newGetDetail.id = clientId;
      } else if (selectedStaffId) {
        newGetDetail.type = "personal";
        newGetDetail.id = selectedStaffId;
      } else {
        newGetDetail.type = "general";
        newGetDetail.id = null;
        newGetDetail.firmId = match.params.firmId; 
      }
    }
    return (
        <Modal
            cardSize='standard'
            closeAction={close}
            isOpen={isOpen}
            modalHeader='Move files new client'
            showButtons={true}
            confirmAction={this._handleSubmit}
            confirmText={submitting ? 'Submitting' : 'Save'}
            disableConfirm={submitting}
        >
            <div className="-container-upload-location">
              {
                viewingAs === "portal" ? null :
                <div style={{ margin: "16px 0" }}>
                  <Select 
                    options={options || []}
                    onChange={this._handleSelectedChange}
                    value={options.length ? options.find(o => o.value == (clientId ? clientId : selectedStaffId ? selectedStaffId : "public")) : null}
                  />
                </div>
              }
              <FileLocation
                folderListItems={[]}
                handleLocationChange={this._handleLocationChange}
                selectedClient={clientListItem ? clientListItem.filter(client => client._id == clientId)[0] : !match.params.firmId ? selectedClient : []}
                selectedFileIds={selectedFileIds}
                viewingAs={viewingAs}
                allowCreateFolder={false}
                listArgs={listArgs}
                action="move"
                getDetail={newGetDetail}
                selectedFolder={selectedFolder}
              />
            </div>
        </Modal>
    )
  }
}

FileMoveModal.propTypes = {
  close: PropTypes.func.isRequired
  , dispatch: PropTypes.func.isRequired
  , filePointers: PropTypes.object 
  , handleUploaded: PropTypes.func.isRequired
  , isOpen: PropTypes.bool.isRequired
  , multiple: PropTypes.bool
  , showStatusOptions: PropTypes.bool 
  , client: PropTypes.object
}

FileMoveModal.defaultProps = {
  filePointers: {}
  , multiple: true
  , showStatusOptions: false
  , client: null
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    loggedInUser: store.user.loggedIn.user
    , socket: store.user.socket
    , staffStore: store.staff
    , clientStore: store.client
    , userMap: store.user.byId
    , fileStore: store.file
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(FileMoveModal)
);
