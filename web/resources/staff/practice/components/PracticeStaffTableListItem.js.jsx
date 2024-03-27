
// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import moment from 'moment';
import { DateTime } from 'luxon';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import ProfilePic from '../../../user/components/ProfilePic.js.jsx';
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
class PracticeStaffTableListItem extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      addressStore
      , match
      , phoneNumberStore
      , staff
      , user
      , handleResendInvite
      , handleResetPassword
      , selectedStaff
      , sendingReset
      , successReset
      , sendingInvite
      , successInvite
      , deleteModal
    } = this.props;  

    const isEmpty = (
      !staff
      || !user
    )

    const userAddress = user && user._primaryAddress ? addressStore.byId[user._primaryAddress] : null;

    return (
      isEmpty ?
      <tr>
        <td colSpan="4">
          <i className="far fa-spinner fa-spin"/>  Loading...
        </td>
      </tr>
      :
      <tr className="-staff-item">
        <td>
          <div className="yt-row">
            <ProfilePic user={user} />
            <div className="yt-col">
              <Link to={`/firm/${staff._firm}/settings/staff/${staff._id}`}>{user ? `${user.firstname} ${user.lastname}` : 'loading'}</Link>
              <br/>
              <small>{user ? user.username : ''}</small>
            </div>
          </div>
        </td>
        <td>{staff.owner ? 'Owner' : 'Standard'}</td>
        <td>{_.startCase(staff.status)}</td>
        <td className="right">
          {
            <button className="yt-btn x-small" onClick={(e) => { 
              if(!sendingInvite && !successInvite)
                handleResendInvite(user, staff.owner);
            }}>
            {
              sendingInvite && selectedStaff === staff._user ? 
              <span><i className="far fa-spinner fa-spin"/> Sending...</span>
              :
              successInvite && selectedStaff === staff._user ?
              <span><i className="fal fa-check"/> Success</span>
              :
              <span><i className="fal fa-paper-plane"/> Resend Invite</span>                
            }
            </button>  
          }
          {
            <button className="yt-btn x-small" onClick={(e) => { 
              if(!sendingReset && !successReset)
                handleResetPassword(user, staff.owner);
            }} style={{ margin: '0 5px' }}>
            {
              sendingReset && selectedStaff === staff._user ? 
              <span><i className="far fa-spinner fa-spin"/> Sending...</span>
              :
              successReset && selectedStaff === staff._user ?
              <span><i className="fal fa-check" /> Success</span>
              :
              <span><i className="fal fa-paper-plane"/> Reset Password</span>
            }
            </button>
          }              
         
        </td>
        <td className="right"><Link to={`/firm/${staff._firm}/settings/staff/${staff._id}/update`}><i className="fal fa-cog"/></Link></td>
        <td className="right"><i class="far fa-trash-alt" style={{ color: staff.status === 'active' ? '#b2b2b2' : 'red', cursor: 'pointer', pointerEvents: staff.status === 'active' ? 'none' : '' }} onClick={() => deleteModal(staff)}></i></td>
      </tr>
    )
  }
}

PracticeStaffTableListItem.propTypes = {
  dispatch: PropTypes.func.isRequired
  , user: PropTypes.object
  , staff: PropTypes.object.isRequired
}

PracticeStaffTableListItem.defaultProps = {
  user: null 
}

const mapStoreToProps = (store) => {
  
  return {
    addressStore: store.address
    , loggedInUser: store.user.loggedIn.user
    , phoneNumberStore: store.phoneNumber
  }
}

export default withRouter(connect(
  mapStoreToProps
)(PracticeStaffTableListItem));
