import React from "react";
import PropTypes from "prop-types";
import { NavLink, withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { CSSTransition, TransitionGroup } from "react-transition-group";
// import global components

import Binder from "../../components/Binder.js.jsx";
import AlertModal from "../../components/modals/AlertModal.js.jsx";
import brandingName from '../../enum/brandingName.js.jsx';

// import third-party libraries
import classNames from "classnames";
// import utils
import { permissions } from "../../utils";

// Actions
import * as enrollmentActions from "../../../resources/payments/enrollment/EnrollmentActions";
import * as firmActions from "../../../resources/firm/firmActions";

class PracticeSideNav extends Binder {
  constructor(props, context) {
    super(props);
    this.state = {
      showPayment: false,
    };
    this._bind("_handleClose");
  }
  _handleClose() {
    this.setState({
      showPayment: false,
    });
  }

  componentDidMount() {
    const { match, dispatch } = this.props;
    // use firmActions.fetchSingleIfNeeded
    // dispatch(enrollmentActions.getMerchantStatus(match.params.firmId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
  }

  _handleClose() {
    this.setState({
      showPayment: false
    });
  }

  render() {
    const { firmStore, isSidebarOpen, loggedInUser, match, staffStore, merchantStore } =
      this.props;
    let sidebarClass = classNames(
      "sidebar practice-sidebar"
      // , {
      //   '-open': isSidebarOpen
      // }
    );
    let logoClass = classNames(
      "-it-logo"
      // , { '-open': isSidebarOpen }
    );
    const ownerPermissions = permissions.isStaffOwner(
      staffStore,
      loggedInUser,
      match.params.firmId
    );
    const selectedFirm = firmStore.selected.getItem();
    let firmLogo = brandingName.image.logoBlack;
    if (selectedFirm && selectedFirm._id && selectedFirm.logoUrl) {
      firmLogo = `/api/firms/logo/${selectedFirm._id}/${selectedFirm.logoUrl}`;
    }
    const { showPayment } = this.state;

    // selectedFirm = merchData

    return (
      <div className={sidebarClass}>
        <AlertModal
          // alertMessage="Coming soon"
          alertTitle="To our valued customer"
          closeAction={this._handleClose}
          confirmAction={this._handleClose}
          confirmText="Okay"
          declineAction={null}
          declineText={null}
          isOpen={showPayment}
        >
          <div style={{ color: "black" }}>
            <h4>Coming soon</h4>
            <p>We are currently working on this feature and will launch soon!</p>
          </div>
        </AlertModal>
        <div className="-nav-content -fixed">
          <div className="nav-header">
            <div className={logoClass}>
              {firmStore.selected.isFetching ? (
                <div className="-text-logo loading -small"></div>
              ) : (
                <img className="-text-logo" src={firmLogo} />
              )}
              {/* <img className="-text-logo" src="/img/logo-black.png"  /> */}
              {/* <img className="-text-logo" src={firmLogo}/> */}
              {/* <img className="-text-logo" src="/img/logo-white-text-only.png"  /> */}
              <img className="-icon-logo" src={brandingName.image.icon} />
            </div>
          </div>
          <ul className="side-nav -firm">
            <li>
              <NavLink
                to={`/firm/${match.params.firmId}/workspaces`}
                activeclassname="active"
              >
                <span className="-icon">
                  <i className="fal fa-users-class" />
                </span>
                <span className="-text">
                  {ownerPermissions ? "All " : "My "} Workspaces
                </span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`/firm/${match.params.firmId}/contacts`}
                activeclassname="active"
              >
                <span className="-icon">
                  <i className="fal fa-address-card" />
                </span>
                <span className="-text">
                  {ownerPermissions ? "All " : "My "} Contacts
                </span>
              </NavLink>
            </li>
            {/* <li>
              <NavLink
                to={`/firm/${match.params.firmId}/signatures`}
                activeclassname="active"
              >
                <span className="-icon">
                  <i className="fal fa-pencil" />
                </span>
                <span className="-text">
                  {ownerPermissions ? "All " : "My "} Signatures
                </span>
              </NavLink>
            </li> */}
            <li>
              <NavLink
                to={`/firm/${match.params.firmId}/files`}
                activeclassname="active"
              >
                <span className="-icon">
                  <i className="fal fa-cabinet-filing" />
                </span>
                <span className="-text">
                  {ownerPermissions ? "All " : "General "} Files
                </span>
              </NavLink>
            </li>
            {/* <li>
              <a
                onClick={() => this.setState({ showPayment: true })}
                activeclassname="active"
                style={{ fontStyle: "italic" }}
              >
                <span className="-icon">
                  <i
                    className="fal fa-usd-square"
                    style={{ fontSize: "1.14em" }}
                  />
                </span>
                <span className="-text">Payments</span>
                <span className="-icon">
                  <i className="fas fa-lock-alt" style={{ fontSize: "1em" }} />
                </span>
              </a>
            </li> */}
            {/* <li>
              <NavLink
                to={`/firm/${match.params.firmId}/lists`}
                activeclassname="active"
              >
                <span className="-icon">
                  <i className="fal fa-list" />
                </span>
                <span className="-text">
                  Lists
                </span>
              </NavLink>
            </li> */}
          </ul>
          {ownerPermissions ? (
            <ul className="side-nav">
              <li>
                <NavLink
                  to={`/firm/${match.params.firmId}/clients`}
                  activeclassname="active"
                >
                  <span className="-icon">
                    <i className="fal fa-users-cog" />
                  </span>
                  <span className="-text">Client Settings</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={`/firm/${match.params.firmId}/settings`}
                  activeclassname="active"
                >
                  <span className="-icon">
                    <i className="fal fa-sliders-h" />
                  </span>
                  <span className="-text">Firm Settings</span>
                </NavLink>
              </li>
            </ul>
          ) : null}
        </div>
        <div className="side-nav-footer">
          <div className="yt-row right center-vert">
            <a
              className="footer-logo"
              href={brandingName.url}
              target="_blank"
            >
              <img src={brandingName.image.poweredby} />
            </a>
          </div>
        </div>
      </div>
    );
  }
}
PracticeSideNav.propTypes = {
  dispatch: PropTypes.func.isRequired,
  isSidebarOpen: PropTypes.bool.isRequired,
};
const mapStoreToProps = (store) => {
  return {
    loggedInUser: store.user.loggedIn.user,
    staffStore: store.staff,
    firmStore: store.firm,
    merchantStore: store.merchant
  };
};
export default withRouter(
  connect(mapStoreToProps, null, null, {
    pure: false,
  })(PracticeSideNav)
);
