/**
 * Standard modal example that lets the user update their own profile information
 *
 * TODO: add path and methods to change password
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';

// import global coponents
import Binder from '../../../global/components/Binder.js.jsx';
import Modal from '../../../global/components/modals/Modal.js.jsx';
import PasswordInput from '../../../global/components/forms/PasswordInput.js.jsx'; 

// import module components
import UserProfileForm from './UserProfileForm.js.jsx';


class UpdatePasswordModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {};
    this._bind();
  }

  render() {
    const {
      closeModal
      , handleFormChange
      , handleFormSubmit
      , isModalOpen
      , newUserData
      , user
      , oldPass
      , newPass
      , confirmPass
    } = this.props;

    return (
      <Modal
        isOpen={isModalOpen}
        modalHeader={<span>Update my password</span>}
        modalClasses="info"
        btnColor="info"
        closeAction={()=> closeModal()}
        closeText="Cancel"
        confirmAction={(e)=> handleFormSubmit(e)}
        confirmText="Save & Close"
        cardSize={"standard"}
      >
        <PasswordInput
          name="oldPass"
          label="Old Password"
          value={oldPass || ''}
          change={handleFormChange}
          required={true}
          password={true}
        />
        <PasswordInput
          name="newPass"
          label="New Password"
          value={newPass || ''}
          change={handleFormChange}
          required={true}
          password={true}
        />
        <PasswordInput
          name="confirmPass"
          label="Confirm Password"
          value={confirmPass || ''}
          change={handleFormChange}
          required={true}
          password={true}
        />
      </Modal>
    )
  }
}

UpdatePasswordModal.propTypes = {
  changeCount: PropTypes.number.isRequired
  , closeModal: PropTypes.func.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , isModalOpen: PropTypes.bool.isRequired
  , newUserData: PropTypes.object.isRequired
}

export default UpdatePasswordModal;
