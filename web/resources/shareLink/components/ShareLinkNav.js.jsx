/**
 * Global DefaultTopNav component.
 */

// import primary libararies
import React from 'react';
import PropTypes from 'prop-types';
import { NavLink, Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import third-party libraries
import classNames from 'classnames';

// import components
import Binder from '../../../global/components/Binder.js.jsx';
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';
import ProfilePic from '../../../global/components/navigation/ProfilePic.js.jsx';
import ProfileDropdown from '../../../global/components/navigation/ProfileDropdown.js.jsx';
import brandingName from '../../../global/enum/brandingName.js.jsx';

class DefaultTopNav extends Binder {
  constructor(props, context) {
    super(props);
    this.state = {
      profileOpen: false
      , scrollingDown: false
      , isTop: true
    }
    this._bind(
      '_handleScroll'
    );
  }

  componentWillMount() {
    window.addEventListener('scroll', this._handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this._handleScroll);
  }

  _handleScroll(e) {
    /**
     * When the page scrolls, check the Y position to determine whether to
     * hide, show or fade in DefaultTopNav.
     *
     * @param e = broswer scroll event
     */
    if(!this.props.fancyScroll) {
      return false;
    }

    let scrollTop;
    if(e.target.scrollingElement) {
      scrollTop = e.target.scrollingElement.scrollTop;
    } else {
      scrollTop = document.documentElement.scrollTop;
    }

    // handle initial position
    let isTop = scrollTop < 20 ? true : false;
    if(isTop !== this.state.isTop) {
      this.setState({isTop: isTop});
    }

    // if the page is scrolled down, change the navbar style
    var scrollingDown;
    if ( typeof this._handleScroll.y == undefined ) {
      this._handleScroll.y=window.pageYOffset;
      scrollingDown = false;
    }

    // check last position vs current position
    var diffY=this._handleScroll.y-window.pageYOffset;

    // check the direction of the scroll
    if( diffY<0 ) {
      // Page is scrolling down
      scrollingDown = true;
    } else if( diffY>0 ) {
      // Page is scrolling up
      scrollingDown = false;
    }

    // tell the State about the scroll direction
    if(scrollingDown !== undefined && scrollingDown != this.state.scrollingDown) {
      this.setState({scrollingDown: scrollingDown});
    }

    // set the function's XY position to the current position
    this._handleScroll.x=window.pageXOffset;
    this._handleScroll.y=window.pageYOffset;
  }

  render() {
    let { 
      clientStore
      , firmStore 
      , loggedInUser 
      , match
      , notificationStore
    } = this.props;
    let { profileOpen } = this.state;

    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();

    let pictureUrl = '/img/defaults/profile.png';
    if(loggedInUser && loggedInUser.profilePicUrl) {
      pictureUrl = loggedInUser.profilePicUrl;
    }

    let profileImg = { backgroundImage: `url(${pictureUrl})` };

    let firmLogo = brandingName.image.icon;
    if(selectedFirm && selectedFirm._id && selectedFirm.logoUrl) {
      firmLogo = `/api/firms/logo/${selectedFirm._id}/${selectedFirm.logoUrl}`
    }

    return(
      <header className="header tall fixed no-border default-nav">
        <div className="yt-container fluid">
          <CloseWrapper
            isOpen={this.state.profileOpen}
            closeAction={() => this.setState({profileOpen: false})}
          />
          <div className="yt-row center-vert space-between">
            <NavLink to="/" className="nav-logo" >
              {firmStore.selected.isFetching ? 
                <div className="loading"></div>
                :
                <img src={firmLogo}/>
              }
            </NavLink>
            <div className="actions">
              <div className="yt-row center-vert right">
                <ul className="navigation">
                  { loggedInUser && loggedInUser._id ?
                    <li className="dropdown">
                      <Link to="/" className="action-link" >
                        <ProfilePic user={loggedInUser}/>
                        <div className="-profile-info">
                          <small>{loggedInUser.firstname} {loggedInUser.lastname}  </small>
                        </div>
                      </Link>
                    </li>
                    :
                    null
                  }
                </ul>
                {!loggedInUser.username ?
                  <div className="navigation">
                    <NavLink to="/user/login" className="yt-btn link small link info">Sign In</NavLink>
                  </div>
                  :
                  null
                }
              </div>
            </div>
          </div>
        </div>
      </header>
    )
  }

}

DefaultTopNav.propTypes = {
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
  )(DefaultTopNav)
);
