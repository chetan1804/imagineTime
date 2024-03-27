/**
 * Wrap all admin children in this special admin layout
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route, Switch, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import global components
import Binder from '../../components/Binder.js.jsx';
import brandingName from '../../enum/brandingName.js.jsx';


// import admin components
import PortalFooter from './PortalFooter.js.jsx';
import PortalTopNav from './PortalTopNav.js.jsx';

import UserAutoLogoutForm from '../../../resources/user/components/UserAutoLogoutForm.js.jsx';
import UserTokenChecker from '../../../resources/user/components/UserTokenChecker.js.jsx';

// import actions
import * as clientActions from '../../../resources/client/clientActions';

class PortalLayout extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    // dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
  }

  render() {
    const { clientStore } = this.props;
    const isFetching = clientStore.selected.isFetching;
    const selectedClient = clientStore.selected.getItem();

    if (selectedClient && selectedClient.status === 'deleted') {
      return (
        <div className="hero three-quarter ">
            <div className="yt-container slim">
                <h2>The client has been deleted.</h2>
                <p>Please contact <a href={`mailto:${brandingName.email.support}`}>{brandingName.email.support}</a>.</p>
            </div>
        </div>
      )
    } else if (isFetching) {
      return (
        <div className="-loading-hero hero">
          <div className="u-centerText">
            <div className="loading"></div>
          </div>
        </div>
      )
    }

    return (
      <div className="master-layout portal-layout">
        {/* <UserAutoLogoutForm /> */}
        <UserTokenChecker />
        <PortalTopNav/>
        <div className="body -portal-body">
          <div className="yt-container">
            {this.props.children}
          </div>
        </div>
        <PortalFooter/>
      </div>
    )
  }
}

PortalLayout.propTypes = {}

const mapStoreToProps = (store) => {
  return {
    clientStore: store.client 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PortalLayout)
);
