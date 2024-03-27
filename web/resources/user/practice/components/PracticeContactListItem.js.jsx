// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

import { displayUtils } from '../../../../global/utils';
import { CheckboxInput } from '../../../../global/components/forms';

const PracticeContactListItem = ({
  address 
  , match 
  , phoneNumber
  , user
  , handleSelectUser
  , checked
}) => {
  return (
    <tr>
      <td>
        <CheckboxInput
          name="user"
          value={checked}
          change={() => handleSelectUser(user._id)}
          checked={checked}
        />
      </td>
      <td><Link to={`/firm/${match.params.firmId}/contacts/quick-view/${user._id}`}>{user.firstname} {user.lastname}</Link></td>
      <td>{user.username}</td>
      <td>{phoneNumber ? displayUtils.formatPhoneNumber(phoneNumber.number) : ''} {phoneNumber ? phoneNumber.extNumber ? phoneNumber.extNumber : '' : ''}</td>
      <td>{address ? address.street1 + ", " + address.city + ", " + address.state : ''}</td>
    </tr>
  )
}

PracticeContactListItem.propTypes = {
  address: PropTypes.object
  , phoneNumber: PropTypes.object 
  , user: PropTypes.object.isRequired
}

PracticeContactListItem.defaultProps = {
  address: null 
  , phoneNumber: null
}

export default withRouter(PracticeContactListItem);
