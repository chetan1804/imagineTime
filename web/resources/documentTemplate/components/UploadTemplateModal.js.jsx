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
import * as documentTemplateActions from '../documentTemplateActions';

// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from '../../../global/components/modals/Modal.js.jsx';
import { FileInput, NumberInput, SelectFromArray } from '../../../global/components/forms';
import apiUtils from '../../../global/utils/api';

class UploadTemplateModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      files: []
      , submitting: false
    }
    this._bind(
      '_handleClose'
      , '_handleFormSubmit'
      , '_handleFilesChange'
      , '_handleFormChange'
    );
  }

  componentDidMount() {
    
  }

  _handleFilesChange(files) {
    console.log('files', files)
    this.setState({files});
  }

  _handleStatusChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleFormSubmit(e) {
    // const { match, selectedClient, location, folderListItems, viewingAs, filePointers, firm } = this.props;

    const { match, dispatch } = this.props;
    const files = _.cloneDeep(this.state.files);

    if(e) {
      e.preventDefault();
    }
    this.setState({ submitting: true });

    if (files && files.length) {
      let formData = new FormData();

      formData.append('_firm', match.params.firmId);
      Object.keys(files).forEach(key => {
        const file = files[key];
        formData.append(key, new Blob([file], { type: file.type }), file.name || 'file');
      });

      dispatch(documentTemplateActions.sendUploadTemplates(formData)).then(json => {
        this.setState({
          submitted: false
        });
        if(json.success) {
          this.props.handleUploaded(json.item)
          this._handleClose();
        } else {
          alert("ERROR: " + json.error);
        }
      });
    } else {
      alert("No files present");
    }
  }

  _handleClose() {
    const { close, match } = this.props;
    this.setState({
      files: []
      , submitting: false
    }, () => {
      if(close) {
        close()
      }
    });
  }

  render() {

    const { 
      isOpen
      , multiple
    } = this.props;
    
    const { files, submitting } = this.state;
    // const btnFileValid = !files.some(f => !f.virusDetected && !f.fileNotFound);


    return (
      <Modal
        closeAction={this._handleClose}
        closeText="Cancel"
        confirmAction={files.length > 0 ? this._handleFormSubmit : null}
        confirmText={submitting ? "Uploading..." : "Upload & save" }
        disableConfirm={submitting || !files || files.length < 1}
        isOpen={isOpen}
        modalHeader="Upload template"
      >
        <div>
          <FileInput
            change={this._handleFilesChange}
            label="Select Files"
            multiple={false}
            required={true}
            dispatch={this.props.dispatch}
            viewingAs="documentTemplate"
          />
        </div>
      </Modal>
    )
  }
}

UploadTemplateModal.propTypes = {
  close: PropTypes.func.isRequired
  , dispatch: PropTypes.func.isRequired
  , handleUploaded: PropTypes.func.isRequired
  , isOpen: PropTypes.bool.isRequired
  , multiple: PropTypes.bool
}

UploadTemplateModal.defaultProps = {
  multiple: false
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
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(UploadTemplateModal)
);
