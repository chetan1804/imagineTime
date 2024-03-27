// import primary libaries
import React from 'react';
import PropTypes from 'prop-types';

// import form components
import { TextInput } from '../../../../global/components/forms';

function UserReviewAccountForm({
  address
  , client
  , handleFormChange
  , handleFormSubmit
  , phoneNumber
  , submitting
}) {
  return (
    <div className="form-container">
      <form name="UserReviewAccountForm" className="user-review-account-form" onSubmit={handleFormSubmit}>
        <h2>Review your account information</h2>
        <br/>
        <p>Let's review your account information to make sure we've got everything down correctly</p>
        <br/>
        <div className="yt-row space-between">
          <div className="yt-col full m_40">
            <TextInput
              change={handleFormChange}
              label="Company"
              name="client.name"
              // required={true}
              disabled={true}
              value={client.name}
            />
            <TextInput
              change={handleFormChange}
              label="Phone"
              name="phoneNumber.number"
              // required={true}
              value={phoneNumber.number || ''}
            />
            <TextInput
              change={handleFormChange}
              label="Website"
              name="client.website"
              // required={true}
              value={client.website || ''}
            />
          </div>
          <div className="yt-col full m_40">
            <TextInput
              change={handleFormChange}
              label="Address"
              name="address.street1"
              placeholder="street"
              // required={true}
              value={address.street1 || ''}
            />
            <TextInput
              change={handleFormChange}
              name="address.street2"
              placeholder="street"
              value={address.street2 || ''}
            />
            <div className="yt-row space-between">
              <div className="yt-col full m_40">
                <TextInput
                  change={handleFormChange}
                  name="address.city"
                  placeholder="city"
                  // required={true}
                  value={address.city || ''}
                />
              </div>
              <div className="yt-col full xs_40 m_20">
                <TextInput
                  change={handleFormChange}
                  name="address.state"
                  placeholder="state"
                  // required={true}
                  value={address.state || ''}
                />
              </div>
              <div className="yt-col full xs_40 m_30">
                <TextInput
                  change={handleFormChange}
                  name="address.postal"
                  placeholder="zipcode"
                  // required={true}
                  value={address.postal || ''}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="input-group">
          <div className="yt-row right">
            <button disabled={submitting} className="yt-btn" type="submit" > {submitting ? 'Saving...' : 'Looks Good' }</button>
          </div>
        </div>
      </form>
    </div>
  )
}

UserReviewAccountForm.propTypes = {
  address: PropTypes.object.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , client: PropTypes.object.isRequired
  , phoneNumber: PropTypes.object.isRequired
  , submitting: PropTypes.bool
}

export default UserReviewAccountForm;
