/**
 * Boilerplate code for a new Redux-connected view component.
 * Nice for copy/pasting
 */

// import primary libraries
import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link, NavLink, Switch, withRouter } from "react-router-dom";

// import third-party libraries
import _ from "lodash";
import classNames from "classnames";
import { DateTime } from "luxon";

// import actions

// import global components
import Binder from "../../../../global/components/Binder.js.jsx";
import Breadcrumbs from "../../../../global/components/navigation/Breadcrumbs.js.jsx";
import UnderlineNav from "../../../../global/components/navigation/UnderlineNav.js.jsx";

// import firm components
import PracticeLayout from "../../../../global/practice/components/PracticeLayout.js.jsx";

import * as enrollmentActions from "../../../payments/enrollment/EnrollmentActions";
import * as clientActions from '../../../client/clientActions';
import * as firmActions from '../../firmActions';

class FirmSettingsLayout extends Binder {
  constructor(props) {
    super(props);
    this.state = {};
    this._bind();
  }

  componentDidMount() {
    const { dispatch, match, loggedInUser } = this.props
    // use firmActions.fetchSingleIfNeeded
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    // dispatch(enrollmentActions.getMerchantStatus(match.params.firmId));
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal
  }

  render() {
    const { firmStore, location, match, merchantStore } = this.props;
    const selectedFirm = firmStore.selected.getItem();

    const staxUrl = selectedFirm && selectedFirm.staxUrl;
    // const staxUrl =
    //   (merchantStore.merchant &&
    //   merchantStore.merchant.data &&
    //   merchantStore.merchant.data.staxUrl) ? merchantStore.merchant.data.staxUrl : '';

    const links = [
      { path: `/firm/${match.params.firmId}/settings`, display: "Overview" },
      {
        path: `/firm/${match.params.firmId}/settings/staff`,
        display: "Members",
      },
      {
        path: `/firm/${match.params.firmId}/settings/tags`,
        display: "Custom Tags",
      },
      {
        path: `/firm/${match.params.firmId}/settings/advanced`,
        display: "Advanced Settings",
      },
      {
        path: `/firm/${match.params.firmId}/settings/folder-templates`,
        display: "Folder Templates",
      },
      {
        path: `/firm/${match.params.firmId}/settings/request-list`,
        display: "Request Lists",
      },
      // {
      //   path: `/firm/${match.params.firmId}/settings/services`,
      //   display: "Services",
      // },
      //, 
      // { 
      //   path:  `${staxUrl}`, display: "Electronic Payments" 
      // },
      {
        path: `/firm/${match.params.firmId}/settings/integrations`,
        display: "Integrations",
      },
      // {
      //   path: `/firm/${match.params.firmId}/settings/documents`,
      //   display: "Documents",
      // },
      // {
      //   path: `/firm/${match.params.firmId}/settings/group-permissions`,
      //   display: "Group Permissions",
      // }
      // {
      //   path: `/firm/${match.params.firmId}/settings/documents`,
      //   display: "Documents",
      // },
    ];

    return (
      <PracticeLayout isSidebarOpen={true}>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} />
              <div className="-btns"></div>
            </div>
          </div>
        </div>
        <div className="-mob-layout-ytcol100 yt-container fluid">
          <h1>
            {selectedFirm ? selectedFirm.name : <span className="loading" />}
          </h1>
          <div className="tab-bar-nav">
            <UnderlineNav links={links} classes="-firm-settings" />
          </div>
          {this.props.children}
        </div>
      </PracticeLayout>
    );
  }
}

FirmSettingsLayout.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

FirmSettingsLayout.defaultProps = {};

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    addressStore: store.address,
    clientStore: store.client,
    clientUserStore: store.clientUser,
    firmStore: store.firm,
    loggedInUser: store.user.loggedIn.user,
    staffStore: store.staff,
    staffClientStore: store.staffClient,
    userStore: store.user,
    merchantStore: store.merchant,
  };
};

export default withRouter(connect(mapStoreToProps)(FirmSettingsLayout));
