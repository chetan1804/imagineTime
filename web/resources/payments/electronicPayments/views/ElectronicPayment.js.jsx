import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import * as clientUserActions from "../../../clientUser/clientUserActions";
import * as epaymentsActions from "../EpaymentsActions";
import * as firmActions from "../../../firm/firmActions";

import Binder from "../../../../global/components/Binder.js.jsx";
import NumberFormat from "react-number-format";
import PracticeFirmLayout from "../../../firm/practice/components/PracticeFirmLayout.js.jsx";
import ElectronicPaymentModal from "../components/ElectronicPaymentModal.js.jsx";

class ElectronicPayment extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      rejectIsClicked: false,
    };
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    dispatch(
      clientUserActions.fetchListIfNeeded(
        "_user",
        loggedInUser._id,
        "status",
        "active"
      )
    );
    dispatch(epaymentsActions.getEnrollMerchantStatus(match.params.firmId));
    dispatch(epaymentsActions.enrollAssume(match.params.firmId));
    dispatch(firmActions.fetchSingleFirmById(match.params.firmId));
  }

  render() {
    const { match, staxUtilitiesStore, firmStore } = this.props;
    const { rejectIsClicked } = this.state;

    const firm = firmStore && firmStore.byId[match.params.firmId];

    const handleRejectModal = () => {
      this.setState({ rejectIsClicked: true });
      if (rejectIsClicked) {
        this.setState({ rejectIsClicked: false });
      }
    };
    let assumeData =
      staxUtilitiesStore.merchant &&
      staxUtilitiesStore.merchant.assume &&
      staxUtilitiesStore.merchant.assume.merchant;
    const registrationData =
      staxUtilitiesStore.merchant && staxUtilitiesStore.merchant.registration;

    const loginToStaxReports = () => {
      const registrationData =
        staxUtilitiesStore.merchant && staxUtilitiesStore.merchant.registration;
      let url = `https://omni.fattmerchant.com/#/sso?jwt[]=${
        registrationData && registrationData.ssoToken
      }&loginRedirect=reports`;
      var newWindow = window.open(decodeURI(url));
      newWindow.location = url;
    };

    const loginToStax = () => {
      const registrationData =
        staxUtilitiesStore.merchant && staxUtilitiesStore.merchant.registration;
      let url = `https://omni.fattmerchant.com/#/sso?jwt[]=${
        registrationData && registrationData.ssoToken
      }`;
      var newWindow = window.open(decodeURI(url));
      newWindow.location = url;
    };

    const isFetching =
      staxUtilitiesStore.selected && !staxUtilitiesStore.selected.isFetching;

    return (
      <PracticeFirmLayout>
        {!isFetching ? (
          <div className="-loading-hero">
            <div className="u-centerText">
              <div className="loading"></div>
            </div>
          </div>
        ) : (
          <div className="-practice-content">
            <div class="parent-container">
              <div class="child-container-left">
                <div class="flex-container horizontal">
                  <div class="flex-item">
                    <div class="p-pl-3 p-pb-2">
                      <div class="p-text-bold label-color">
                        {assumeData && assumeData.company_name}
                      </div>
                    </div>
                    <div class="p-pl-3">
                      <i
                        class="fa fa-phone p-pr-2 ic-size-15"
                        aria-hidden="true"
                      ></i>
                      <span class="ic-size-15">
                        {registrationData &&
                          registrationData.business_location_phone_number}
                      </span>
                    </div>
                    <div class="p-pl-3 p-pt-1 ic-size-15">
                      <i
                        class="fa fa-envelope p-pr-2 ic-size-15"
                        aria-hidden="true"
                      ></i>
                      {registrationData && registrationData.business_email}
                    </div>
                    <div class="p-pl-3 p-pt-1 p-pb-1">
                      <i
                        class="fa fa-map-marker-alt p-pr-2 ic-size-15"
                        aria-hidden="true"
                      ></i>
                      <span>
                        {registrationData &&
                          registrationData.business_address_1}{" "}
                        &nbsp;
                      </span>
                      <span>
                        {registrationData &&
                          registrationData.business_address_2}{" "}
                        &nbsp;
                      </span>
                      <span>
                        {registrationData &&
                          registrationData.business_address_city}{" "}
                        &nbsp;
                      </span>
                      <span>
                        {registrationData &&
                          registrationData.business_location_address_state}{" "}
                        &nbsp;
                      </span>
                      <span>
                        {registrationData &&
                          registrationData.business_location_address_zip}{" "}
                        &nbsp;
                      </span>
                    </div>
                  </div>
                  <div class="flex-item m-x-8">
                    <div class="p-text-bold label-color">
                      Underwriting/Application Status
                    </div>
                    {registrationData &&
                    registrationData.underwriting_status ? (
                      <div class="ic-red m-y-10">
                        {registrationData &&
                          registrationData.underwriting_status}
                      </div>
                    ) : (
                      <div class="ic-red m-y-10">AWAITING REVIEW</div>
                    )}

                    <div class="p-text-bold label-color">Account Status</div>
                    {registrationData &&
                    registrationData.underwriting_status != "REJECTED" &&
                    !registrationData.underwriting_substatuses ? (
                      <div class="ic-red m-y-10 ravindra">
                        {assumeData && assumeData.status}
                      </div>
                    ) : (
                      <div class="ic-red m-y-10">
                        <span>
                          {assumeData &&
                            (assumeData.underwriting_status ||
                              assumeData.status)}
                        </span>

                        {registrationData &&
                          registrationData.underwriting_substatuses &&
                          registrationData.underwriting_substatuses.length >
                            0 &&
                          registrationData.underwriting_status !=
                            "REJECTED" && (
                            <span
                              class="pull-right error-link"
                              onClick={() => handleRejectModal()}
                            >
                              <i class="fa fa-exclamation-circle m-x-8"></i>
                              Show Rejected Reasons
                            </span>
                          )}
                      </div>
                    )}
                  </div>
                </div>
                {assumeData &&
                  assumeData.status == "ACTIVE" &&
                  registrationData &&
                  registrationData.underwriting_status != "PENDED" &&
                  registrationData &&
                  registrationData.underwriting_status != "REJECTED" && (
                    <div class="flex-container horizontal p-pt-2">
                      <div class="flex-item">
                        <div class="p-pl-3 p-pb-2">
                          <div class="p-text-bold label-color">
                            Transactions
                          </div>
                        </div>
                        <div class="paymentslinks">
                          <span>
                            <a
                              href={`/firm/${match.params.firmId}/card-transactions`}
                            >
                              View Transaction History
                            </a>
                          </span>
                          <span>
                            <a onClick={() => loginToStax()}>Payments Portal</a>
                          </span>
                          <span>
                            <a onClick={() => loginToStaxReports()}>Reports</a>
                          </span>
                        </div>
                      </div>
                      <div class="flex-item m-x-8">
                        <div class="p-text-bold label-color">
                          Maximum Allowed Per Transaction
                        </div>
                        <div class="ic-red m-y-10">
                          <div class="label-color p-pt-2">
                            <span>Credit Card :</span>
                            <span className="ic-red p-pl-6">
                              {
                                <NumberFormat
                                  thousandsGroupStyle="thousand"
                                  value={
                                    assumeData &&
                                    assumeData.options &&
                                    assumeData.options.transaction_limit
                                  }
                                  prefix="$"
                                  decimalSeparator="."
                                  displayType="text"
                                  type="text"
                                  thousandSeparator={true}
                                  allowNegative={true}
                                  decimalScale={2}
                                  fixedDecimalScale={true}
                                  allowEmptyFormatting={true}
                                  allowLeadingZeros={true}
                                />
                              }
                            </span>
                            <span className="p-pl-6 p-pl-3e">ACH :</span>
                            <span className="ic-red p-pl-6">
                              {
                                <NumberFormat
                                  thousandsGroupStyle="thousand"
                                  value={
                                    assumeData &&
                                    assumeData.options &&
                                    assumeData.options.ach_transaction_limit
                                  }
                                  prefix="$"
                                  decimalSeparator="."
                                  displayType="text"
                                  type="text"
                                  thousandSeparator={true}
                                  allowNegative={true}
                                  decimalScale={2}
                                  fixedDecimalScale={true}
                                  allowEmptyFormatting={true}
                                  allowLeadingZeros={true}
                                />
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
              {registrationData &&
                registrationData.electronic_signature &&
                registrationData &&
                registrationData.underwriting_status != "REJECTED" && (
                  <div class="child-container-right">
                    <div class="">
                      <div class="p-pl-3 p-pb-2">
                        <span class="p-text-bold label-color p-pt-3">
                          <i
                            class="fa fa-tags p-pr-2 p-pt-3"
                            aria-hidden="true"
                          ></i>
                          Pricing
                        </span>
                        <span class="pull-right">
                          <img src="/img/cards.png" />
                        </span>
                      </div>
                      <div class="p-text-bold label-color p-pt-2">
                        Credit Card
                      </div>
                      <div class="ic-red p-my-2">
                        {registrationData && registrationData.plan_dcamnt}% +
                        {
                          <NumberFormat
                            thousandsGroupStyle="thousand"
                            value={
                              registrationData && registrationData.plan_txamnt
                            }
                            prefix="$"
                            decimalSeparator="."
                            displayType="text"
                            type="text"
                            thousandSeparator={true}
                            decimalScale="2"
                            fixedDecimalScale={true}
                            allowEmptyFormatting={true}
                            allowLeadingZeros={true}
                          />
                        }
                      </div>
                      <div class="p-text-bold label-color p-pt-2">ACH</div>
                      <div class="ic-red p-my-2">
                        {
                          <NumberFormat
                            thousandsGroupStyle="thousand"
                            value={
                              registrationData &&
                              registrationData.plan_ach_txamnt
                            }
                            prefix="$"
                            decimalSeparator="."
                            displayType="text"
                            type="text"
                            thousandSeparator={true}
                            allowNegative={true}
                            decimalScale={2}
                            fixedDecimalScale={true}
                            allowEmptyFormatting={true}
                            allowLeadingZeros={true}
                          />
                        }
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
        <ElectronicPaymentModal
          isClicked={rejectIsClicked}
          handleRejectModal={handleRejectModal}
          regData={registrationData}
          firm={firm}
        />
      </PracticeFirmLayout>
    );
  }
}

ElectronicPayment.propTypes = {};

const mapStoreToProps = (store, props) => {
  const loggedInUser = store.user.loggedIn.user;

  return {
    loggedInUser,
    staxUtilitiesStore: store.staxUtilities,
    firmStore: store.firm,
  };
};

export default withRouter(connect(mapStoreToProps)(ElectronicPayment));
