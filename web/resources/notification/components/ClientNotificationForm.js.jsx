/**
 * Reusable stateless form component for Notification
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { TextInput } from '../../../global/components/forms';

const ClientNotificationForm = ({
  handleFormChange
  , clientNotification
  , allowedToUpdate
}) => {

  return (
    <div className="-practice-content -staff-client-notification">
        <p>Contacts will receive a notification when you:</p>
        <div style={{ marginTop: "1em" }}>
            <div className="yt-row center-vert u-muted">
                <div className={`-notification-icon -toggle ${clientNotification.sN_upload ? "-on" : "-off"}`}  style={{ marginTop: "0.5em" }}>
                    <i className={`fas fa-bell${clientNotification.sN_upload ? "" : "-slash"}`} 
                        onClick={() => allowedToUpdate ? allowedToUpdate ? handleFormChange("clientNotification.sN_upload", !clientNotification.sN_upload) : console.log("No permissions ") : console.log("No permissions ")} />
                    <label className="u-muted">Upload a file</label>
                </div>
            </div>
            <div className="yt-row center-vert u-muted">
                <div className={`-notification-icon -toggle ${clientNotification.sN_viewed ? "-on" : "-off"}`}  style={{ marginTop: "0.5em" }}>
                    <i className={`fas fa-bell${clientNotification.sN_viewed ? "" : "-slash"}`} 
                        onClick={() => allowedToUpdate ? handleFormChange("clientNotification.sN_viewed", !clientNotification.sN_viewed) : console.log("No permissions ")} />
                    <label className="u-muted">View a file they uploaded</label>
                </div>
            </div>
            <div className="yt-row center-vert u-muted">
                <div className={`-notification-icon -toggle ${clientNotification.sN_downloaded ? "-on" : "-off"}`}  style={{ marginTop: "0.5em" }}>
                    <i className={`fas fa-bell${clientNotification.sN_downloaded ? "" : "-slash"}`} 
                        onClick={() => allowedToUpdate ? handleFormChange("clientNotification.sN_downloaded", !clientNotification.sN_downloaded) : console.log("No permissions ")} />
                    <label className="u-muted">Download a file they uploaded</label>
                </div>
            </div>
            <div className="yt-row center-vert u-muted">
                <div className={`-notification-icon -toggle ${clientNotification.sN_leaveComment ? "-on" : "-off"}`}  style={{ marginTop: "0.5em" }}>
                    <i className={`fas fa-bell${clientNotification.sN_leaveComment ? "" : "-slash"}`} 
                        onClick={() => allowedToUpdate ? handleFormChange("clientNotification.sN_leaveComment", !clientNotification.sN_leaveComment) : console.log("No permissions ")} />
                    <label className="u-muted">Comment on a file</label>
                </div>
            </div>
            <div className="yt-row center-vert u-muted">
                <div className={`-notification-icon -toggle ${clientNotification.sN_sendMessage ? "-on" : "-off"}`}  style={{ marginTop: "0.5em" }}>
                    <i className={`fas fa-bell${clientNotification.sN_sendMessage ? "" : "-slash"}`} 
                        onClick={() => allowedToUpdate ? handleFormChange("clientNotification.sN_sendMessage", !clientNotification.sN_sendMessage) : console.log("No permissions ")} />
                    <label className="u-muted">Send a message</label>
                </div>
            </div>
            <div className="yt-row center-vert u-muted">
                <div className={`-notification-icon -toggle ${clientNotification.sN_autoSignatureReminder ? "-on" : "-off"}`}  style={{ marginTop: "0.5em" }}>
                    <i className={`fas fa-bell${clientNotification.sN_autoSignatureReminder ? "" : "-slash"}`} 
                        onClick={() => allowedToUpdate ? handleFormChange("clientNotification.sN_autoSignatureReminder", !clientNotification.sN_autoSignatureReminder) : console.log("No permissions ")} />
                    <label className="u-muted">Weekly reminder for incomplete signature requests</label>
                </div>
            </div>
        </div>
    </div>
  )
}

ClientNotificationForm.propTypes = {
  handleFormChange: PropTypes.func.isRequired
}

ClientNotificationForm.defaultProps = {
}

export default ClientNotificationForm;
