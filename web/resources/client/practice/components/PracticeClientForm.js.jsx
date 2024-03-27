/**
 * Reusable stateless form component for Client
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import StaffNotificationForm from '../../../notification/components/StaffNotificationForm.js.jsx';

// import form components
import { 
  ListComparator
  , SelectFromObject
  , TextInput 
} from '../../../../global/components/forms';

const PracticeClientForm = ({
  cancelLink
  , client
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , message
  , handleExistingClient
  , staffListItems
  , selected
  , selectedStaffIds
  , handleSelectStaff
  , handleAddNewStaff
  , handleSetNotification
  , setNotification
  , staffNotification
  , handleNotificationChange
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Create Client" : "Update Client";
  let isDisabled = (
    !client
    || !client.name
    || !client.name.trim()
    || client.name.trim().length < 3
    || _.isObject(message) && client && message.name === client.name
  );

  let errorMessage = _.isObject(message) ? `This client name exist in ${message.status == "visible" ? "active client list" : "archived client list"}` 
    : errorMessage ? "Could not save Client" : "";
  let clientExist = _.isObject(message) ? message.status === "archived" : false;
  let clientName = _.isObject(message) ? message.name : "";

  let title = "Add a new client";
  let confirmButton = handleFormSubmit;
  let confirmText = "Save";

  if (selectedStaffIds && selectedStaffIds.length && selectedStaffIds[0]) {
    if (setNotification) {
      title = "Set staff notification";
      confirmButton = handleFormSubmit;
      confirmText = "Save";
    } else {
      confirmButton = handleSetNotification;
      confirmText = "Next";
    }
  }

  return (
    <div className="form-container -slim -yt-edit-form">
      <div name="clientForm" className="client-form">
        <h3>{title}</h3>
        {
          setNotification ?
          <div>
            <StaffNotificationForm
              handleFormChange={handleNotificationChange}
              staffNotification={staffNotification}
              allowedToUpdate={true}
              noTopMargin={true}
              multiple={true}
            />
            <div className="input-group" style={{ marginTop: '1em' }}>
              <div className="yt-row space-between">
                <button className="yt-btn link" onClick={handleSetNotification}>Back</button>
                <button className="yt-btn " onClick={confirmButton}>{confirmText}</button>
              </div>
            </div>
          </div>
          :
          <div>
            <TextInput
              change={handleFormChange}
              label="Name"
              name="client.name"
              required={true}
              value={client && client.name}
              helpText={errorMessage}
              classes="-yt-edit-input"
            />
            {
              clientExist ?
              <div style={{ position: "relative", top: "-10px" }}>
                <button className="yt-btn xx-small link info" onClick={() => handleExistingClient("createNew", message)}>
                  {`Create new client with this name ${selectedStaffIds && selectedStaffIds.length && selectedStaffIds[0] ? 'and assign staff' : ''}`}
                </button>
                <br/>
                <button className="yt-btn xx-small link info" onClick={() => handleExistingClient("reInstate", message)} style={{ position: "relative", top: "-4px"  }}>
                  {`Reinstate existing client ${selectedStaffIds && selectedStaffIds.length && selectedStaffIds[0] ? 'and assign staff' : ''}`}
                </button>
              </div>
              : null
            }
            <TextInput
              change={handleFormChange}
              label="Client identifier"
              name="client.identifier"
              required={false}
              value={client.identifier || client.externalId}
            />
            {
              selectedStaffIds && selectedStaffIds.length ?
              selectedStaffIds.map((staffId, i) => 
                <SelectFromObject
                  key={i}
                  items={staffListItems}
                  change={handleSelectStaff}
                  disabled={staffListItems.length === 0}
                  display={'displayName'}
                  displayStartCase={false}
                  filterable={false}
                  label='Assign Staff'
                  name={i}
                  placeholder={staffListItems.length === 0 ? '-- No available staff --' : '-- Choose a staff member --'}
                  value={'_id'}
                  selected={staffId}
                  isClearable={true}
                  signersId={selectedStaffIds}
                />
              )
              : null
            }
            <ListComparator
              change={handleFormChange}
              filterable={false}
              allItems={formHelpers.engagementTypes}
              label="Engagement types"
              name="client.engagementTypes"
              reorderable={false}
              required={false}
              items={client.engagementTypes}
            />
            <div className="input-group" style={{ marginTop: '1em' }}>
              <div className="yt-row space-between">
                <Link className="yt-btn link" to={cancelLink}>Cancel</Link>
                <button className="yt-btn " disabled={isDisabled} onClick={confirmButton}>{confirmText}</button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  )
}

PracticeClientForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , client: PropTypes.object.isRequired
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , users: PropTypes.array
}

PracticeClientForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
}

export default PracticeClientForm;
