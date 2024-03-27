/**
 * Modal component for adding/updating assuresign credentials for a firm.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import global components
import Binder from "../../../../global/components/Binder.js.jsx";
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import { EmailInput, SelectFromObject, TextInput } from '../../../../global/components/forms';


class AdminUpdateAssureSignModal extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      apiKey
      , apiUsername
      , availableStaff
      , close
      , contextIdentifier
      , handleFormChange
      , handleFormSubmit
      , handleStaffChange
      , isOpen
      , selectedStaffId
    } = this.props;
    const isDisabled = !apiKey || !apiUsername || !contextIdentifier || !selectedStaffId
    return (
      <Modal
        closeAction={close}
        disableConfirm={isDisabled}
        isOpen={isOpen}
        btnColor="info"
        closeText="Cancel"
        confirmText={"Save"}
        confirmAction={handleFormSubmit}
        modalHeader="Update e-signature credentials"
      >
        <p><small><em><strong>NOTE:</strong> If you are unfamiliar with this process, full instructions are on Basecamp.</em></small></p>
        <p><small><em>Look for a file named <strong>E-signature setup instructions</strong>.</em></small></p>
        <hr/>
        <p>
          <em>
            To create e-signature credentials go to
            <a href="https://www.assuresign.net" target="_blank"> assuresign.net  <i className="fad fa-external-link fa-sm"/></a>
          </em>
        </p>
        <br/>
        <TextInput
          change={handleFormChange}
          label="DocumentNOW Account Context Identifier"
          name="contextIdentifier"
          value={contextIdentifier}
        />
        <SelectFromObject
          change={handleStaffChange}
          items={availableStaff}
          display="displayName"
          displayStartCase={false}
          helpText="The email address must match the one that you entered on assuresign.net"
          label="Context Username"
          name={"selectedStaffId"}
          placeholder="-- Select a user --"
          selected={selectedStaffId}
          value="_id"
        />
        { selectedStaffId ?
          <div>
            <TextInput
              change={handleFormChange}
              label="API Key"
              name="apiKey"
              value={apiKey}
            />
            <TextInput
              change={handleFormChange}
              label="API Username"
              name="apiUsername"
              value={apiUsername}
            />
          </div>
          :
          null
        }
      </Modal>
    )
  }
}


AdminUpdateAssureSignModal.propTypes = {
  apiKey: PropTypes.string
  , apiUsername: PropTypes.string
  , close: PropTypes.func.isRequired
  , contextIdentifier: PropTypes.string
  , selectedStaffId: PropTypes.string
  , dispatch: PropTypes.func.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , isOpen: PropTypes.bool
}

AdminUpdateAssureSignModal.defaultProps = {
  apiKey: ''
  , apiUsername: ''
  , contextIdentifier: ''
  , selectedStaffId: ''
  , isOpen: false
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {

  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminUpdateAssureSignModal)
);
