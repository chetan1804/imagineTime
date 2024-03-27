/**
 * Global AdminTopNav component.
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
import NotificationSocket from '../../../resources/notification/components/NotificationSocket.js.jsx';
import AdminMobileNav from './AdminMobileNav.js.jsx';

// import module components
import AdminModulesDropdown from './AdminModulesDropdown.js.jsx';
import brandingName from '../../enum/brandingName.js.jsx';


class AdminTopNav extends Binder {
  constructor(props, context) {
    super(props);
    this.state = {
      moreOpen: false
      , profileOpen: false
      , mobileOpen: false
    }
    this._bind(
      '_openMore'
      , '_openProfile'
      , '_closeDropdowns'
    );
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
      , profileOpen: false
    });
  }

  render() {
    const { loggedInUser } = this.props;
    const { profileOpen, mobileOpen, moreOpen } = this.state;

    let pictureUrl = '/img/defaults/profile.png';
    if(loggedInUser && loggedInUser.profilePicUrl) {
      pictureUrl = loggedInUser.profilePicUrl;
    }

    let profileImg = {backgroundImage: `url(${pictureUrl})`};

    return(
      <header className="header fixed admin-top-nav">
        <AdminMobileNav 
          isOpen={ mobileOpen } 
          closeAction={() => this.setState({mobileOpen: false})}
        />
        <NotificationSocket />
        <div className="topbar yt-container fluid">
          <CloseWrapper
            isOpen={(profileOpen || moreOpen)}
            closeAction={this._closeDropdowns}
          />
          <div className="titles">
            <div className="-desktop-only">
              <div className="nav-logo">
                <img src={brandingName.image.itAdminLogo} />
              </div>
            </div>
            <div className="-mobile-only -open-nav-icon" onClick={() => this.setState({mobileOpen: true})}>
              <i className="fal fa-lg fa-bars"/>
            </div>
          </div>
          <div className="actions">
            <div className="yt-row space-between center-vert">
              <ul className="navigation">
                <li className="-desktop-only">
                  <NavLink to="/admin" exact={true}>Dashboard</NavLink>
                </li>
                <li className="-desktop-only">
                  <NavLink to="/admin/firms" >Firms</NavLink>
                </li>
                <li className="-desktop-only">
                  <NavLink to="/admin/users" >Users</NavLink>
                </li>
                <li className="dropdown -desktop-only">
                  <span className="action-link" onClick={this._openMore}>Other resources  <i style={{marginLeft: '4px'}} className="-more-icon fas fa-caret-down"/></span>
                  <AdminModulesDropdown
                    close={this._closeDropdowns}
                    isOpen={this.state.moreOpen}
                  />
                </li>
              </ul>
              <ul className="navigation">
                { loggedInUser.username ?
                  <li className="dropdown">
                    <span className="action-link" onClick={this._openProfile}>
                      <ProfilePic user={loggedInUser}/>
                      <div className="-profile-info">
                        <small>{loggedInUser.firstname}</small>
                        <br/>
                        <small>{loggedInUser.username}</small>
                      </div>
                    </span>
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
      </header>
    )
  }

}

AdminTopNav.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  return {
    loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminTopNav)
);
