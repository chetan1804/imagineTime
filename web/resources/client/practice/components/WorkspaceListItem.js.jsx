// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';
import { formatPhoneNumber } from 'react-phone-number-input'

import { displayUtils } from '../../../../global/utils';

const WorkspaceListItem = ({
  address  
  , client
  , primaryContact 
  , phoneNumber 
}) => {

  /**  README: since from bulk invite primary contact proceed to the process even primary email address is empty, 
  so I put in temporary email address 'hideme.ricblyz+@gmail.com', this temporary email should not display in user interface */
  const clientName = primaryContact ? primaryContact.username.match(/hideme.ricblyz/g) ? <em>n/a</em> : primaryContact.username : <em>n/a</em>;

  return (
    <tr>
      <td data-label="Client Id">{client.identifier}</td>
      <td data-label="Client"><Link to={`/firm/${client._firm}/workspaces/${client._id}/files`}>{client.name}</Link></td>
      <td data-label="Primary Contact">{primaryContact ? `${primaryContact.firstname} ${primaryContact.lastname}` : <em>n/a</em> }</td>
      <td data-label="Email">{clientName}</td>
      <td data-label="Phone Number">{phoneNumber && phoneNumber.number ? formatPhoneNumber(phoneNumber.number, 'National') ? formatPhoneNumber(phoneNumber.number, 'National') : phoneNumber.number : <em>n/a</em> }</td>
      <td data-label="Address">{address ? `${address.street1 || ""} ${address.city || ""}${address.state ? `, ${address.state}` : ""}` : null }</td>
    </tr>
  )
}

WorkspaceListItem.propTypes = {
  address: PropTypes.object
  , client: PropTypes.object.isRequired
  , phoneNumber: PropTypes.object
  , primaryContact: PropTypes.object
}

WorkspaceListItem.defaultProps = {
  address: null 
  , phoneNumber: null
  , primaryContact: null 
}

export default WorkspaceListItem;
