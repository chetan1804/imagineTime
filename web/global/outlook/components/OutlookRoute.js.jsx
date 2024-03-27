import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route } from 'react-router-dom';

import Auth from '../../utils/auth';

const OutlookRoute = ({ component: Component, path, ...props }) => {
  if (Auth.notLoggedIn() && path !== '/') {
    return (<Route {...props} render={() => (<Redirect to="/" />)} />);
  }

  // Check if the user has onboarded and selected a firm/staff
  const storage = JSON.parse(localStorage.getItem('emitenigami'));

  if ((!storage || !storage.selectedStaffId) && path !== '/account') {
    return (<Route {...props} render={() => (<Redirect to="/account" />)} />);
  }

  return <Component {...props} selectedStaffId={storage ? storage.selectedStaffId : null}/>
};

OutlookRoute.propTypes = {
  component: PropTypes.any.isRequired,
};

export default OutlookRoute;
