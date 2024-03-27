/**
 * Reusable stateless form component for Staff
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { 
  CheckboxInput
  , SelectFromArray
  , TextInput, ToggleSwitchInput
} from '../../../../global/components/forms';

const  PracticeStaffForm = ({
  cancelLink
  , firm
  , handleFormChange
  , handleFormSubmit
  , staff
  , submitting
  , toggleESigAccess
  , user
  , handleCreateApiUser
}) => {

  console.log('selected staff', staff);
  return (
    <div className="yt-row">
      <div className="yt-col m_60 l_50">
        <div className="-practice-content">
          <p><strong>Staff Member: </strong></p>
          <p>{user.firstname} {user.lastname}</p>
          <p>{user.username}</p>
          <hr/>
          <SelectFromArray
            change={handleFormChange}
            label='Status'
            name='staff.status'
            items={['active','inactive']}
            placeholder={'-- Set status --'}
            required={true}
            value={staff.status}
          />
          <CheckboxInput
            name='staff.owner'
            label='This staff member has owner privileges'
            value={staff.owner}
            change={handleFormChange}
            checked={staff.owner}
          />
          { firm && firm.eSigAccess ?
          <div>
            <ToggleSwitchInput
              change={toggleESigAccess}
              disabled={submitting}
              label={'E-Signature Access'}
              helpText={submitting ? 'Submitting...' : staff.apiKey && staff.apiUsername ? '' : 'Note: This may take a minute.'}
              name={'eSigAccess'}
              rounded={true}
              value={staff.eSigAccess}
            />
            <TextInput
              required={false}
              value={staff.eSigEmail}
              placeholder="E-Signature Custom Email"
              change={handleFormChange}
              name='staff.eSigEmail'
              helpText={'Note: Use this if you have an existing AssureSign email that is not same with your ImagineShare email'}
            >
            </TextInput>
            <div className="input-group">
              <button
                className="yt-btn"
                disabled={submitting || !staff.eSigAccess}
                onClick={handleCreateApiUser}
              >
                Verify staff in Assuresign
              </button>
            </div>
          </div>
            :
            null
          }

          <div className="input-group">
            <div className="yt-row space-between">
              <Link className="yt-btn link" to={cancelLink}>Cancel</Link>
              <button className="yt-btn " onClick={handleFormSubmit} > Save </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

PracticeStaffForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , firm: PropTypes.object.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , staff: PropTypes.object.isRequired
  , submitting: PropTypes.bool
  , toggleESigAccess: PropTypes.func.isRequired
  , user: PropTypes.object.isRequired
}

PracticeStaffForm.defaultProps = {
  formHelpers: {}
}

export default PracticeStaffForm;
