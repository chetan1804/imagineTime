import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

import _ from 'lodash';

import * as constants from '../../../config/constants.js';

import Binder from "../../../global/components/Binder.js.jsx";
import Modal from "../../../global/components/modals/Modal.js.jsx";
import FolderPermissionTable from './folderPermissionTable.js.jsx';

import routeUtils from '../../../global/utils/routeUtils.js';
import * as fileActions from '../../file/fileActions';
import * as folderTemplateActions from '../../folderTemplate/folderTemplateActions';

import { FeedbackMessage } from "../../../global/components/helpers/FeedbackMessage.js.jsx";


class FolderPermissionModal extends Binder {

  feedbackMessage = React.createRef();

  constructor(props) {
    super(props);
    this.state = {
      submitting: false
      , selectedClient: {}
      , selectedPermission: {}
      , selectedFile: {}
      , loading: false
      , payload: {}
      , selectedFolderTemplate: {}
    }
    this._bind(
      '_handleSubmit'
      , '_handleChange'
      , '_handleCreateUpdateFolderTemplate'
    );
  }

  componentDidMount() { }

  _handleChange(newPayload) {
    this.setState({
      payload: newPayload
    })
  }

  
  _handleCreateUpdateFolderTemplate(folderTemplate = {}) {

    console.log('call update folder template', folderTemplate);

    const { 
      dispatch
      , firm
      , handleUpdateTemplatePermission
      , match
    } = this.props;

    let subfolder = !!folderTemplate.subfolder ? folderTemplate.subfolder : [];
    const newFolderTemplate = _.clone(folderTemplate);

    newFolderTemplate.subfolder = subfolder.filter(item => item.status !== "initial_deleted");

    if(folderTemplate._id == "root") {
      //call create folder template
      if(!folderTemplate.hasOwnProperty('adminRead')) {
        FOLDER_PERMISSION_FIELDS.map(key => {
          folderTemplate[key] = !!firm.permission[key];
        })
      }
      handleUpdateTemplatePermission(folderTemplate);
      this.feedbackMessage.current.showSuccess('Successfully updated')

    } else {
      //update folder template
      dispatch(folderTemplateActions.sendUpdateFolderTemplate(newFolderTemplate)).then(response => {
        console.log('update folder template', response);
        if (response.success) {
            dispatch(folderTemplateActions.addFolderTemplateToList(response.item, ...['_firm', match.params.firmId]));
            this.feedbackMessage.current.showSuccess('Successfully updated')
            this._handleClose();
        } else {
            alert("ERROR - Check logs");
            this.setState({ submitting: false });
            this.feedbackMessage.current.showError('Failed to update folder permission')
        }

      });
    }
  }

  _handleSubmit() {

    const { 
      payload 
      , selectedFolderTemplate
    } = this.state;

    const {
      dispatch
      , file
      , firm
      , isFolderTemplate = false
      , subFolderListItems
      , folderTemplate
    } = this.props;

    let newPayload = payload;

    let selectedFolder = file;

    // delete newPayload.adminFullAccess;
    // delete newPayload.ownerFullAccess;
    // delete newPayload.staffFullAccess;
    // delete newPayload.contactFullAccess;

    console.log('props folderTemplate', folderTemplate);
    console.log('permission payload', payload);


    if(!!isFolderTemplate) {
      const FOLDER_PERMISSION_FIELDS = constants.FOLDER_PERMISSION_FIELDS
      if(selectedFolder._createdBy || selectedFolder._id == "root") {
        console.log('this is a root folder');
        FOLDER_PERMISSION_FIELDS.map(key => {
          selectedFolder[key] = !!payload[key];
        })

        console.log('selectedFolder template', selectedFolder);
        //call create update folder template
        this._handleCreateUpdateFolderTemplate(selectedFolder);
      } else {
        let subFolderItems = _.cloneDeep(subFolderListItems);
        const index = _.findIndex(subFolderItems, { _id: selectedFolder._id });

        console.log('selected index', index);

        if(subFolderItems[index] && subFolderItems[index]._id) {
          FOLDER_PERMISSION_FIELDS.map(key => {
            selectedFolder[key] = !!payload[key];
          })

          subFolderItems[index] = selectedFolder;

          console.log('subfolderitems', subFolderItems);

          let cloneFolderTemplate = _.cloneDeep(folderTemplate);

          cloneFolderTemplate['subfolder'] = subFolderItems;

          console.log('cloneFolderTemplate', cloneFolderTemplate);
          //call create update folder template;
          this._handleCreateUpdateFolderTemplate(cloneFolderTemplate);
        }
      }

      console.log('this is a folder template', selectedFolder, payload);
      console.log('subFolderListItems', subFolderListItems);
    } else {
      if(selectedFolder && selectedFolder._id) {
        newPayload['_firm'] = selectedFolder._firm;
        newPayload['_client'] = selectedFolder._client;
        newPayload['_folder'] = selectedFolder._id;
      } else {
        newPayload['_firm'] = firm._id;
      }
  
      this.setState({
        submitting: true
      })
      dispatch(fileActions.sendCreateFolderPermission(newPayload)).then(json => {
        this.setState({
          submitting: false
        })
        if(json && json.success && json.item) {
          this.feedbackMessage.current.showSuccess('Successfully updated')
        } else {
          this.feedbackMessage.current.showError('Failed to update folder permission')
        }
      })
    }

    // if(selectedPermission && selectedPermission._id) {
    //   //update permission;
    //   newPayload['_id'] = selectedPermission._id;
    //   console.log('newpayload', newPayload);
    // } else {
    //   //create new permission
    //   console.log('newpayload', newPayload);
    // }

  }

  render() {

    const {
      isOpen
      , close
      , file = {}
      , firm
      , isFolderTemplate = false
    } = this.props;

    const {
      submitting
      , loading
    } = this.state;

    console.log('selected file permission', file);

    return(
      <Modal
        cardSize='jumbo'
        isOpen={isOpen}
        closeAction={close}
        modalHeader={`Folder Permission Settings (${file.filename || file.name})`}
        showButtons={true}
        confirmAction={this._handleSubmit}
        confirmText={submitting ? 'Saving...' : 'Save'}
        disableConfirm={submitting}
      >

        <FeedbackMessage ref = {this.feedbackMessage} />
        {
          !loading ?
          <FolderPermissionTable
            selectedFile={file}
            handleChange={this._handleChange}
            selectedFirm={firm}
            isFolderTemplate={isFolderTemplate}
          />
          : null
        }

      </Modal>
    )
  }
}

FolderPermissionModal.propTypes = {
  close: PropTypes.func.isRequired
  , dispatch: PropTypes.func.isRequired
  , isOpen: PropTypes.bool.isRequired
  , file: PropTypes.object
}

FolderPermissionModal.defaultProps = {}

const mapStoreToProps = (store, props) => {
  const match = props.match;

  const listArgs = routeUtils.listArgsFromObject({
    _client: match.params.clientId || 'null'
  })

  let folderPermissionList = store.folderPermission.util.getList(...listArgs); 

  return {
    loggedInUser: store.user.loggedIn.user
    , clientStore: store.client
    , fileStore: store.file
    , folderPermissionStore: store.folderPermission
    , folderPermissionList: folderPermissionList || []
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(FolderPermissionModal)
);