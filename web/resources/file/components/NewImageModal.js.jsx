/**
 * Modal component for adding a single image to a place or section (or user
 * profile)
 *
 * Creates a new file object in the database and passes back the reference _id
 * to the parent component
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import Files from 'react-files';

// import actions
import * as fileActions from '../fileActions';

// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from '../../../global/components/modals/Modal.js.jsx';
import { ImageInput } from '../../../global/components/forms';


class NewImageModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      files: []
      , submitting: false
    }
    this._bind(
      '_handleFormSubmit'
      , '_handleFileChange'
    );
    this.props.socket.on('upload_finished', (files) => {
      this.setState({
        submitting: false
        , progressPercent: []
      })

      // Add isOpen check so this modal doesn't do anything when files are uploaded elsewhere.
      if(this.props.handleUploaded && this.props.isOpen) {
        this.props.handleUploaded(files[0])
      }
    })
  }

  componentWillUnmount() {
    // Remove event listeners
    this.props.socket.off('upload_finished')
  }

  _handleFileChange(files) {
    // console.log(files);
    this.setState({files});
  }

  _handleFormSubmit(e) {
    const { close, dispatch, handleUploaded, history } = this.props;
    this.setState({submitting: true})
    if(e) {
      e.preventDefault();
    }
    // convert to a FormData objet to allow uploading file=
    const { files } = this.state;
    if(files.length < 1) {
      alert("No files present");
    } else {
      // console.log(file);
      // build formdata to upload file
      let formData = new FormData()
      Object.keys(this.state.files).forEach((key) => {
        const file = this.state.files[key]
        formData.append(key, new Blob([file], { type: file.type }), file.name || 'file')
      })

      // add file pointers
      Object.keys(this.props.filePointers).forEach(key => {
        formData.append(key, this.props.filePointers[key]);
      })

      dispatch(fileActions.sendCreateFiles(formData)).then((result) => {
        if(!result.success) {
          // console.log("Response Error:");
          // console.log(action);
          alert("ERROR - Check logs");
          this.setState({submitting: false})
        }
      });
    }
  }

  render() {
    const {
      close
      , isOpen
    } = this.props;

    return (
      <Modal
        closeAction={close}
        isOpen={isOpen}
        btnColor="info"
        closeText="Cancel"
        confirmText={this.state.submitting ? "Uploading..." : "Upload & save"}
        disableConfirm={this.state.files.length < 1 || this.state.submitting}
        confirmAction={this._handleFormSubmit}
        modalHeader="Upload new image"
      >
        <ImageInput
          change={this._handleFileChange}
          clickable={true}
          multiple={false}
        />
      </Modal>
    )
  }
}

NewImageModal.propTypes = {
  close: PropTypes.func.isRequired
  , dispatch: PropTypes.func.isRequired
  , handleUploaded: PropTypes.func
  , isOpen: PropTypes.bool
}

NewImageModal.defaultProps = {
  isOpen: false
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    socket: store.user.socket
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(NewImageModal)
);
