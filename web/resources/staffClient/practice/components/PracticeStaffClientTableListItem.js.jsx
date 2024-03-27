
// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import moment from 'moment';
import { DateTime } from 'luxon';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import { CheckboxInput } from '../../../../global/components/forms';

class PracticeStaffClientTableListItem extends Binder {
  constructor(props) {
    super(props);
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   if(this.props.staff && this.props.staff._id && nextProps.staff && nextProps.staff._id) {
  //     return true;
  //   }
  //   return false;
  // }

  render() {
    const { match, staffClient, staff, user, handleSelectedStaff, checked } = this.props;
    const isEmpty = (
      !staff
      || !user
    )
    return (
      isEmpty ?
      <tr>
        <td colSpan="4">
          <i className="fal fa-spinner fa-spin"/>
          Loading...
        </td>
      </tr>
      :
      <tr className="-staff-item">
      <td>
        <div style={{width: "25px", display: "inline-flex"}}>
          <CheckboxInput 
            name="staff"
            value={checked}
            checked={checked} 
            change={() => handleSelectedStaff(staffClient._id)} 
          />
        </div>
      </td>
        <td>
          <div className="-staff-info">
            <Link className="-name" to={`${match.url}/${staff._id}`}>
              {`${user.firstname} ${user.lastname}`}
            </Link>
          </div>
        </td>
        <td>{user.username}</td>
        <td>{staff && staff.owner ? "Owner" : "Standard"}</td>
        <td>{staff && staff.status}</td>
        <td>{DateTime.fromISO(staffClient.created_at).toLocaleString(DateTime.DATE_SHORT)}</td>
        <td></td>
        <td></td>
        </tr>
    )
  }

}

PracticeStaffClientTableListItem.propTypes = {
  dispatch: PropTypes.func.isRequired
  , user: PropTypes.object
  , staff: PropTypes.object.isRequired
}

PracticeStaffClientTableListItem.defaultProps = {
  user: null 
}

const mapStoreToProps = (store) => {
  
  return {
    noteMap: store.note.byId
    , loggedInUser: store.user.loggedIn.user
    , tagStore: store.tag
    , clientWorkflowStore: store.clientWorkflow
    , userStore: store.user 
  }
}

export default withRouter(connect(
  mapStoreToProps
)(PracticeStaffClientTableListItem));
