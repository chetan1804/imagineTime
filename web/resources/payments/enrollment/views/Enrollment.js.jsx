import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Helmet } from "react-helmet";
//import { Toaster } from "react-hot-toast";

import * as enrollmentActions from "../EnrollmentActions";
import * as clientUserActions from "../../../clientUser/clientUserActions";
import * as firmActions from "../../../firm/firmActions";

import Binder from "../../../../global/components/Binder.js.jsx";
import Breadcrumbs from "../../../../global/components/navigation/Breadcrumbs.js.jsx";
import PracticeFirmLayout from "../../../firm/practice/components/PracticeFirmLayout.js.jsx";

import Cards from "../components/Cards.js.jsx";
import Button from "../components/Button.js.jsx";
import EnrollmentModal from "../components/EnrollmentModal.js.jsx";

class Enrollment extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      enrollmentIsClicked: false,
    };
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    dispatch(firmActions.fetchSingleFirmById(match.params.firmId));
    dispatch(
      clientUserActions.fetchListIfNeeded(
        "_user",
        loggedInUser._id,
        "status",
        "active"
      )
    );
  }

  render() {
    const { location, merchantStore, dispatch, match, firmStore } = this.props;
    const { enrollmentIsClicked } = this.state;

    const handleEnrollmentModal = () => {
      this.setState({ enrollmentIsClicked: true });
      if (enrollmentIsClicked) {
        this.setState({ enrollmentIsClicked: false });
      }
    };

    const handleConfirmAction = () => {
      const firmData = firmStore.byId[match.params.firmId];
      const url = `https://signup.fattmerchant.com/#/sso?jwt=${firmData && firmData.stax_token
        }`;
      const newWindow = window.open(decodeURI(url));
      newWindow.location = url;
    };

    const merchData = merchantStore.merchant && merchantStore.merchant.data;
    const firmData = firmStore && firmStore.byId[match.params.firmId];

    const isEmpty = !merchData || !firmData;

    const isFetching = merchData || firmData;

    return (
      <PracticeFirmLayout>
        <Helmet>
          <title>Enrollment</title>
        </Helmet>
        {isEmpty ? (
          isFetching ? (
            <div className="-loading-hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>
          ) : (
            <div className="hero -empty-hero">
              <div className="u-centerText">
                <h2>No workspaces yet</h2>
              </div>
            </div>
          )
        ) : (
          <div>
            {/* <Toaster /> */}
            <EnrollmentModal
              isClicked={enrollmentIsClicked}
              handleModal={handleEnrollmentModal}
              createMerchant={enrollmentActions.sendCreateMerchant}
              dispatch={dispatch}
              match={match}
              merchant={merchantStore.merchant}
              firm={firmStore}
            />
            <div className="-practice-content">
              {merchData && merchData.stax_merchant_id == null ? (
                <div className="p-pt-3">
                  <Cards />
                  <Button
                    merchData={merchData}
                    handleConfirmAction={handleConfirmAction}
                    handleModal={handleEnrollmentModal}
                  />
                </div>
              ) : (
                <Button
                  merchData={merchData}
                  handleConfirmAction={handleConfirmAction}
                  handleModal={handleEnrollmentModal}
                />
              )}
            </div>
          </div>
        )}

      </PracticeFirmLayout>
    );
  }
}

Enrollment.propTypes = {};

const mapStoreToProps = (store, props) => {
  const loggedInUser = store.user.loggedIn.user;
  return {
    loggedInUser,
    merchantStore: store.merchant,
    firmStore: store.firm,
  };
};

export default withRouter(connect(mapStoreToProps)(Enrollment));
