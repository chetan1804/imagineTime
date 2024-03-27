/**
 * Sets up the routing for all non-admin User views.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../global/components/Binder.js.jsx';
import YTRoute from '../../global/components/routing/YTRoute.js.jsx';

// import user views
import ForgotPassword from './views/ForgotPassword.js.jsx';
import ResetPassword from './views/ResetPassword.js.jsx';
import UserAccountForward from './views/UserAccountForward.js.jsx';
import UserFinishWelcome from './portal/views/UserFinishWelcome.js.jsx';
import UserFinishSetPassword from './portal/views/UserFinishSetPassword.js.jsx';
import UserFinishReviewPersonal from './portal/views/UserFinishReviewPersonal.js.jsx';
import UserFinishReviewAccount from './portal/views/UserFinishReviewAccount.js.jsx';
import UserLogin from './views/UserLogin.js.jsx';
import UserProfile from './views/UserProfile.js.jsx';
import UserRegister from './views/UserRegister.js.jsx';

class UserRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute exact path="/user/login" component={UserLogin} />
        <YTRoute exact path="/user/register" component={UserRegister} />
        <YTRoute exact path="/user/forgot-password" component={ForgotPassword} />
        <YTRoute exact path="/user/reset-password/:hex" component={ResetPassword} />
        <YTRoute login={true} exact path="/user/finish/welcome/:clientId" component={UserFinishWelcome} />
        <YTRoute login={true} exact path="/user/finish/set-password/:clientId" component={UserFinishSetPassword} />
        <YTRoute login={true} exact path="/user/finish/review-personal/:clientId" component={UserFinishReviewPersonal} />        
        <YTRoute login={true} exact path="/user/finish/review-account/:clientId" component={UserFinishReviewAccount} />        
        <YTRoute login={true} exact path="/user/profile" component={UserProfile} />
        <YTRoute login={true} exact path="/user/forward" component={UserAccountForward} />
      </Switch>
    )
  }
}

export default UserRouter;
