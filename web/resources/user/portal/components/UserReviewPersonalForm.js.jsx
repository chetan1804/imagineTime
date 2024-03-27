// import primary libaries
import React from 'react';
import PropTypes from 'prop-types';

// import form components
import { TextInput } from '../../../../global/components/forms';

function UserReviewPersonalForm({
  address
  , handleFormChange
  , handleFormSubmit
  , phoneNumber
  , submitting
  , user
}) {
  return (
    <div className="form-container">
      <form name="UserReviewPersonalForm" className="user-review-personal-form" onSubmit={handleFormSubmit}>
        <h2>Review personal information</h2>
        <br/>
        <p>Let’s make sure we have your personal contact information correct while we’re at it. It will speed things up during tax season.</p>
        <br/>
        <div className="yt-row space-between">
          <div className="yt-col full m_40">
            <TextInput
              change={handleFormChange}
              label="Primary Contact"
              name="user.firstname"
              placeholder="First name"
              // required={true}
              value={user.firstname || ''}
            />
            <TextInput
              change={handleFormChange}
              label=""
              name="user.lastname"
              placeholder="Last name"
              // required={true}
              value={user.lastname || ''}
            />
            <div className="yt-row space-between">
              <div className="yt-col full m_50">
                <TextInput
                  change={handleFormChange}
                  disabled={true}
                  label="Email"
                  name="user.username"
                  value={user.username || ''}
                />
              </div>
              <div className="yt-col full m_40">
                <TextInput
                  change={handleFormChange}
                  label="Phone"
                  name="phoneNumber.number"
                  // required={true}
                  value={phoneNumber.number || ''}
                />
              </div>
            </div>
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

UserReviewPersonalForm.propTypes = {
  address: PropTypes.object.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , phoneNumber: PropTypes.object.isRequired
  , submitting: PropTypes.bool
  , user: PropTypes.object.isRequired
}

export default UserReviewPersonalForm;
