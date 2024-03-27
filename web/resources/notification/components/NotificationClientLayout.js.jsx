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
import classNames from 'classnames';
import { DateTime } from 'luxon';
import { permissions } from '../../../global/utils';

// import actions
import * as staffClientActions from '../../staffClient/staffClientActions';
import * as clientActions from '../../client/clientActions';
import * as staffActions from '../../staff/staffActions';
import * as firmActions from '../../firm/firmActions';
import * as userActions from '../../user/userActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import ClientSettingsLayout from '../../client/practice/components/ClientSettingsLayout.js.jsx';
import NotificationStaffClientForm from './NotificationStaffClientForm.js.jsx';

class NotificationClientLayout extends Binder {
    constructor(props) {
        super(props);
        this.state = {}
    }

    componentDidMount() {
        const { dispatch, loggedInUser, match } = this.props;
        dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
        dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
        dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches contacts 
        dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
        dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
        dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    }

    render() {
        return (
            <ClientSettingsLayout>
                <NotificationStaffClientForm/>
            </ClientSettingsLayout>
        )
    }
}

NotificationClientLayout.propTypes = {
    dispatch: PropTypes.func.isRequired
}

NotificationClientLayout.defaultProps = {

}


const mapStoreToProps = (store, props) => {
    return {
        loggedInUser: store.user.loggedIn.user
    }
}

export default withRouter(
        connect(
        mapStoreToProps
    )(NotificationClientLayout)
);
