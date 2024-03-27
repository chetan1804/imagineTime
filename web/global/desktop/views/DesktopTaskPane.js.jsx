import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';

import DesktopUserAccount from '../components/DesktopUserAccount.js.jsx';
import DesktopLayout from '../components/DesktopLayout.js.jsx';
import DesktopRoute from '../components/DesktopRoute.js.jsx';
import DesktopSettings from '../components/DesktopSettings.js.jsx';
import DesktopUploadFiles from '../components/DesktopUploadFiles.js.jsx';
import DesktopUserLogin from '../components/DesktopUserLogin.js.jsx';
import DesktopWelcome from '../components/DesktopWelcome.js.jsx';
import DesktopShareFiles from '../components/DesktopShareFiles.js.jsx';
import DesktopRequestSignatures from '../components/DesktopRequestSignatures.js.jsx';

const DesktopTaskPane = () => {
  return (
    <DesktopLayout>
      <Router>
        <Switch>
          <Route exact path="/" component={DesktopWelcome} />
          <Route exact path="/login" component={DesktopUserLogin} />
          <DesktopRoute path="/account" component={DesktopUserAccount} />
          <DesktopRoute path="/settings" component={DesktopSettings} />
          <DesktopRoute path="/share" component={DesktopShareFiles} />
          <DesktopRoute path="/upload" component={DesktopUploadFiles} />
          <DesktopRoute path="/signature" component={DesktopRequestSignatures} />
        </Switch>
      </Router>
    </DesktopLayout>
  )
}

export default DesktopTaskPane;
