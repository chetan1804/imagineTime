/**
 * Wraps all non-admin User components in a default view wrapper
 * is a class in case you want some extra special logic...
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import queryString from 'query-string';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import actions
import * as userActions from '../userActions';
import * as firmActions from '../../firm/firmActions';
import * as clientActions from '../../client/clientActions';

class UserAutoLogoutForm extends Binder {
  constructor(props) {
    super(props);
    this._bind(
      '_handleBeforeunload'
    );
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this._handleBeforeunload);
    const { dispatch } = this.props;

    const { userapitoken } = queryString.parse(decodeURIComponent(window.location.search));

    let windowNames = JSON.parse(localStorage.getItem("windowNames"));

    console.log('user api token', userapitoken);

    if(!!userapitoken) return;
    
    if (windowNames && windowNames.length) {
      let mm = new Date().getTime();
      // remove from storage all milliseconds with 30 mins ago
      windowNames = windowNames.filter(item => !isNaN(item) ? window.name == item ? true : ((mm - item) / 60000 < 30) : false);
    } else {
      windowNames = [];
    }

    console.log('do logout');
    // set window name
    if (window && !window.name) {
      window.name = new Date().getTime();      
      if ((windowNames && windowNames.length === 0) || !windowNames && window.currentUser) {
        // logout
        window.currentUser = {};
        dispatch(userActions.sendLogout());
      }
    }
    
    if (!windowNames.includes(window.name)) {
      windowNames.push(window.name);
      localStorage.setItem("windowNames", JSON.stringify(windowNames));  
    }
  }

  componentWillUnmount(e) {
    window.addEventListener('beforeunload', this._handleBeforeunload)
  }

  _handleBeforeunload(e) {  
    // remove window name from localstorage
    let windowNames = JSON.parse(localStorage.getItem("windowNames"));
    if (!windowNames) {
      windowNames = [];
    }
    windowNames = windowNames.filter(item => item != window.name);
    localStorage.setItem("windowNames", JSON.stringify(windowNames));
  }

  render() {
    return null
  }
}

UserAutoLogoutForm.propTypes = {}

const mapStoreToProps = (store) => {
  return {}
}

export default withRouter(
  connect(
    mapStoreToProps
  )(UserAutoLogoutForm)
);
