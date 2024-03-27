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

class UserTokenChecker extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, history, location } = this.props;

    const {loginUrl, userapitoken } = queryString.parse(decodeURIComponent(window.location.search));
    
    if(!!userapitoken) {
      dispatch(userActions.sendLoginUsertoken(userapitoken)).then((res) => {
        if(res.success) {
          if (loginUrl) {
            localStorage.setItem("loginUrl", loginUrl);
          }
          if(location.state.from && location.state.from.pathname) {
            window.location = location.state.from.pathname;
          } else if(this.props.isUserLayout){
            history.push('/')
          }
        }
      });
    }
  }

  render() {
    return null
  }
}

UserTokenChecker.propTypes = {
  isUserLayout: PropTypes.bool
}

UserTokenChecker.defaultProps = {
  isUserLayout: false
}

const mapStoreToProps = (store) => {
  return {}
}

export default withRouter(
  connect(
    mapStoreToProps
  )(UserTokenChecker)
);
