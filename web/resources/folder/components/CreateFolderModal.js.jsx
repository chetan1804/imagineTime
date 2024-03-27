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

// import actions
import * as folderActions from '../folderActions';

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
      , name: ""
    }
    this._bind(
      '_handleClose'
      , '_handleFormSubmit'
      , '_handleFormChange'
    );
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleFormSubmit(e) {
    // e.preventDefault();
    const { dispatch, history, match, loggedInUser } = this.props;
    const { name } = this.state;
    // e.preventDefault();
    this.setState({ submitting: true });


    console.log('this.props', this.props);
    return;
    // table.increments('_id').primary()
    // table.timestamps(false, true)

    // table.specificType('_tags', 'INT[]').defaultTo('{}') //https://stackoverflow.com/questions/30933266/empty-array-as-postgresql-array-column-default-value
    // table.string('name');
    // table.string('status');
    // table.integer('_user')
    // table.foreign('_user').references('_id').inTable('users')
    // table.integer('_client').nullable()
    // table.integer('_folder').nullable()
    // table.integer('_firm')
    // table.foreign('_firm').references('_id').inTable('firms')

    const sendData = {
      filename: name ? name : "workspace1"
      , status: "visible"
      , _user: loggedInUser._id
      , _client: match.params.clientId
      , _folder: match.params.folder
      , _firm: match.params.firmId
      , wasAccessed: false
    }

    console.log("send", sendData)

    dispatch(folderActions.sendCreateFolder(sendData)).then(folderRes => {
      if (folderRes.success) {
        this.setState({ submitting: false });
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  _handleClose() {
    const { close } = this.props;
    this.setState({
      submitting: false
    }, () => {
      if(close) {
        close()
      }
    });
  }

  render() {
    const { isOpen, multiple, showStatusOptions } = this.props;
    const { submitting, name } = this.state;
    // const btnDisabled = name ? false : true;  // !files.some(f => !f.virusDetected && !f.fileNotFound);

    return (
      <Modal
        closeAction={this._handleClose}
        closeText="Cancel"
        confirmAction={this._handleFormSubmit}
        confirmText={submitting ? "saving..." : "Save" }
        disableConfirm={submitting}
        isOpen={isOpen}
        modalHeader="Create Folder"
      >
        <TextInput
          change={this._handleFormChange}
          label="Folder Name"
          name="name"
          placeholder="Folder Name (optional)"
          value={name}
          required={false}
        />
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
}

CreateFolderModal.defaultProps = {
  filePointers: {}
  , multiple: true
  , showStatusOptions: false
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
