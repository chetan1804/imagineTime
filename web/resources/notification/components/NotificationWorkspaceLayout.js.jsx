/**
 * Boilerplate code for a new Redux-connected view component.
 * Nice for copy/pasting
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, Switch, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import { Helmet } from 'react-helmet';
import classNames from 'classnames';
import { DateTime } from 'luxon';
import { permissions } from '../../../global/utils';

// import actions
import * as staffClientActions from '../../staffClient/staffClientActions';
import * as clientActions from '../../client/clientActions';
import * as staffActions from '../../staff/staffActions';
import * as userActions from '../../user/userActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import WorkspaceLayout from '../../client/practice/components/WorkspaceLayout.js.jsx';
import NotificationStaffClientForm from './NotificationStaffClientForm.js.jsx';

class NotificationWorkspaceLayout extends Binder {
    constructor(props) {
        super(props);
        this.state = {}
    }
    
    render() {
        return (
            <WorkspaceLayout>
                <Helmet><title>Workspace Notification</title></Helmet>
                <NotificationStaffClientForm/>
            </WorkspaceLayout>
        )
    }
}

NotificationWorkspaceLayout.propTypes = {
    dispatch: PropTypes.func.isRequired
}

NotificationWorkspaceLayout.defaultProps = {

}


const mapStoreToProps = (store, props) => {
    return {}
}

export default withRouter(
        connect(
        mapStoreToProps
    )(NotificationWorkspaceLayout)
);
