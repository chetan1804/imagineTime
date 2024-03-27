import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import axios from "axios";
import NumberFormat from "react-number-format";
//import { Toaster } from "react-hot-toast";

import * as invoiceActions from "../../clientInvoice/InvoiceActions";

import Binder from "../../../global/components/Binder.js.jsx";
import { SelectFromObject } from "../../../global/components/forms";
import CreditCardForm from "../components/ClickToPayCCForm.js.jsx";
import BankForm from "../components/ClickToPayBankForm.js.jsx";
class PaymentLayout extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      type: "",
      dataSource: null,
      didUpdate: false,
      loading: true,
    };
    this.handleType = this.handleType.bind(this);
    this.getRequireData = this.getRequireData.bind(this);
  }

  async componentDidMount() {
    const { match } = this.props;
    let data = await this.getRequireData(match.params.token);

    this.setState({
      dataSource: data,
    });

    setTimeout(() => {
      this.setState({
        loading: false,
      });
    }, 1500);
  }

  async getRequireData(token) {
    return new Promise((resolve, reject) => {
      axios({
        method: "GET",
        url: `https://${window.appUrl}/api/getPaynowData/${token}`,
      })
        .then((data) => {
          resolve(data.data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  handleType(e) {
    this.setState({
      type: e.target.value,
    });
  }

  render() {
    const { type, dataSource, loading } = this.state;
    const { dispatch } = this.props;
    const types = ["Credit Card", "ACH"];
    const clientStore = dataSource && dataSource.clientData;
    const selectedInvoice = dataSource && dataSource.invoiceData;
    const selectedFirm = dataSource && dataSource.firmData;
    const clientId =
      dataSource && dataSource.clientData && dataSource.clientData._id;
    const firmId =
      dataSource && dataSource.clientData && dataSource.firmData._id;
    let cardDetails = dataSource && dataSource.cardDetails;
    let addressStore = dataSource && dataSource.addressData;

    return (
      <div className="master-layout admin-layout">
        {/* <Toaster /> */}
        <div className="body with-header -admin-body">
          <div className="lay-center">
            <div className="card">
              <div className="card-header p-text-center d-block ic-white header-color">
                <div>
                  <strong>Pay Invoice</strong>
                </div>
                <div>
                  <strong className="ic-font-13">
                    {selectedFirm && selectedFirm.name}
                  </strong>
                </div>
              </div>
              {loading ? (
                <div className="-loading-hero">
                  <div className="u-centerText">
                    <div className="loading"></div>
                  </div>
                </div>
              ) : dataSource && !dataSource.isInvalidUrl ? (
                <div>
                  <div className="card-body">
                    <ul className="flex-container nowrap p-my-2 ic-font-13">
                      <li className="flex-item service-line-item p-ml-0">
                        <strong> Client Name</strong>
                      </li>
                      <li className="flex-item service-line-item p-ml-0">
                        : {selectedInvoice && selectedInvoice.name}
                      </li>
                    </ul>
                    <ul className="flex-container nowrap p-my-2 ic-font-13">
                      <li className="flex-item service-line-item p-ml-0">
                        <strong> Invoice Number</strong>
                      </li>
                      <li className="flex-item service-line-item p-ml-0">
                        : {selectedInvoice && selectedInvoice.invoice_number}
                      </li>
                    </ul>
                    <ul className="flex-container nowrap p-my-2 ic-font-13">
                      <li className="flex-item service-line-item p-ml-0">
                        <strong> Invoice Amount</strong>
                      </li>
                      <li className="flex-item service-line-item p-ml-0">
                        :{" "}
                        <NumberFormat
                          thousandsGroupStyle="thousand"
                          value={
                            selectedInvoice && selectedInvoice.invoice_amount
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
                      </li>
                    </ul>
                    {selectedInvoice && selectedInvoice.invoice_balance != 0 ? (
                      <div>
                        <ul className="flex-container nowrap p-my-2 ic-font-13">
                          <li className="flex-item service-line-item p-ml-0">
                            <strong> Payment Type</strong>
                          </li>
                          <li className="flex-item service-line-item p-ml-0">
                            <SelectFromObject
                              placeholder="Choose type..."
                              items={types}
                              change={(e) => this.handleType(e)}
                              selected={type}
                              style={{ marginTop: -9 }}
                            />
                          </li>
                        </ul>
                        <ul className="flex-container nowrap p-my-2 ic-font-13">
                          {type == "" ? (
                            ""
                          ) : type == "Credit Card" ? (
                            <CreditCardForm
                              clientStore={clientStore}
                              selectedInvoice={selectedInvoice}
                              selectedFirm={selectedFirm}
                              clientId={clientId}
                              firmId={firmId}
                              addressStore={addressStore}
                              dispatch={dispatch}
                              cardDetails={cardDetails}
                              updateInvoice={invoiceActions.sendUpdateInvoice}
                            />
                          ) : (
                            <BankForm
                              clientStore={clientStore}
                              selectedInvoice={selectedInvoice}
                              selectedFirm={selectedFirm}
                              addressStore={addressStore}
                              clientId={clientId}
                              firmId={firmId}
                              dispatch={dispatch}
                              cardDetails={cardDetails}
                              updateInvoice={invoiceActions.sendUpdateInvoice}
                            />
                          )}
                        </ul>
                      </div>
                    ) : (
                      <img
                        src="/img/paid_business.svg"
                        alt="denied"
                        className="opacity-4"
                      />
                    )}
                  </div>
                </div>
              ) : (
                dataSource &&
                dataSource.isInvalidUrl && (
                  <img
                    src="/img/denied.png"
                    alt="denied"
                    className="opacity-4"
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

PaymentLayout.propTypes = {};

const mapStoreToProps = (store) => {
  return {};
};

export default withRouter(connect(mapStoreToProps)(PaymentLayout));
