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
import * as staffClientActions from '../../staffClientActions';

// import global components
import Binder from "../../../../global/components/Binder.js.jsx";
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import { FileInput, CheckboxInput, SelectFromArray, TextInput } from '../../../../global/components/forms';

// import resouce components
import StaffNotificationForm from '../../../notification/components/StaffNotificationForm.js.jsx';

class StaffClientNotificationToggleForm extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            submitting: false
            , staffNotification: {
                sN_upload: true
                , sN_viewed: true
                , sN_downloaded: true
                , sN_leaveComment: true
                , sN_sendMessage: true
                , sN_viewSignatureRequest: true
                , sN_signingCompleted: true
                , sN_autoSignatureReminder: true
            }
        }
        this._bind(
            '_handleClose'
            , '_handleSubmit'
            , '_handleFormChange'
        );
    }

    _handleFormChange(name, value) {
        let newState = _.update(this.state, name, () => {
            return value;
        });
        this.setState({ newState, message: "" });
    }

    _handleSubmit(e) {
        const { dispatch, selectedClientId, match } = this.props;
        const staffNotification = _.cloneDeep(this.state.staffNotification);
        const sendData = {
            clientIds: selectedClientId
            , firmId: match.params.firmId
            , staffNotification
        }

        this.setState({ submitting: true });
        dispatch(staffClientActions.sendBulkNotificationUpdate(sendData)).then(json => {
            if (json.success) {
                this._handleClose("success");
            } else {
                alert(json.message);
                this.setState({ submitting: false });
            }            
        });
    }

    _handleClose(type) {
        const { close, handleClose } = this.props;
        this.setState({
            submitting: false
            , staffNotification: {
                sN_upload: true
                , sN_viewed: true
                , sN_downloaded: true
                , sN_leaveComment: true
                , sN_sendMessage: true
                , sN_viewSignatureRequest: true
                , sN_signingCompleted: true
                , sN_autoSignatureReminder: true
            }
        }, () => {
            if(type === "success" && handleClose) {
                handleClose()
            } else if (close) {
                close();
            }
        });
    }
    
    render() {
        const { 
            isOpen
            , selectedClientId
        } = this.props;

        const {
            submitting
            , staffNotification 
        } = this.state;

        const isStaffOwner = true;
        console.log("selectedClientId", selectedClientId);
        return (
        <Modal
            closeAction={this._handleClose}
            closeText="Cancel"
            confirmAction={this._handleSubmit}
            confirmText={submitting ? "Saving..." : "Save" }
            disableConfirm={submitting}
            isOpen={isOpen}
            modalHeader="Staff Notification Settings"
        >
            <div>
                <div className="-share-link-configuration">
                    <div className="-body -staff-notification-setting">
                        <StaffNotificationForm
                            handleFormChange={this._handleFormChange}
                            staffNotification={staffNotification}
                            allowedToUpdate={true}
                            noTopMargin={false}
                            multiple={true}
                        />
                    </div>
                </div>
            </div>
        </Modal>
        )
    }
}

StaffClientNotificationToggleForm.propTypes = {
  close: PropTypes.func.isRequired
  , isOpen: PropTypes.bool.isRequired
}

StaffClientNotificationToggleForm.defaultProps = {

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
  )(StaffClientNotificationToggleForm)
);
