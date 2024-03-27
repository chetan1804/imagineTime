/**
 * Reusable stateless form component for Notification
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { TextInput } from '../../../global/components/forms';

const StaffNotificationForm = ({
  handleFormChange
  , staffNotification = {}
  , allowedToUpdate
  , multiple
  , noTopMargin
}) => {

  console.log("staffNotification", staffNotification)

  return (
    <div style={noTopMargin ? { paddingTop: 0 } : {}} className="-practice-content -staff-client-notification">
        <h4 style={noTopMargin ? { marginTop: 0 } : {}}>{multiple ? "Assigned staffs" : "You"} will receive a notification when contacts:</h4>
        <div className="yt-row center-vert u-muted">
            <div className={`-notification-icon -toggle ${staffNotification.sN_upload ? "-on" : "-off"}`}  style={{ marginTop: "0.5em" }}>
                <i className={`fas fa-bell${staffNotification.sN_upload ? "" : "-slash"}`} 
                    onClick={() => allowedToUpdate ? allowedToUpdate ? handleFormChange("staffNotification.sN_upload", !staffNotification.sN_upload) : console.log("No permissions ") : console.log("No permissions ")} />
                <label className="u-muted">Upload a file</label>
            </div>
        </div>
        <div className="yt-row center-vert u-muted">
            <div className={`-notification-icon -toggle ${staffNotification.sN_viewed ? "-on" : "-off"}`}  style={{ marginTop: "0.5em" }}>
                <i className={`fas fa-bell${staffNotification.sN_viewed ? "" : "-slash"}`} 
                    onClick={() => allowedToUpdate ? allowedToUpdate ? handleFormChange("staffNotification.sN_viewed", !staffNotification.sN_viewed) : console.log("No permissions ") : console.log("No permissions ")} />
                <label className="u-muted">View a file you uploaded</label>
            </div>
        </div>
        <div className="yt-row center-vert u-muted">
            <div className={`-notification-icon -toggle ${staffNotification.sN_downloaded ? "-on" : "-off"}`}  style={{ marginTop: "0.5em" }}>
                <i className={`fas fa-bell${staffNotification.sN_downloaded ? "" : "-slash"}`} 
                    onClick={() => allowedToUpdate ? allowedToUpdate ? handleFormChange("staffNotification.sN_downloaded", !staffNotification.sN_downloaded) : console.log("No permissions ") : console.log("No permissions ")} />
                <label className="u-muted">Download a file you uploaded</label>
            </div>
        </div>
        <div className="yt-row center-vert u-muted">
            <div className={`-notification-icon -toggle ${staffNotification.sN_leaveComment ? "-on" : "-off"}`}  style={{ marginTop: "0.5em" }}>
                <i className={`fas fa-bell${staffNotification.sN_leaveComment ? "" : "-slash"}`} 
                    onClick={() => allowedToUpdate ? allowedToUpdate ? handleFormChange("staffNotification.sN_leaveComment", !staffNotification.sN_leaveComment) : console.log("No permissions ") : console.log("No permissions ")} />
                <label className="u-muted">Comment on a file</label>
            </div>
        </div>
        <div className="yt-row center-vert u-muted">
            <div className={`-notification-icon -toggle ${staffNotification.sN_signingCompleted ? "-on" : "-off"}`}  style={{ marginTop: "0.5em" }}>
                <i className={`fas fa-bell${staffNotification.sN_signingCompleted ? "" : "-slash"}`} 
                    onClick={() => allowedToUpdate ? allowedToUpdate ? handleFormChange("staffNotification.sN_signingCompleted", !staffNotification.sN_signingCompleted) : console.log("No permissions ") : console.log("No permissions ")} />
                <label className="u-muted">Complete a signature request</label>
            </div>
        </div>
        <div className="yt-row center-vert u-muted">
            <div className={`-notification-icon -toggle ${staffNotification.sN_viewSignatureRequest ? "-on" : "-off"}`}  style={{ marginTop: "0.5em" }}>
                <i className={`fas fa-bell${staffNotification.sN_viewSignatureRequest ? "" : "-slash"}`} 
                    onClick={() => allowedToUpdate ? allowedToUpdate ? handleFormChange("staffNotification.sN_viewSignatureRequest", !staffNotification.sN_viewSignatureRequest) : console.log("No permissions ") : console.log("No permissions ")} />
                <label className="u-muted">View a signature request</label>
            </div>
        </div>
        <div className="yt-row center-vert u-muted">
            <div className={`-notification-icon -toggle ${staffNotification.sN_sendMessage ? "-on" : "-off"}`}  style={{ marginTop: "0.5em" }}>
                <i className={`fas fa-bell${staffNotification.sN_sendMessage ? "" : "-slash"}`} 
                    onClick={() => allowedToUpdate ? allowedToUpdate ? handleFormChange("staffNotification.sN_sendMessage", !staffNotification.sN_sendMessage) : console.log("No permissions ") : console.log("No permissions ")} />
                <label className="u-muted">Send a message</label>
            </div>
        </div>
        <div className="yt-row center-vert u-muted">
            <div className={`-notification-icon -toggle ${staffNotification.sN_autoSignatureReminder ? "-on" : "-off"}`}  style={{ marginTop: "0.5em" }}>
                <i className={`fas fa-bell${staffNotification.sN_autoSignatureReminder ? "" : "-slash"}`} 
                    onClick={() => allowedToUpdate ? allowedToUpdate ? handleFormChange("staffNotification.sN_autoSignatureReminder", !staffNotification.sN_autoSignatureReminder) : console.log("No permissions ") : console.log("No permissions ")} />
                <label className="u-muted">Weekly reminder for incomplete signature requests</label>
            </div>
        </div>
    </div>
  )
}

StaffNotificationForm.propTypes = {
  handleFormChange: PropTypes.func.isRequired
}

StaffNotificationForm.defaultProps = {
}

export default StaffNotificationForm;
