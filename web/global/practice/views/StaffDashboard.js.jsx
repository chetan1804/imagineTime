/**
 * Living style-guide for this Yote application
 *
 * TODO:  This needs a lot of work
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, Route, Switch, withRouter } from 'react-router-dom';

import { DateTime } from 'luxon';

// import global components
import Binder from '../../components/Binder.js.jsx';
import YTRoute from '../../components/routing/YTRoute.js.jsx';

// import admin components
import PracticeLayout from '../components/PracticeLayout.js.jsx';

// import actions
import * as activityActions from '../../../resources/activity/activityActions';
import * as clientActions from '../../../resources/client/clientActions';
import * as firmActions from '../../../resources/firm/firmActions';
import * as staffActions from '../../../resources/staff/staffActions';
import * as clientWorkflowActions from '../../../resources/clientWorkflow/clientWorkflowActions';
import * as userActions from '../../../resources/user/userActions';

class StaffDashboard extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props; 
    dispatch(activityActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(clientWorkflowActions.fetchListIfNeeded('_user', loggedInUser._id));
    dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId));
  }

  render() {
    return  (
      <PracticeLayout>
        <h3> Staff Dashboard </h3>
        <hr/>
        Coming Soon
      </PracticeLayout>
    )
  }
}


StaffDashboard.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  return {
    clientStore: store.client 
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(StaffDashboard)
);
