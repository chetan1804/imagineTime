/**
 * NOTE: this should never be viewed outside the context of a firm 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminStaffListItem = ({
  staff
  , user
  , firm
  , handleResendInvite
  , sending
  , selectedStaff
  , selectedFirm
  , success
}) => {
  return (
    !firm ? // We use this list item in two places with different headers. 
    <tr>
      <td>{user ? `${user.firstname} ${user.lastname}` : 'loading'}</td>
      <td>{user ? user.username : ''}</td>
      <td>{staff.owner ? 'Owner' : 'Standard'}</td>
      <td>{_.startCase(staff.status)}</td>
      <td><Link to={`/admin/staff/${staff._id}/update?firm=${staff._firm}`}>Update</Link></td>
      <td>
        <button className="yt-btn x-small" onClick={(e) => {
          if(!success && !sending)
            handleResendInvite(user, staff.owner, firm
          )}}>
          {
            sending && selectedStaff === staff._user && selectedFirm === staff._firm ? 
            <span><i className="far fa-spinner fa-spin"/> Sending...</span>
            :
            success && selectedStaff === staff._user && selectedFirm === staff._firm ? 
            <span><i className="fal fa-check"/> Success</span>
            :
            <span><i className="fal fa-paper-plane"/> Resend Invite</span>
          }
        </button>  
      </td>
    </tr>
    :
    <tr>
      <td>{user ? `${user.firstname} ${user.lastname}` : 'loading'}</td>
      <td>{user ? user.username : ''}</td>
      <td>{firm.name || ''}</td>
      <td>{staff.owner ? 'Owner' : 'Standard'}</td>
      <td>{_.startCase(staff.status)}</td>
      <td><Link to={`/admin/staff/${staff._id}/update?firm=${staff._firm}`}>Update</Link></td>
      <td>
        <button className="yt-btn x-small" onClick={(e) => {
            if(!sending)
              handleResendInvite(user, staff.owner, firm)
          }}>
          {
            sending && selectedStaff === staff._user && selectedFirm === staff._firm ? 
            <span><i className="far fa-spinner fa-spin"/> Sending...</span>
            :
            success && selectedStaff === staff._user && selectedFirm === staff._firm ? 
            <span><i className="far fa-check"/> Success</span>
            :
            <span><i className="fal fa-paper-plane"/> Resend Invite</span>
          }
        </button>  
      </td>
    </tr>
  )
}

AdminStaffListItem.propTypes = {
  staff: PropTypes.object.isRequired
  , user: PropTypes.object.isRequired
}

export default AdminStaffListItem;
