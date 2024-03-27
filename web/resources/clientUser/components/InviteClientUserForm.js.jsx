/**
 * Reusable stateless form component for ClientUser invites.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import form components
import { EmailInput, TextInput, SelectFromObject, CheckboxInput } from '../../../global/components/forms';

class InviteClientUserForm extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      invitationType: "default"
      , userId: null
    }
    this._bind(
      '_handleFormChange'
      , '_handleSelectChange'
    )
  }

  _handleFormChange(e) {
    const { change, index } = this.props;
    change(e, index);
  }

  _handleSelectChange(e) {
    const { selectChange, index, userListItems } = this.props;
    let clientUser = userListItems.filter(user => user._id == e.target.value);
    // console.log("val", e.target.value, e.target.name, clientUser, userListItems)
    if (clientUser.length) {
      clientUser = clientUser[0];
      selectChange(clientUser, index);
    }
    this.setState({ userId: e.target.value });
  }

  render() {
    const { invitationType, userId } = this.state;
    const { index, invite, remove, userListItems, changeType, inviteType, handleSetPrimary } = this.props;
    const displayType = inviteType[index];
    
    return (
      <div className="invitation-form">
        <div className="yt-row space-between">
          <strong> Invitation #{index + 1}</strong>
          <button className="yt-btn x-small link" onClick={() => remove(index)}>
            <i className="far fa-times"/>
          </button>
        </div>
        {
          displayType ?
          <SelectFromObject
            change={this._handleSelectChange}
            items={userListItems || []}
            // disabled={!!this.props.client}
            display="displayName"
            displayStartCase={false}
            filterable={true}
            // isClearable={false}
            name="userId"
            placeholder="Select existing user"
            selected={userId}
            value="_id"
          />
          : 
          <div style={{margin:0,padding:0}}>
            <EmailInput
              name="email"
              label="Email Address"
              value={invite.email}
              change={this._handleFormChange}
              required={true}
            />
            <TextInput
              change={this._handleFormChange}
              label="Full Name"
              name="fullname"
              required={false}
              value={invite.fullname}
            />
            {/* <TextInput
              change={this._handleFormChange}
              label="First Name"
              name="firstname"
              required={false}
              value={invite.firstname}
            />
            <TextInput
              change={this._handleFormChange}
              label="Last Name"
              name="lastname"
              required={false}
              value={invite.lastname}
            /> */}
          </div>
        }
        <div className="yt-row space-between">
          <div className={'-invite-primary-contact'}>
            <CheckboxInput
              name="invite.primary"
              value={invite.primary}
              checked={invite.primary}
              change={handleSetPrimary}
              label="Set as Primary Contact"
            />
          </div>
        </div>
        {
          displayType ?
            <button className="yt-btn xx-small link info" onClick={() => this.setState({ invitationType: !displayType }, changeType(displayType, index))}>Click here to create a new contact</button>
          : <button className="yt-btn xx-small link info" onClick={() => this.setState({ invitationType: !displayType }, changeType(displayType, index))}>Choose from existing contacts</button>
        }
      </div>
    )
  }
}

InviteClientUserForm.propTypes = {
  change: PropTypes.func.isRequired
  , index: PropTypes.number.isRequired 
  , invite: PropTypes.shape({
    email: PropTypes.string.isRequired
    , firstname: PropTypes.string.isRequired 
    , lastname: PropTypes.string.isRequired 
    , owner: PropTypes.isRequired 
  })
  , remove: PropTypes.func.isRequired 
}

InviteClientUserForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
  , showButtons: true
}

export default InviteClientUserForm;