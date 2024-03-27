/**
 * Global PracticeTopNav component.
 */

// import primary libararies
import React from 'react';
import PropTypes from 'prop-types';
import { Link, NavLink, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import third-party libraries
import classNames from 'classnames';

// import components
import Binder from '../../components/Binder.js.jsx';
import CloseWrapper from '../../components/helpers/CloseWrapper.js.jsx';
import ProfilePic from '../../components/navigation/ProfilePic.js.jsx';
import ProfileDropdown from '../../components/navigation/ProfileDropdown.js.jsx';
import brandingName from '../../enum/brandingName.js.jsx';

// import resource components
import PracticeMagicSearchBox from './PracticeMagicSearchBox.js.jsx';
import NotificationDropdown from '../../../resources/notification/components/NotificationDropdown.js.jsx';
import NotificationSocket from '../../../resources/notification/components/NotificationSocket.js.jsx';
import PracticeUploadProgress from './PracticeUploadProgress.js.jsx';
import PracticeProgress from './PracticeProgress.js.jsx';

// import actions
import * as notificationActions from '../../../resources/notification/notificationActions';

// import components
import PracticeMobileNav from './PracticeMobileNav.js.jsx';

class PracticeTopNav extends Binder {
  constructor(props, context) {
    super(props);
    const { match } = this.props;
    this.state = {
      menuOpen: false 
      , moreOpen: false
      , notifOpen: false
      , profileOpen: false
      , uploadOpen: false
      , mobileMenuOpen: false
      , progress: false
      , salesForceLauncherIcon: localStorage.getItem('salesForceLauncherIcon')
    }
    this._bind(
      '_openMore'
      , '_openProfile'
      , '_closeDropdowns'
      , '_dismissNotifications'
      , '_handleSetIntercom'
    );
  }

  componentDidMount() {
    const { dispatch, loggedInUser } = this.props;
    dispatch(notificationActions.fetchListIfNeeded('_user', loggedInUser._id));
    this._handleSetIntercom(this.state.intercomLauncherIcon);
  }
  
  _handleSetIntercom(salesForceLauncherIcon) {
    localStorage.setItem('salesForceLauncherIcon', salesForceLauncherIcon);
    this.setState({ salesForceLauncherIcon }, () => {
      let salesForceHelpContainer = document.getElementsByClassName("embeddedServiceHelpButton") && document.getElementsByClassName("embeddedServiceHelpButton")[0];

      let salesForceSidebarContainer = document.getElementsByClassName("embeddedServiceSidebar") && document.getElementsByClassName("embeddedServiceSidebar")[0];

      console.log("salesForceHelpContainer", salesForceHelpContainer);
      console.log("salesForceSidebarContainer", salesForceSidebarContainer);

      if (salesForceHelpContainer && !salesForceSidebarContainer) {
        if (salesForceLauncherIcon === "disabled") {
          salesForceHelpContainer.style.display = 'none';
        } else {
          salesForceHelpContainer.style.display = 'block';
        }
      }
      
      if (salesForceSidebarContainer) {
        if (salesForceLauncherIcon === "disabled") {
          salesForceSidebarContainer.style.display = 'none';
        } else {
          salesForceSidebarContainer.style.display = 'block';
        }
      }
      
    });
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
    console.log("close all dropdowns")
    this.setState({
      moreOpen: false
      , notifOpen: false
      , profileOpen: false
      , uploadOpen: false
      , progress: false
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
    let { 
      clientStore
      , firmStore
      , loggedInUser
      , match
      , notificationStore
      , isSidebarOpen
      , toggleSidebar
    } = this.props;
    const { 
      profileOpen
      , mobileMenuOpen
      , salesForceLauncherIcon
    } = this.state;

    const selectedFirm = firmStore.selected.getItem();

    const notificationListItems = notificationStore.util.getList('_user', loggedInUser._id)
    const sortedNotificationListItems = notificationListItems ? notificationListItems.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) : null
    const newNotificationIds = notificationListItems ? notificationListItems.filter(notification => !notification.acknowledged).map(newNotif => newNotif._id) : null

    const isFetching = (
      clientStore.selected.isFetching
      || firmStore.selected.isFetching
    )

    const headerClass = classNames(
      'header fixed practice-top-nav'
      , {
        '-sidebar-open': isSidebarOpen
      }
    )

    const notifClass = classNames(
      '-notification-icon'
      , {
        '-has-notifs': newNotificationIds && newNotificationIds.length > 0
      } 
    )
    return(
      <header className={headerClass}>
        <PracticeMobileNav 
          isOpen={mobileMenuOpen} 
          closeAction={() => this.setState({ mobileMenuOpen: false })}
        />
        <div className="topbar yt-container fluid">
          <NotificationSocket />
          <CloseWrapper
            isOpen={(this.state.profileOpen || this.state.moreOpen || this.state.notifOpen || this.state.uploadOpen || this.state.progress)}
            closeAction={this._closeDropdowns}
          />
          <div className="titles">
            <div className="-desktop-layout -open-nav-icon" onClick={() => toggleSidebar()}>
              <i className="fal fa-align-left"/>
            </div>
            <div className="-mobile-layout -open-nav-icon" onClick={() => this.setState({ mobileMenuOpen: true })}>
              <i className="fal fa-lg fa-bars"/>
            </div>
          </div>
          <div className="actions">
            <div className="yt-row space-between center-vert">
              <PracticeMagicSearchBox/>
              <ul className="navigation -tight">
                <li className="dropdown">
                  <PracticeUploadProgress
                    close={this._closeDropdowns}
                    isOpen={this.state.uploadOpen}
                    openAction={() => this.setState({uploadOpen: true })}
                  />
                  <PracticeProgress
                    close={this._closeDropdowns}
                    isOpen={this.state.progress}
                    openAction={() => this.setState({ progress: true })}
                  />
                </li>
                <li className="dropdown -notification-icon-padding">
                  <span className="action-link" onClick={() => this.setState({notifOpen: true})}>
                    <div className={notifClass} style={{ marginTop: "9px" }}>
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
                    // notifications={this.state.sampleNotifications}
                    isOpen={this.state.notifOpen}
                    notifications={sortedNotificationListItems}
                    newNotificationIds={newNotificationIds}
                  />
                </li>

                <li>
                  <div className={`-intercom-handle-container ${salesForceLauncherIcon === "disabled" ? "" : "-active"}`} onClick={this._handleSetIntercom.bind(this, salesForceLauncherIcon === "disabled" ? "enabled" : "disabled")}>
                    <i id="salesForceLogo" class="far fa-comment-dots"></i>
                  </div>
                </li>

                { loggedInUser.username ?
                  <li className="dropdown -desktop-only" style={{ marginLeft: "22px" }}>

                    <div className="action-link" onClick={this._openProfile}>
                      <ProfilePic user={loggedInUser}/>
                      <div className="-profile-info">
                        <small>{loggedInUser.firstname}</small>
                        <br/>
                        <small>{selectedFirm ? selectedFirm.name : <i className="fal fa-spinner fa-spin"/>}</small>
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
                {
                  brandingName.desk.supportUrl ? 
                  <li className="tooltip ">
                    <a href={brandingName.desk.supportUrl} target="_blank">
                      <i className="fal fa-question-circle"/>
                    </a>
                    <div className="-tip-text -bottom-right -nav-tip-text">
                      Have a question?
                      <br/>
                      <a href={brandingName.desk.supportUrl} target="_blank">
                        Vist the helpdesk  <i style={{marginLeft: '4px'}} className="fal fa-external-link fa-sm"/>
                      </a>
                    </div>
                  </li>
                  : null
                }  
              </ul>
            </div>
          </div>
        </div>
      </header>
    )
  }

}

PracticeTopNav.propTypes = {
  dispatch: PropTypes.func.isRequired
  , isSidebarOpen: PropTypes.bool.isRequired
  , toggleSidebar: PropTypes.func.isRequired
}

PracticeTopNav.defaultProps = {
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
  )(PracticeTopNav)
);