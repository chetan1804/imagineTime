/**
 * Resuable modal component for inviting new stafff members to a firm. 
 *
 * Creates a new staff from a copy of the defaultItem in the staff reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import third-party libraries
import _ from 'lodash';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import { 
  CheckboxInput
  , EmailInput
  , TextInput 
} from '../../../global/components/forms';

class StaffInviteForm extends Binder {
  constructor(props) {
    super(props);
    this._bind(
      '_handleFormChange'
    )
  }

  _handleFormChange(e) {
    const { change, index } = this.props;
    change(e, index);
  }
  render() {
    const { index, invite, remove } = this.props;
    return(
      <div className="invitation-form">
        <div className="yt-row space-between">
          <strong> Invitation #{index + 1}</strong>
          <button className="yt-btn x-small link" onClick={() => remove(index)}>
            <i className="far fa-times"/>
          </button>
        </div>
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
        <CheckboxInput
          name="owner"
          label="This staff member has owner privileges"
          value={invite.owner}
          change={this._handleFormChange}
          checked={invite.owner}
        />
      </div>
    )
  }
}

StaffInviteForm.defaultProps = {
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

export default StaffInviteForm;