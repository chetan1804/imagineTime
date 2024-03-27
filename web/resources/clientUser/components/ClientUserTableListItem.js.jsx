
// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import third-party libraries
import classNames from 'classnames';
import { formatPhoneNumber } from 'react-phone-number-input'

// import moment from 'moment';
import { DateTime } from 'luxon';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import { CheckboxInput } from '../../../global/components/forms/';
import CloseWrapper from "../../../global/components/helpers/CloseWrapper.js.jsx";
import ContactFlag from '../../../global/components/helpers/ContactFlag.js.jsx';

import SingleClientUserOptions from '../practice/components/SingleClientUserOptions.js.jsx';

//import actions
import * as clientUserActions from "../clientUserActions";
import * as clientActions from "../../client/clientActions";

class ClientUserTableListItem extends Binder {
  constructor(props) {
    super(props);

    this.state = {
      singleClientUserDropDownOption: false
    }

    this._bind(
      '_handleCloseSingleClientUserOptions',
      '_setStatus',
      '_handleRemoveFromClient'
    )
  }

  _handleRemoveFromClient() {
    const { dispatch, clientUser, match } = this.props;
    let newClientUser = _.cloneDeep(clientUser); 
    newClientUser._client = ""; 
    newClientUser.firm = "";

    console.log("new client User", newClientUser);

    dispatch(clientUserActions.sendUpdateClientUser(newClientUser));
  }

  _handleCloseSingleClientUserOptions(e) {
    e.stopPropagation();
    this.setState({ singleClientUserDropDownOption: false });
  }

  _setStatus(status) {
    const { dispatch, clientUser, setSelectedClientUser } = this.props;
    let newClientUser = _.cloneDeep(clientUser); 
    newClientUser.status = status; 
    setSelectedClientUser();
    
    dispatch(clientUserActions.sendUpdateClientUserStatus(newClientUser)).then(res => {
      if (res.success && res.client) {
        dispatch(clientActions.updateSingleClientToMap({
          client: res.client
          , success: true
        }));
      }
    });
  }

  render() {
    const { addressStore
      , clientUser
      , match
      , phoneNumberStore
      , userMap
      , handleResendInvite
      , handleResetPassword
      , selectedContact
      , sendingReset
      , successReset
      , sendingInvite
      , successInvite
      , handleSelectedClientUser
      , checked
      , archived
      , setSelectedClientUser
    } = this.props;

    const { singleClientUserDropDownOption } = this.state;

    const user = userMap[clientUser._user]
    const phoneNumberList = phoneNumberStore.util.getList('_user', clientUser._user)
    const phoneNumber = user && user._primaryPhone ? phoneNumberStore.byId[user._primaryPhone] : phoneNumberList && phoneNumberList[0] ? phoneNumberList[0] : null;
    const addressList = addressStore.util.getList('_user', clientUser._user)
    const address = user && user._primaryAddress && addressStore.byId[user._primaryAddress] ? addressStore.byId[user._primaryAddress] : addressList && addressList[0] ? addressList[0] : null
    const isEmpty = !user || !clientUser;

    /**  README: since from bulk invite primary contact proceed to the process even primary email address is empty, 
    so I put in temporary email address 'hideme.ricblyz+@gmail.com', this temporary email should not display in user interface */
    const clientName = user ? user.username.match(/hideme.ricblyz/g) ? <em>n/a</em> : user.username : <em>n/a</em>;
    const displayName = user ? !user.firstname && !user.lastname ? clientName : `${user.firstname} ${user.lastname}` : "";
    const sentInviteButton = user && clientUser && user.firstLogin && (!clientUser.accessType || clientUser.accessType ===  "noinvitesent")
    
    let pNumber = phoneNumber && phoneNumber.number ? formatPhoneNumber(phoneNumber.number, 'National') ? formatPhoneNumber(phoneNumber.number, 'National') : phoneNumber.number : null;
    pNumber = pNumber && phoneNumber ? phoneNumber.extNumber ? `${pNumber} ${phoneNumber.extNumber}` : pNumber : <em>n/a</em>;

    return (
      isEmpty ?
      <div>Loading</div>
      :
      <tr>
        <td style={{ minWidth: 0 }}>
          <div style={{width: "25px", display: "inline-flex"}}>
            <CheckboxInput 
              name="clientuser"
              value={checked}
              checked={checked} 
              change={() => handleSelectedClientUser(clientUser._id)} />
          </div>
        </td>
        <td style={{ minWidth: 0 }}>
          <div className="-options" style={{cursor: "pointer"}} onClick={() => this.setState({ singleClientUserDropDownOption: true })}>
            <div style={{height: "100%", width: "100%"}}>
              <CloseWrapper
                isOpen={singleClientUserDropDownOption}
                closeAction={this._handleCloseSingleClientUserOptions}
              />
              <i className="far fa-ellipsis-v"></i>
              <SingleClientUserOptions
                isOpen={singleClientUserDropDownOption}
                setStatus={this._setStatus}
                singleClientUser={true}
                handleRemoveFromClient={this._handleRemoveFromClient}
                archived={archived}
              />
            </div>
          </div>
        </td>
        <td>
          {
            archived ? (
              displayName
            ) :
            <Link to={`${match.url}/quick-view/${user._id}`}>{displayName} ( <ContactFlag user={user} clientUser={clientUser} /> )</Link>
          }
          </td>
        <td>{clientName}</td>
        <td>{clientUser && clientUser.position ? clientUser.position : <em>n/a</em>}</td>
        <td>{pNumber}</td>
        <td>{address ? address.formatted_address : 'n/a'}</td>
        <td>
          {
            archived ? null : (
              <button className="yt-btn x-small" onClick={(e) => { 
                if(!sendingInvite && !successInvite)
                  handleResendInvite(user, clientUser);
              }} style={{ margin: '0 5px', padding: '7px 10px' }}>
              {
                sendingInvite && selectedContact === clientUser._user ? 
                <span><i className="far fa-spinner fa-spin"/> Sending...</span>
                :
                successInvite && selectedContact === clientUser._user ?
                <span><i className="fal fa-check" /> Success</span>
                :
                <span><i className="fal fa-paper-plane"/> 
                  { sentInviteButton ? " Send Invite" : " Resend Invite"}
                </span>
              }
              </button>
            )
          }
          {
            archived ? null : (
              <button className="yt-btn x-small" onClick={(e) => { 
                if(!sendingReset && !successReset)
                  handleResetPassword(user);
              }} style={{ margin: '0 5px', padding: '7px 10px' }}>
              {
                sendingReset && selectedContact === clientUser._user ? 
                <span><i className="far fa-spinner fa-spin"/> Sending...</span>
                :
                successReset && selectedContact === clientUser._user ?
                <span><i className="fal fa-check" /> Success</span>
                :
                <span><i className="fal fa-paper-plane"/> Reset Password</span>
              }
              </button>
            )
          }          
        </td>
      </tr>
    )
  }

}

ClientUserTableListItem.propTypes = {
  dispatch: PropTypes.func.isRequired
  , clientUser: PropTypes.object.isRequired
}

ClientUserTableListItem.defaultProps = {

}

const mapStoreToProps = (store) => {
  return {
    loggedInUser: store.user.loggedIn.user
    , addressStore: store.address
    , phoneNumberStore: store.phoneNumber
    , userMap: store.user.byId
  }
}

export default withRouter(connect(
  mapStoreToProps
)(ClientUserTableListItem));
