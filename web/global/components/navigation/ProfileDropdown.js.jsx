/**
 * Basic dropdown navigation menu to be used with default global TopNav
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import actions
import * as userActions from '../../../resources/user/userActions';

// import components
import Binder from '../Binder.js.jsx';

import permissions from '../../utils/permissions.js';

class PortalProfileDropdown extends Binder {
  constructor(props) {
    super(props);
    this._bind(
      '_logout'
    )
  }

  _logout(e) {
    const { dispatch, history } = this.props;
    dispatch(userActions.sendLogout()).then((action) => {
      if(action.success) {
        // redirect to index
        localStorage.clear();
        history.push('/');
      } else {
        alert("ERROR LOGGING OUT - " + action.message);
      }
    })
  }

  render() {
    const { 
      clientStore 
      , close
      , isOpen
      , loggedInUser
      , staffStore
      , match
    } = this.props;

    let pictureUrl = '/img/defaults/profile.png';
    if(loggedInUser && loggedInUser.profilePicUrl) {
      pictureUrl = loggedInUser.profilePicUrl;
    }

    let profileImg = {backgroundImage: `url(${pictureUrl})`};

    const clients = clientStore.util.getList('_user', loggedInUser._id);
    const isFirmStaff = permissions.isStaff(staffStore, loggedInUser, match.params.firmId);
    // console.log("debug1 clients", clients)

    return(
      <TransitionGroup >
        {isOpen ?
          <CSSTransition
            classNames="dropdown-anim"
            timeout={250}
          >
          <ul className="dropMenu">
            <div>
              { (clients && clients.length > 1) || isFirmStaff ?
                <li><Link to="/user/forward" onClick={() => close()}>Switch accounts </Link></li>
                :
                null 
              }
              <li><Link to="/user/profile" onClick={()=> close()}>My Profile </Link></li>

              { loggedInUser.admin || (loggedInUser.roles && loggedInUser.roles.indexOf('admin') > -1)
                ?
                <li><Link to="/admin" target="_blank" onClick={()=> close()}> Go to Admin <i className="fa fa-external-link"/> </Link></li>
                : ''
              }
              <li role="separator" className="-divider"/>
              <li><a onClick={this._logout}>Logout</a></li>
            </div>
          </ul>
          </CSSTransition>
          :
          null
        }
      </TransitionGroup>
    )
  }
}

PortalProfileDropdown.propTypes = {
  close: PropTypes.func.isRequired
  , dispatch: PropTypes.func.isRequired
  , isOpen: PropTypes.bool.isRequired
}

const mapStoreToProps = (store) => {
  return {
    clientStore: store.client 
    , loggedInUser: store.user.loggedIn.user
    , staffStore: store.staff
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PortalProfileDropdown)
);
