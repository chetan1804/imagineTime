import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route } from 'react-router-dom';

import Auth from '../../utils/auth';

const UploadboxRoute = ({ component: Component, path, ...props }) => {

  if (Auth.notLoggedIn() && path !== '/') {
    return (<Route {...props} render={() => (<Redirect to="/" />)} />);
  } else if (!Auth.notLoggedIn() && path === '/' && path !== '/account') {
    return (<Route {...props} render={() => (<Redirect to="/account" />)} />);
  } else {
    return <Component {...props} />
  }
};

UploadboxRoute.propTypes = {
  component: PropTypes.any.isRequired,
};

export default UploadboxRoute;
