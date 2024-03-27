/**
 * Reusable stateless form component for Notification
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { SelectFromObject, TextInput } from '../../../../global/components/forms';

const  AdminNotificationForm = ({
  cancelLink
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , notification
  , userListItems
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Create Notification" : "Update Notification";

  // set the form header
  const header = formTitle ? <div className="formHeader"><h2> {formTitle} </h2><hr/></div> : <div/>;

  return (
    <div className="yt-container">
      <div className="yt-row center-horiz">
        <div className="form-container -slim">
          <form name="notificationForm" className="notification-form" onSubmit={handleFormSubmit}>
            {header}
            <SelectFromObject
              items={userListItems}
              change={handleFormChange}
              display={'username'}
              displayStartCase={false}
              filterable={false}
              label=''
              name='notification._user'
              placeholder={userListItems.length === 0 ? '-- No addresses found --' : '-- Select a user --'}
              value={'_id'}
            />
            <TextInput
              change={handleFormChange}
              label="Content"
              name="notification.content"
              placeholder="Content (required)"
              required={true}
              value={notification.content}
            />
            <TextInput
              change={handleFormChange}
              label="Link"
              name="notification.link"
              placeholder="Link (required)"
              required={true}
              value={notification.link}
            />
            <div className="input-group">
              <div className="yt-row space-between">
                <Link className="yt-btn link" to={cancelLink}>Cancel</Link>
                <button className="yt-btn " type="submit" > {buttonText} </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

AdminNotificationForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , notification: PropTypes.object.isRequired
}

AdminNotificationForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
}

export default AdminNotificationForm;
