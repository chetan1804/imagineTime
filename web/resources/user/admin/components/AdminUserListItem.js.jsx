// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';

// import other libraries
import { DateTime } from 'luxon';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';

class AdminUserListItem extends Binder {
  constructor(props) {
    super(props);
  }

  _goToUser(userId) {
    this.props.history.push(`/admin/users/${userId}`)
  }

  render() {
    const { user } = this.props;
    return (
      <tr className="linkable" onClick={this._goToUser.bind(this, user._id)}>
        <td>{user.firstname} {user.lastname}</td>
        <td>{user.username}</td>
        <td>{user.roles}</td>
        <td>{user.enable_2fa ? <b style={{color: 'green'}}>On</b> : <b style={{color: 'red'}}>Off</b>}</td>
        <td className="numbers">{DateTime.fromISO(user.updated_at).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      </tr>
    )
  }
}

AdminUserListItem.propTypes = {
  user: PropTypes.object.isRequired
}

export default withRouter(AdminUserListItem);
