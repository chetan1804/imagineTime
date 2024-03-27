/**
 * Global PortalTopNav component.
 */

// import primary libararies
import React from 'react';
import PropTypes from 'prop-types';
import { Link, NavLink, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import third-party libraries
import classNames from 'classnames';
import { DateTime } from 'luxon';

// import components
import Binder from '../../components/Binder.js.jsx';
import CloseWrapper from '../../components/helpers/CloseWrapper.js.jsx';
import ProfilePic from '../../components/navigation/ProfilePic.js.jsx';
import ProfileDropdown from '../../components/navigation/ProfileDropdown.js.jsx';

// import actions
import * as clientActions from '../../../resources/client/clientActions';
import * as notificationActions from '../../../resources/notification/notificationActions';


// import resource components
import PortalMobileNav from './PortalMobileNav.js.jsx';
import NotificationDropdown from '../../../resources/notification/components/NotificationDropdown.js.jsx';
import NotificationSocket from '../../../resources/notification/components/NotificationSocket.js.jsx'
import { routeUtils } from '../../utils/index.js';
import PortalSearchModal from './PortalSearchModal.js.jsx';
import brandingName from '../../enum/brandingName.js.jsx';

class PortalTopNav extends Binder {
  constructor(props, context) {
    super(props);
    const { match } = this.props;
    this.state = {
      mobileOpen: false 
      , moreOpen: false
      , notifOpen: false
      , profileOpen: false
      , searchOpen: false  
      , searchObj: {}
    }
    this._bind(
      '_openMore'
      , '_openProfile'
      , '_closeDropdowns'
      , '_dismissNotifications'
    );
  }

  componentDidMount() {
    const { dispatch, loggedInUser } = this.props;
    dispatch(notificationActions.fetchListIfNeeded('_user', loggedInUser._id))


    // // client search example - feel free to remove once actually working
    // let clientId = 1; 
    // let searchObj = {
    //   "value": "thing" // value is static, "thing" is the text you want to search. should probably be stored in the state.
    // }
    // let searchObjString = routeUtils.queryStringFromObject(searchObj)
    // // to execute, you need two queries, one for direct objects and the other for objects matching a text-searched Tag
    // // this is because these lists will be different and we might want to display them differently
    // // lists could also be combined when you display them if not
    // dispatch(clientActions.fetchListIfNeeded('search', clientId, 'by-objects', searchObjString))
    // dispatch(clientActions.fetchListIfNeeded('search', clientId, 'by-tags', searchObjString))

    // // then to pull out for display the listargs are the same as above for the individual resources

  }

  _openProfile() {
    this.setState({
      profileOpen: true
    });
  }

  _openMore() {
    this.setState({
      moreOpen: true
    });
  }

  _closeDropdowns() {
    this.setState({
      moreOpen: false
      , notifOpen: false 
      , profileOpen: false
    });
  }

  // NOTE: We can pass a single notification id or an array of ids (to facilitate 'dismiss all' functionality).
  _dismissNotifications(notificationId) {
    const { dispatch, notificationStore } = this.props;
    if(Array.isArray(notificationId)) {
      notificationId.forEach(notifId => {
        let newNotification = _.cloneDeep(notificationStore.byId[notifId]);
        newNotification.acknowledged = true;
        dispatch(notificationActions.sendUpdateNotification(newNotification));
      });
    } else if(typeof notificationId === 'number') {
      let newNotification = _.cloneDeep(notificationStore.byId[notificationId])
      newNotification.acknowledged = true;
      dispatch(notificationActions.sendUpdateNotification(newNotification));
    } else {
      console.error(`INVALID TYPE: ${typeof notificationId}. Expected number or array.`)
    }
    /**
     * TODO: Figure out how to dismiss notifications when a user navigates to the link without actually clicking the notification.
     * Possible method: on every navigation change, loop through loggedInUser's new notifications and see if location.pathname matches any of the notification links.
     */
  }

  render() {
    const { 
      clientStore
      , firmStore 
      , loggedInUser 
      , match
      , notificationStore
    } = this.props;
    let { profileOpen } = this.state;

    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();

    const notificationListItems = notificationStore.util.getList('_user', loggedInUser._id)
    const sortedNotificationListItems = notificationListItems ? notificationListItems.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) : null
    const newNotificationIds = notificationListItems ? notificationListItems.filter(notification => !notification.acknowledged).map(newNotif => newNotif._id) : null

    let firmLogo = brandingName.image.logoBlack;
    if(selectedFirm && selectedFirm._id && selectedFirm.logoUrl) {
      firmLogo = `/api/firms/logo/${selectedFirm._id}/${selectedFirm.logoUrl}`
    }

    const isFetching = (
      clientStore.selected.isFetching
      || firmStore.selected.isFetching
    )

    return(
      <header className="header fixed portal-top-nav">
        <PortalMobileNav 
          isOpen={this.state.mobileOpen} 
          closeAction={() => this.setState({mobileOpen: false})}
        />
        <div className="topbar yt-container fluid">
          <NotificationSocket />
          <CloseWrapper
            isOpen={(this.state.profileOpen || this.state.moreOpen || this.state.notifOpen)}
            closeAction={this._closeDropdowns}
          />
          <div className="titles">
            <div className="-desktop-only">
              <NavLink to="/" className="nav-logo" >
                { isFetching ? 
                  <div className="loading"></div>
                  :
                  <img src={firmLogo}/>
                }
              </NavLink>
            </div>
            <div className="-mobile-only -open-nav-icon" onClick={() => this.setState({mobileOpen: true})}>
              <i className="fal fa-lg fa-bars"/>
            </div>
          </div>
          <div className="actions">
            <div className="yt-row space-between center-vert">
              <ul className="navigation -left ">
                <li className="-desktop-only">
                  <NavLink to={`/portal/${match.params.clientId}/files`} >Files</NavLink>
                </li>
                <li className="-desktop-only">
                  <NavLink to={`/portal/${match.params.clientId}/dashboard`} >Dashboard</NavLink>
                </li>
                {/* <li className="-desktop-only">
                  <NavLink to={`/portal/${match.params.clientId}/client-workflows`}>My Workflows</NavLink>
                </li> */}
                <li className="-desktop-only">
                  <NavLink to={`/portal/${match.params.clientId}/quick-tasks`}>Quick Tasks</NavLink>
                </li>
                <li className="-desktop-only">
                  <NavLink to={`/portal/${match.params.clientId}/request`}>Request Lists</NavLink>
                </li>
                <li className="-desktop-only">
                  <NavLink to={`/portal/${match.params.clientId}/client-posts`} >Message Board</NavLink>
                </li>
                {/* <li className="-desktop-only">
                  <NavLink to={`/portal/${match.params.clientId}/invoices`} >Invoices</NavLink>
                </li>
                <li className="-desktop-only">
                  <NavLink to={`/portal/${match.params.clientId}/payments`} >Payments</NavLink>
                </li> */}
                <li className="-desktop-only">
                  <NavLink to={`/portal/${match.params.clientId}/account`} >Account</NavLink>
                </li>
              </ul>
              <ul className="navigation -tight">
                <li >
                  <span className="action-link" onClick={() => this.setState({searchOpen: true})}><i className="far fa-search"/></span>
                </li>
                <li className="dropdown">
                  <span className="action-link" onClick={() => this.setState({notifOpen: true})}>
                    <div className="-notification-icon -has-notifs">
                      <i className="fas fa-bell"/>
                      { newNotificationIds && newNotificationIds.length > 0 ?
                        <span className="-count">{newNotificationIds.length}</span>
                        :
                        null
                      }
                    </div>
                  </span>
                  <NotificationDropdown
                    close={this._closeDropdowns}
                    dismissNotifications={this._dismissNotifications}
                    isOpen={this.state.notifOpen}
                    notifications={sortedNotificationListItems}
                    newNotificationIds={newNotificationIds}
                  />
                </li>
                { loggedInUser.username ?
                  <li className="dropdown -desktop-only">
                    <div className="action-link" onClick={this._openProfile}>
                      <ProfilePic user={loggedInUser}/>
                      <div className="-profile-info">
                        <small>{loggedInUser.firstname}</small>
                        <br/>
                        <small>{selectedClient ? selectedClient.name : <i className="fal fa-spinner fa-spin"/>}</small>
                      </div>
                      <i className="far fa-angle-down"/>
                    </div>
                    <ProfileDropdown
                      close={this._closeDropdowns}
                      isOpen={this.state.profileOpen}
                    />
                  </li>
                  :
                  null
                }
              </ul>
            </div>
          </div>
        </div>
        <PortalSearchModal
          close={() => this.setState({searchOpen: false})}
          isOpen={this.state.searchOpen}
        />
      </header>
    )
  }

}

PortalTopNav.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  return {
    clientStore: store.client 
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , notificationStore: store.notification
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PortalTopNav)
);
