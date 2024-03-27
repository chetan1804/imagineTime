/**
 * This is a series of utilities to provide route protection for react-router
 * before the route is entered.
 *
 * TODO: Rework this so the user info is pulled from the store, not 'window'
 */

const Auth = {
  notAdmin() {
    return window.currentUser._id && window.currentUser.roles && window.currentUser.roles.indexOf('admin') < 0;
  }
  , notRole(role) {
    /**
     * change this so that we can check for currentUser.admin === true while also still checking for user roles if necessary
     */
    return window.currentUser._id && (!window.currentUser[role] || (window.currentUser.roles && window.currentUser.roles.indexOf(role) < 0));
  }
  , notLoggedIn() {
    return !window.currentUser._id;
  }
  , requireLogin(nextState, replace) {
    /**
     * Checks currentUser cookie to see that a logged in user exists for this
     * session.  If not, it re-routes them to the login page.
     */
    if (!window.currentUser._id) {
      // Login check failed. Re-route to login page.
      replace({
        pathname: '/user/login',
        state: { nextPathname: nextState.location.pathname }
      })
    }
  }
  , requireAdmin(nextState, replace) {
    /**
     * Checks currentUser cookie to see that a logged in user exists for this
     * session AND has a role of 'admin'.  If not, it re-routes them to the
     * login page. 
     */
    if (window.currentUser._id) {
      // Login check passed. Check for 'admin' role.
      if(window.currentUser.roles.indexOf('admin') < 0) {
        console.log('admin check failed');
        // 'admin' check failed. Send to login.
        replace({
          pathname: '/user/login',
          state: { nextPathname: nextState.location.pathname }
        })
      }
    } else {
      // Login check failed. Re-route to login page.
      replace({
        pathname: '/user/login',
        state: { nextPathname: nextState.location.pathname }
      })
    }
  }
  // More info here: https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
  , getHashFromString(string) {
    let hash = 0, i, chr;
    if (!string) return hash;
    for (i = 0; i < string.length; i++) {
      chr   = string.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }
}

export default Auth;
