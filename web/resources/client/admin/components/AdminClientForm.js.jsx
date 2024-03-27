/**
 * Reusable stateless form component for Client
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { 
  ObjectListComparator
  , CheckboxInput
  , SelectFromObject
  , TextInput
} from '../../../../global/components/forms';

const  AdminClientForm = ({
  cancelLink
  , client
  , firms
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , users
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Create Client" : "Update Client";

  // set the form header
  const header = formTitle ? <div className="formHeader"><h2> {formTitle} </h2><hr/></div> : <div/>;

  return (
    <div className="yt-container">
      <div className="yt-row center-horiz">
        <div className="form-container -slim">
          <form name="clientForm" className="client-form" onSubmit={handleFormSubmit}>
            {header}
            <TextInput
              change={handleFormChange}
              label="Name"
              name="client.name"
              placeholder="Name (required)"
              required={true}
              value={client.name || ""}
            />
            <SelectFromObject
              change={handleFormChange}
              disabled={formHelpers.firmId ? true : false}
              display={'name'}
              filterable={false}
              label="Firm"
              name="client._firm"
              items={firms}
              placeholder={"-- Select a Firm --"}
              required={!formHelpers.firmId}
              selected={formHelpers.firmId ? parseInt(formHelpers.firmId) : client._firm}
              value={'_id'}
            />
            {/* For easier testing. */}
            <CheckboxInput
              name="client.onBoarded"
              label="On-boarded"
              value={client.onBoarded}
              change={handleFormChange}
              checked={client.onBoarded}
            />
            {/*
            <div>
              <div className="-form-step"><span className="-num">3</span> Assign users (contacts) to this Client Account</div>
              <ObjectListComparator
                change={handleFormChange}
                displayKey={"username"}
                filterable={true}
                items={users}
                label="Client Users "
                name="formHelpers._userIds"
                placeholder="Training Modules"
                reorderable={true}
                required={false}
                selected={formHelpers._userIds}
                valueKey={"_id"}
              />
            </div>
            */}
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

AdminClientForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , client: PropTypes.object.isRequired
  , firms: PropTypes.array 
  , users: PropTypes.array
}

AdminClientForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
  , firms: []
  , users: []
}

export default AdminClientForm;
