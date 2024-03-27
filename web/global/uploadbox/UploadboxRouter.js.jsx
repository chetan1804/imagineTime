import React from 'react';
import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom';

// import global components
import Binder from '../components/Binder.js.jsx';

// import views
import UploadboxUserLogin from './view/UploadboxUserLogin.js.jsx';
import UploadboxWelcome from './view/UploadboxWelcome.js.jsx';
import UploadboxUploadFile from './view/UploadboxUploadFiles.js.jsx';
import UploadboxRequestFileList from './view/UploadboxRequestFileList.js.jsx';
import UploadboxForgotPassword from './view/UploadboxForgotPassword.js.jsx';
import UploadboxUserAccountForward from './view/UploadboxUserAccountForward.js.jsx';
import UploadboxUserFimrAccountForward from './view/UploadboxUserFimrAccountForward.js.jsx';

// import components
import UploadboxLayout from './components/UploadboxLayout.js.jsx';
import UploadboxRoute from './components/UploadboxRoute.js.jsx';

import Auth from '../utils/auth';

class UploadboxRouter extends Binder {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <UploadboxLayout>
                <Router>
                    <Switch>
                        <Route exact path="/" component={UploadboxUserLogin} />
                        <Route exact path="/login" component={UploadboxUserLogin} />
                        <Route exact path="/forgot-password" component={UploadboxForgotPassword} />
                        <UploadboxRoute path="/account" component={UploadboxUserAccountForward} />
                        <UploadboxRoute path="/upload/:clientId" component={UploadboxRequestFileList} />
                        <UploadboxRoute path="/firm/:firmId" component={UploadboxUserFimrAccountForward} />
                    </Switch>
                </Router>
            </UploadboxLayout>
        )
    }
}

export default UploadboxRouter;