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

// import third-party libraries
import { DateTime } from 'luxon';
import { Helmet } from 'react-helmet';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import firm components
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';


// import actions
import * as clientActions from '../../../client/clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../userActions';

class PracticeContactDetails extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      page: '1'
      , per: '50'
      , queryText: ''
      , sortBy: 'name'
    };
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props; 
    // get stuff for global nav 
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));

    // get stuff for this view 
    dispatch(clientActions.fetchListIfNeeded('_user', match.params.userId));
    dispatch(clientUserActions.fetchListIfNeeded('_user', match.params.userId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches clientUser/contacts 
    dispatch(userActions.fetchSingleIfNeeded(match.params.userId));
  }

  render() {
    const { 
      clientUserStore 
      , firmStore 
      , location
      , match
      , userStore 
    } = this.props;

    const selectedFirm = firmStore.selected.getItem();
    const selectedUser = userStore.selected.getItem();

    const clientUserList = clientUserStore.lists && clientUserStore.lists._user ? clientUserStore.lists._user[match.params.userId] : null;
    const clientUserListItems = clientUserStore.util.getList('_user', match.params.userId);

    const isEmpty = (
      !clientUserListItems
      || !clientUserList
      || firmStore.selected.didInvalidate
      || !selectedFirm
      || !selectedFirm._id
      || userStore.selected.didInvalidate
      || !selectedUser
      || !selectedUser._id
    );

    const isFetching = (
      !clientUserListItems
      || !clientUserList
      || clientUserList.isFetching
      || firmStore.selected.isFetching
      || userStore.selected.isFetching
    )
    return  (
      <PracticeLayout isSidebarOpen={true}>
        <Helmet>
          <title>Contact Details </title>
        </Helmet>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} />
            </div>
          </div>
        </div>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div> 
            : 
            <div className="hero -empty-hero">
              <div className="u-centerText">
                <p>Empty. </p>
              </div>
            </div>
          )
          :
          <div className="yt-container fluid" style={{ opacity: isFetching ? 0.5 : 1, height: '200vh' }}>
            <h1>contact: {selectedUser.username}</h1>
          </div>
        }
      </PracticeLayout>
    )
  }
}


PracticeContactDetails.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  return {
    clientUserStore: store.clientUser 
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , userStore: store.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeContactDetails)
);
