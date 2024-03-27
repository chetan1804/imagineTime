import React, { Component } from "react";
//import toast from "react-hot-toast";
import NumberFormat from "react-number-format";

import { TextInput, SelectFromObject } from "../../../global/components/forms";
import { validationUtils } from "../../../global/utils";

import * as paymentActions from "../PaymentActions";
import * as transactionActions from "../viewTransactionHistory/TransactionAction";
import { COUNTRIES } from "../../../config/constants";

class ClickToPayCCForm extends Component {
  constructor(props) {
    super(props);
    this.handleText = this.handleText.bind(this);
    this.handleTokenize = this.handleTokenize.bind(this);
    this.handleFieldChange = this.handleFieldChange.bind(this);
    this.generateIframes = this.generateIframes.bind(this);
    this.saveCardInformation = this.saveCardInformation.bind(this);
    this.updateInvoiceRecord = this.updateInvoiceRecord.bind(this);
    this.createPaymentHeader = this.createPaymentHeader.bind(this);
    this.createPaymentDetails = this.createPaymentDetails.bind(this);
    this.paycardUsingToken = this.paycardUsingToken.bind(this);
    this.handleNewCard = this.handleNewCard.bind(this);
    this.handlePhone = this.handlePhone.bind(this);

    this.state = {
      tokenizedPaymentMethod: null,
      completedTransaction: null,
      isPayButtonDisabled: true,
      formValues: {},
      loading: false,
      emailIsValid: false,
      emailError: "",
      isValidForm: false,
      isClosed: false,
      isNewCard: false,
      phone: null,
      expiryDate: null,
      country: null,
    };
  }

  componentDidMount() {
    const { loading } = this.state;
    const { cardDetails, clientStore } = this.props;
    const clientData = clientStore;
    const checker = Boolean(
      _.find(cardDetails, (data) => {
        return data.TransType == "CC";
      })
    );
    if (cardDetails && !checker && !loading) {
      this.generateIframes();
      this.setState({ loading: true, isNewCard: true });
    }
  }

  handleNewCard() {
    this.setState({
      isNewCard: true,
    });
    this.generateIframes();
  }

  paycardUsingToken() {
    // toast.loading("Please wait...", {
    //   duration: 4000,
    // });
    const { dispatch, selectedInvoice, cardDetails, clientStore } = this.props;

    const clientData = clientStore;

    let cardObj = {
      method: "card",
      payment_method_id: cardDetails && cardDetails[0].StaxToken,
      send_reciept: false,
      meta: {
        otherField1: `${clientData && clientData.name}|${clientData._id}|${
          clientData._firm
        }|${selectedInvoice && selectedInvoice.invoice_id}`,
        subtotal: selectedInvoice && selectedInvoice.invoice_balance,
        tax: 0,
      },
      total: selectedInvoice && selectedInvoice.invoice_balance,
    };

    dispatch(
      transactionActions.createCharge(
        clientData._firm,
        clientData._id,
        selectedInvoice && selectedInvoice.invoice_id,
        cardDetails && cardDetails[0].CustomerCardID,
        selectedInvoice && selectedInvoice.invoice_number,
        "CC",
        cardObj
      )
    );
    setTimeout(() => {
      // toast.success("Paid successfully.", {
      //   duration: 5000,
      // });
    }, 5000);
    setTimeout(() => {
      window.location.reload();
    }, 7500);
  }

  generateIframes() {
    setTimeout(() => {
      const { selectedFirm } = this.props;
      // the FattJs class is attached to `window` by our script
      const FattJs = window.FattJs;

      if (selectedFirm && selectedFirm.stax_public_key) {
        // tell fattJs to load in the card fields
        const fattJs = new FattJs(selectedFirm.stax_public_key, {
          number: {
            id: "card-number",
            placeholder: "0000 0000 0000 0000",
            style:
              "height: 35px; width: 100%; font-size: 15px; font-family: Helvetica Neue, Helvetica; color: #31325f; font-weight: 300;", // 35px is the height of my card-number div
          },
          cvv: {
            id: "card-cvv",
            placeholder: "CVV",
            style:
              "height: 35px; width: 100%; font-size: 15px; font-family: Helvetica Neue, Helvetica; color: #31325f; font-weight: 300;", // 35px is the height of my card-cvv div
          },
        });

        fattJs.showCardForm().then((handler) => {
          console.log("form loaded! :^)");
        });

        fattJs.on("card_form_complete", (message) => {
          console.log("card_form_complete", message);
        });

        fattJs.on("card_form_incomplete", (message) => {
          console.log("card_form_uncomplete", message);
        });

        this.fattJs = fattJs;
      }
    }, 150);
  }

  handlePhone(e) {
    const { formValues, expiryDate } = this.state;
    this.setState({
      phone: e.formattedValue,
    });

    if (
      !formValues.FirstName ||
      !formValues.LastName ||
      !formValues.email ||
      !expiryDate
    ) {
      this.setState({ isValidForm: false });
    } else {
      this.setState({ isValidForm: true });
    }
  }

  handleExpiryDate(e) {
    const { formValues, phone } = this.state;
    this.setState({
      expiryDate: e.formattedValue,
    });

    if (
      !formValues.FirstName ||
      !formValues.LastName ||
      !formValues.email ||
      !phone ||
      e.value.length < 6
    ) {
      this.setState({ isValidForm: false });
    } else {
      this.setState({ isValidForm: true });
    }
  }

  handleFieldChange = (event, type) => {
    const { formValues, expiryDate, phone } = this.state;
    if (
      !formValues.FirstName ||
      !formValues.LastName ||
      !formValues.email ||
      !expiryDate ||
      !phone
    ) {
      this.setState({ isValidForm: false });
    } else {
      this.setState({ isValidForm: true });
    }

    if (event.target && event.target.name != "email") {
      this.setState({
        formValues: { ...formValues, [event.target.name]: event.target.value },
      });
    } else if (
      event.target &&
      event.target.name == "email" &&
      validationUtils.checkIfEmailIsValid(event.target.value)
    ) {
      this.setState({
        formValues: { ...formValues, [event.target.name]: event.target.value },
        emailError: "",
        emailIsValid: true,
      });
    } else {
      this.setState({
        formValues: { ...formValues, [event.target.name]: event.target.value },
        emailError: "Invalid email address.",
        emailIsValid: false,
        isValidForm: false,
      });
    }
  };

  handleTokenize() {
    // toast.loading("Please wait...", {
    //   duration: 4000,
    // });
    const { addressStore, selectedInvoice } = this.props;
    const { formValues, phone, expiryDate } = this.state;
    const extraDetails = {
      last_name: formValues.LastName,
      first_name: formValues.FirstName,
      month: expiryDate.substr(0, 2),
      year: expiryDate.substr(3, expiryDate.length),
      phone: phone,
      email: formValues.email,
      total: selectedInvoice && selectedInvoice.invoice_balance,
      address_1: addressStore.street1
        ? addressStore.street1
        : formValues.address1
        ? formValues.address1
        : null,
      address_2: addressStore.street2
        ? addressStore.street2
        : formValues.address2
        ? formValues.address2
        : '',
      address_city: addressStore.city
        ? addressStore.city
        : formValues.city
        ? formValues.city
        : null,
      address_state: addressStore.state
        ? addressStore.state
        : formValues.state
        ? formValues.state
        : "NY",
      address_zip: addressStore.postal
        ? addressStore.postal
        : formValues.zip
        ? formValues.zip
        : null,
      address_country: addressStore.country
        ? addressStore.country
        : this.state.country
        ? this.state.country
        : "USA",
      url: "https://omni.fattmerchant.com/#/bill/",
      method: "card",
      send_reciept: false,
      validate: false,
    };
    this.fattJs
      .tokenize(extraDetails)
      .then((tokenizedPaymentMethod) => {
        this.handlePay(tokenizedPaymentMethod);
      })
      .catch((e) => {
        // toast.error(e.message || "Please enter valid information.", {
        //   duration: 5000,
        // });
      });
  }

  // if email is supplied, a reciept will be sent to customer
  handlePay = (tokenizeObj) => {
    const { clientStore, selectedInvoice, addressStore } = this.props;
    const { phone, expiryDate } = this.state;

    const { formValues } = this.state;
    const extraDetails = {
      last_name: formValues.LastName,
      first_name: formValues.FirstName,
      month: expiryDate.substr(0, 2),
      year: expiryDate.substr(3, expiryDate.length),
      phone: phone,
      email: formValues.email,
      total: selectedInvoice.invoice_balance,
      address_1: addressStore.street1
        ? addressStore.street1
        : formValues.address1
        ? formValues.address1
        : null,
      address_2: addressStore.street2
        ? addressStore.street2
        : formValues.address2
        ? formValues.address2
        : '',
      address_city: addressStore.city
        ? addressStore.city
        : formValues.city
        ? formValues.city
        : null,
      address_state: addressStore.state
        ? addressStore.state
        : formValues.state
        ? formValues.state
        : "NY",
      address_zip: addressStore.postal
        ? addressStore.postal
        : formValues.zip
        ? formValues.zip
        : null,
      address_country: addressStore.country
        ? addressStore.country
        : this.state.country
        ? this.state.country
        : "USA",
      url: "https://omni.fattmerchant.com/#/bill/",
      method: "card",
      validate: false,
      send_reciept: false,
      meta: {
        reference: "Payment made in ImagineShare", // optional - will show up in emailed receipts
        memo: "Payment made in ImagineShare", // optional - will show up in emailed receipts
        otherField1: `${clientStore && clientStore.name}|${clientStore._id}|${
          clientStore._firm
        }|${selectedInvoice.invoice_id}`,
        subtotal: selectedInvoice.invoice_balance, // optional - will show up in emailed receipts
        tax: 0, // optional - will show up in emailed receipts
      },
    };

    this.fattJs
      .pay(extraDetails)
      .then((completedTransaction) => {
        completedTransaction["card_last_four"] = tokenizeObj.card_last_four;
        completedTransaction["card_exp"] = tokenizeObj.card_exp;
        completedTransaction["StaxToken"] = tokenizeObj.id;
        completedTransaction["payment_note"] = tokenizeObj.nickname;

        this.saveCardInformation(completedTransaction);
      })
      .catch((e) => {
        // toast.error(e.message || "Please enter valid information.", {
        //   duration: 5000,
        // });
      });
  };

  saveCardInformation(result) {
    const { clientId, firmId, dispatch, cardDetails } = this.props;
    const { formValues, phone } = this.state;
    let cardObj = {};

    cardObj["firm_id"] = firmId;
    cardObj["client_id"] = clientId;
    cardObj["CardNo"] = result.card_last_four;
    cardObj["ExpiryDate"] = result.card_exp;
    cardObj["NameOnCard"] = formValues.FirstName + " " + formValues.LastName;
    cardObj["TransType"] = "CC";
    cardObj["FirstName"] = formValues.FirstName;
    cardObj["LastName"] = formValues.LastName;
    cardObj["phone"] = phone;
    cardObj["email"] = formValues.email;
    cardObj["StaxToken"] = result.StaxToken;
    cardObj["StaxCustomerID"] = result.customer_id;
    cardObj["StaxPaymentMethodID"] = result.payment_method_id;
    cardObj["merchant_id"] = null;

    if (cardDetails && cardDetails.CustomerCardID) {
      dispatch(
        paymentActions.updateCardDetails(cardDetails.CustomerCardID, cardObj)
      );
    } else {
      dispatch(paymentActions.createCardDetails(cardObj));
    }
    this.updateInvoiceRecord();
    this.createPaymentHeader(result);
    setTimeout(() => {
      // toast.success("Paid successfully.", {
      //   duration: 5000,
      // });
    }, 5000);
    setTimeout(() => {
      window.location.reload();
    }, 7500);
  }

  updateInvoiceRecord() {
    const { selectedInvoice, dispatch, updateInvoice } = this.props;
    let obj = {};
    obj.isPaid = true;
    obj.invoice_balance = 0;
    obj.invoice_id = selectedInvoice.invoice_id;
    obj.client_id = selectedInvoice.client_id;
    obj.firm_id = selectedInvoice.firm_id;
    obj.invoice_details = [];
    dispatch(updateInvoice(obj));
  }

  createPaymentHeader(result) {
    const { clientId, firmId, dispatch, selectedInvoice } = this.props;
    let paymentHeader = {};
    paymentHeader["StaxID"] = result.id;
    paymentHeader["firm_id"] = firmId;
    paymentHeader["client_id"] = clientId;
    paymentHeader["invoice_id"] = selectedInvoice.invoice_id;
    paymentHeader["invoice_number"] = selectedInvoice.invoice_number;
    paymentHeader["payment_note"] = result.payment_note;
    paymentHeader["payment_date"] = result.paid_at;
    paymentHeader["payment_type"] = "Credit Card";
    paymentHeader["amount"] = result.total;

    // call create payment header
    dispatch(paymentActions.createPaymentHeader(paymentHeader));
  }

  createPaymentDetails() {}

  handleText(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });
  }
  render() {
    const {
      formValues,
      isValidForm,
      emailIsValid,
      emailError,
      isNewCard,
      phone,
      expiryDate,
      country,
    } = this.state;
    const { selectedInvoice, cardDetails, addressStore } = this.props;

    const cc = _.filter(cardDetails, (data) => {
      if (data.TransType == "CC") {
        return data;
      }
    });
    const handleCountry = (e) => {
      this.setState({
        country: e.target.value,
      });
    };

    return (
      <div>
        <div>
          <div>
            <div>
              <ul className="flex-container nowrap p-my-2">
                <li className="flex-item service-line-item p-ml-0">
                  <b>Amount to charge</b>
                  <span className="p-px-3 ic-font-13">
                    <NumberFormat
                      thousandsGroupStyle="thousand"
                      value={selectedInvoice && selectedInvoice.invoice_balance}
                      prefix="$"
                      decimalSeparator="."
                      displayType="text"
                      type="text"
                      className="ic-red p-text-bold"
                      thousandSeparator={true}
                      allowNegative={true}
                      decimalScale={2}
                      fixedDecimalScale={true}
                      allowEmptyFormatting={true}
                      allowLeadingZeros={true}
                    />
                  </span>
                </li>
              </ul>
              {cc.length == 0 || isNewCard ? (
                <div>
                  <ul className="flex-container nowrap">
                    <li className="flex-item service-line-item p-ml-0">
                      <b className="required-field">First Name</b>
                      <div className="p-pt-2 ic-font-13">
                        <TextInput
                          name="FirstName"
                          value={formValues.FirstName || ""}
                          change={(e) => this.handleFieldChange(e, null)}
                        />
                      </div>
                    </li>
                    <li className="flex-item service-line-item">
                      <b className="required-field">Last Name</b>
                      <div className="p-pt-2 ic-font-13">
                        <TextInput
                          name="LastName"
                          value={formValues.LastName || ""}
                          change={(e) => this.handleFieldChange(e, null)}
                        />
                      </div>
                    </li>
                  </ul>

                  <ul className="flex-container nowrap">
                    <li className="flex-item service-line-item p-ml-0">
                      <b className="required-field">Phone Number</b>
                      <div className="p-pt-2 ic-font-13">
                        <NumberFormat
                          value={phone}
                          format="### ### ####"
                          allowEmptyFormatting={true}
                          className="custom-input"
                          onValueChange={(e) => this.handlePhone(e)}
                        />
                      </div>
                    </li>
                    <li className="flex-item service-line-item p-ml-0">
                      <b className="required-field">Email</b>
                      <div className="p-pt-2 ic-font-13">
                        <TextInput
                          name="email"
                          value={formValues.email}
                          change={(e) => this.handleFieldChange(e, "email")}
                          autoComplete="nope"
                          required
                        />
                      </div>
                      {!emailIsValid && (
                        <div className="ic-red">{emailError}</div>
                      )}
                    </li>
                  </ul>
                  {addressStore == null && (
                    <div>
                      <ul className="flex-container nowrap">
                        <li className="flex-item service-line-item p-ml-0">
                          <b className="required-field">Address 1</b>
                          <div className="p-pt-2 ic-font-13">
                            <TextInput
                              name="address1"
                              value={formValues.address1 || ""}
                              change={(e) => this.handleFieldChange(e, null)}
                              required
                            />
                          </div>
                        </li>
                        <li className="flex-item service-line-item">
                          <b>Address 2</b>
                          <div className="p-pt-2 ic-font-13">
                            <TextInput
                              name="address2"
                              value={formValues.address2 || ""}
                              change={(e) => this.handleFieldChange(e, null)}
                            />
                          </div>
                        </li>
                      </ul>

                      <ul className="flex-container nowrap">
                        <li className="flex-item service-line-item p-ml-0">
                          <b className="required-field">City</b>
                          <div className="p-pt-2 ic-font-13">
                            <TextInput
                              name="city"
                              value={formValues.city || ""}
                              change={(e) => this.handleFieldChange(e, null)}
                              required
                            />
                          </div>
                        </li>
                        <li className="flex-item service-line-item">
                          <b className="required-field">State</b>
                          <div className="p-pt-2 ic-font-13">
                            <TextInput
                              name="state"
                              value={formValues.state || ""}
                              change={(e) => this.handleFieldChange(e, null)}
                              required
                            />
                          </div>
                        </li>
                      </ul>

                      <ul className="flex-container nowrap">
                        <li className="flex-item service-line-item p-ml-0">
                          <b className="required-field">Zip</b>
                          <div className="p-pt-2 ic-font-13">
                            <TextInput
                              name="zip"
                              value={formValues.zip || ""}
                              change={(e) => this.handleFieldChange(e, null)}
                              required
                            />
                          </div>
                        </li>
                        <li className="flex-item service-line-item">
                          <b className="required-field">Country</b>
                          <div className="p-pt-2 ic-font-13">
                            <SelectFromObject
                              change={(e) => handleCountry(e)}
                              display="name"
                              filterable={true}
                              name="address.country"
                              items={COUNTRIES}
                              placeholder={""}
                              required={true}
                              selected={country}
                              value="code"
                              required
                            />
                          </div>
                        </li>
                      </ul>
                    </div>
                  )}
                  <ul className="flex-container nowrap">
                    <li className="flex-item service-line-item p-ml-0">
                      <b>Card Number</b>
                      <div className="p-pt-2 ic-font-13">
                        <div
                          id="card-number"
                          className="card-number custom-input"
                        />
                      </div>
                    </li>
                  </ul>

                  <ul className="flex-container nowrap">
                    <li className="flex-item service-line-item p-ml-0">
                      <b className="required-field">Exp Date</b>
                      <div className="p-pt-2 ic-font-13">
                        <NumberFormat
                          value={expiryDate}
                          format="##/####"
                          mask="_"
                          allowEmptyFormatting={true}
                          className="custom-input card-cvv"
                          onValueChange={(e) => this.handleExpiryDate(e)}
                        />
                      </div>
                    </li>
                    <li className="flex-item service-line-item">
                      <b className="required-field">CV Code</b>
                      <div className="p-pt-2 ic-font-13">
                        <div id="card-cvv" className="card-cvv custom-input" />
                      </div>
                    </li>
                  </ul>
                </div>
              ) : (
                <div>
                  <ul className="flex-container nowrap p-my-2">
                    <li className="flex-item service-line-item p-ml-0 width-50p">
                      <b>Name</b>
                    </li>
                    <li className="flex-item service-line-item p-ml-0">
                      <span className="p-px-3 ic-font-13">
                        {cc[0] && cc[0].NameOnCard}
                      </span>
                    </li>
                  </ul>
                  <ul className="flex-container nowrap p-my-2">
                    <li className="flex-item service-line-item p-ml-0 width-50p">
                      <b>Last 4 digits</b>
                    </li>
                    <li className="flex-item service-line-item p-ml-0">
                      <span className="p-px-3 ic-font-13">
                        {cc[0] && cc[0].CardNo}
                      </span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div>
              {cc[0] && cc[0].StaxCustomerID && !isNewCard && (
                <a href="#">
                  <button
                    className="yt-btn x-small"
                    type="button"
                    style={{
                      margin: 5,
                      height: 25,
                      paddingTop: "revert",
                      float: "right",
                    }}
                    onClick={this.handleNewCard}
                  >
                    Add New Card
                  </button>
                </a>
              )}
              {!isNewCard ? (
                <a href="#">
                  <button
                    className="yt-btn x-small"
                    type="button"
                    disabled={cc[0] && cc[0].StaxCustomerID ? false : true}
                    style={{
                      margin: 5,
                      height: 25,
                      paddingTop: "revert",
                      float: "right",
                    }}
                    onClick={this.paycardUsingToken}
                  >
                    Process Payment
                  </button>
                </a>
              ) : (
                <a href="#">
                  <button
                    className="yt-btn x-small"
                    type="button"
                    disabled={isValidForm ? false : true}
                    style={{
                      margin: 5,
                      height: 25,
                      paddingTop: "revert",
                      float: "right",
                    }}
                    onClick={this.handleTokenize}
                  >
                    Process Payment
                  </button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ClickToPayCCForm.propTypes = {};

export default ClickToPayCCForm;
