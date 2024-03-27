/**
 * Helper component to create a Link to a specific role-protected page (like "admin")
 */

// import primary libraries
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { Redirect, Route, withRouter } from 'react-router-dom';

import _ from 'lodash';
import omit from 'lodash/omit';

import Auth from '../../utils/auth';
import permissions from '../../utils/permissions';

class YTRoute extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      breadcrumbs
      , clientUser // NOTE: Boolean 
      , clientUserStore
      , history
      , location
      , loggedInClientUser 
      , loggedInUser
      , loggedInStaff
      , login
      , match
      , role
      , staff // NOTE: Boolean 
      , staffStore
      , staffOwner // NOTE: Boolean 
    } = this.props;

    let newLocation = location;
    if(!newLocation.state) {
      newLocation.state = {}
    }
    newLocation.state.breadcrumbs = breadcrumbs;
    const props = _.omit(this.props, [
      'location'
    ]);

    /**
     * Check the route permission requirements. If user does not have permission to access the route, this will redirect them
     * before anything tries to render (i.e. even before any fetches are attempted). 
     * 
     * NOTE: On first render, with staffStore or clientUserStore being empty, the staff/clientUser evaluations below will 
     * evaluate false and return the next block.
     * As soon as the store populates, this component will rerender. Then if the user does not have permission the block
     * will evaluate to true and they'll be redirected to root, where they'll be forwarded to a view that they
     * are allowed to see.
     */

    const queryString = window.location.search ? window.location.search : '';

    if((role || login) && Auth.notLoggedIn()) {
      
      /**
       * This route requires login, but user is not logged in. Redirect to login page. 
       */

      //Redirect to login url of the application that connects to our service using the userapitoken
       let loginUrl = localStorage.getItem("loginUrl");
       if (loginUrl) {
         return window.location.replace(loginUrl);
       }

      return <Redirect to={{pathname: `/user/login`, search: queryString, state: { from: location }}}/>
    } else if(role && Auth.notRole(role)) {
      /**
       * This route requires admin permissions, but this user is not an admin. Show them unauthorized page. 
       */
      return <Redirect to={{pathname: "/unauthorized"}}/>
    } else if(staffOwner && loggedInUser && loggedInStaff && !permissions.isStaffOwner(staffStore, loggedInUser, match.params.firmId)) {
      /**
       * This route requires a logged in user who is a staff owner of this firm.  
       * However, this user is not a staff owner. Redirect to UserAccountFoward where they can try to go somehwere they're allowed. 
       */
      return <Redirect to={{pathname: `/user/forward`, search: queryString, state: { from: location }}}/>
    } else if(staff && loggedInUser && loggedInStaff && !permissions.isStaff(staffStore, loggedInUser, match.params.firmId)) {
      /**
       * This route requires a logged in user who is an active staff member of this firm.  
       * However, this user is not an active staff member. Redirect to UserAccountFoward where they can try to go somehwere they're allowed. 
       */
      return <Redirect to={{pathname: `/user/forward`, search: queryString, state: { from: location }}}/>
    } else if(clientUser && loggedInUser && loggedInClientUser && !permissions.isClientUser(clientUserStore, loggedInUser, match.params.clientId)) {
      /**
       * This route rquires a logged in user who is an active clientUser (a.k.a. 'contact') of this client. 
       * However, this user is not an active clientUser. Redirect to UserAccountFoward where they can try to go somehwere they're allowed.  
       */
      return <Redirect to={{pathname: `/user/forward`, search: queryString, state: { from: location }}}/>
    } else {
      /**
       * This user can go where they're trying to go.  
       */
      return <Route {...props} location={newLocation}/>
    }
  }
}

YTRoute.propTypes = {
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      display: PropTypes.string
      , path: PropTypes.string
    })
  )
  , clientUser: PropTypes.bool 
  , login: PropTypes.bool
  , role: PropTypes.string
  , staff: PropTypes.bool 
  , staffOwner: PropTypes.bool
}

YTRoute.defaultProps = {
  breadcrumbs: []
  // , clientUser: false 
  , login: false
  , role: null
  // , staff: false 
  , staffOwner: false
}

const mapStoreToProps = (store, props) => {

  return {
    loggedInUser: store.user.loggedIn.user
    , staffStore: store.staff
    // Add loggedInStaff here so we don't end up in an infinite redirect loop caused by redirecting before loggedInStaff is populated.
    , loggedInStaff: store.staff && store.staff.loggedInByFirm && store.staff.loggedInByFirm[props.match.params.firmId] && store.staff.loggedInByFirm[props.match.params.firmId].staff
    
    /**
     * NOTE: Adding in clientUser checks 
     */ 
    , clientUserStore: store.clientUser 
    // Add loggedInClient here so we don't end up in an infinite redirect loop caused by redirecting before loggedInClient is populated.    
    , loggedInClientUser: store.clientUser && store.clientUser.loggedInByClient && store.clientUser.loggedInByClient[props.match.params.clientId] && store.clientUser.loggedInByClient[props.match.params.clientId].clientUser 
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(YTRoute)
);
