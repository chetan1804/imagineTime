import Swal from "sweetalert2";
import React, { Component } from "react";

//import toast from "react-hot-toast";
import NumberFormat from "react-number-format";

import { TextInput, SelectFromObject } from "../../../global/components/forms";
import { validationUtils } from "../../../global/utils";
import * as paymentActions from "../PaymentActions";
import * as transactionActions from "../viewTransactionHistory/TransactionAction";
import { COUNTRIES } from "../../../config/constants";
class BankForm extends Component {
  constructor(props) {
    super(props);
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
      isNewBank: false,
      phone: "",
      accountNo: "",
      routingNo: "",
      country: "",
      accountNoError: "",
      routingNoError: "",
      accountNoIsValid: false,
      routingNoIsValid: false,
    };

    super(props);
    let fattJs = null;
    this.handleText = this.handleText.bind(this);
    this.handleTokenize = this.handleTokenize.bind(this);
    this.handleBankFormChange = this.handleBankFormChange.bind(this);
    this.saveCardInformation = this.saveCardInformation.bind(this);
    this.updateInvoiceRecord = this.updateInvoiceRecord.bind(this);
    this.createPaymentHeader = this.createPaymentHeader.bind(this);
    this.createPaymentDetails = this.createPaymentDetails.bind(this);
    this.paycardUsingToken = this.paycardUsingToken.bind(this);
    this.handleNewBank = this.handleNewBank.bind(this);
    this.handleType = this.handleType.bind(this);
    this.handlePhone = this.handlePhone.bind(this);
    this.handleAccountNo = this.handleAccountNo.bind(this);
    this.handleRoutingNo = this.handleRoutingNo.bind(this);
  }

  componentDidMount() {
    const { loading } = this.state;
    const { cardDetails, clientStore, match } = this.props;
    const clientData = clientStore && clientStore.byId[match.params.clientId];
    this.generateIframes();
    if (cardDetails && Object.keys(cardDetails).length == 0 && !loading) {
      this.setState({ loading: true, isNewBank: true });
    }
  }

  generateIframes() {
    setTimeout(() => {
      const { selectedFirm } = this.props;
      // the FattJs class is attached to `window` by our script
      const FattJs = window.FattJs;

      if (selectedFirm && selectedFirm.stax_public_key) {
        // tell fattJs to load in the card fields
        const fattJs = new FattJs(selectedFirm.stax_public_key, {});
        this.fattJs = fattJs;
      }
    }, 150);
  }

  handleType(event) {
    const { formValues, phone, accountNo, routingNo } = this.state;
    this.setState({
      formValues: { ...formValues, ["TransCode"]: event.target.value },
    });
    if (
      !formValues.FirstName ||
      !formValues.LastName ||
      !formValues.email ||
      !phone ||
      accountNo.length < 10 ||
      routingNo.length < 9
    ) {
      this.setState({ isValidForm: false });
    } else {
      this.setState({ isValidForm: true });
    }
  }

  handleText(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });
  }

  handleNewBank() {
    this.setState({
      isNewBank: true,
    });
    this.generateIframes();
  }

  handlePhone(e) {
    const { formValues, routingNo, accountNo } = this.state;
    this.setState({
      phone: e.formattedValue,
    });
    if (
      !formValues.FirstName ||
      !formValues.LastName ||
      !formValues.email ||
      !formValues.TransCode ||
      accountNo.length < 10 ||
      routingNo.length < 9
    ) {
      this.setState({ isValidForm: false });
    } else {
      this.setState({ isValidForm: true });
    }
  }

  handleAccountNo(e) {
    const { formValues, phone, routingNo } = this.state;
    this.setState({
      accountNo: e.formattedValue,
    });

    if (
      !formValues.FirstName ||
      !formValues.LastName ||
      !formValues.email ||
      !phone ||
      !formValues.TransCode ||
      e.formattedValue.length < 10 ||
      routingNo.length < 9
    ) {
      this.setState({ isValidForm: false });
    } else {
      this.setState({ isValidForm: true });
    }

    if (e.formattedValue.length < 10) {
      this.setState({
        accountNoError: "Minimum of 10 digit required.",
        accountNoIsValid: false,
      });
    } else {
      this.setState({ accountNoError: "", accountNoIsValid: true });
    }
  }

  handleRoutingNo(e) {
    const { formValues, phone, accountNo } = this.state;
    this.setState({
      routingNo: e.formattedValue,
    });

    if (
      !formValues.FirstName ||
      !formValues.LastName ||
      !formValues.email ||
      !phone ||
      !formValues.TransCode ||
      accountNo.length < 10 ||
      e.formattedValue.length < 9
    ) {
      this.setState({ isValidForm: false });
    } else {
      this.setState({ isValidForm: true });
    }

    if (e.formattedValue.length < 9) {
      this.setState({
        routingNoError: "Minimum of 9 digit required.",
        routingNoIsValid: false,
      });
    } else {
      this.setState({ routingNoError: "", routingNoIsValid: true });
    }
  }

  handleBankFormChange = (event, type) => {
    const { formValues, phone, accountNo, routingNo } = this.state;
    if (
      !formValues.FirstName ||
      !formValues.LastName ||
      !formValues.email ||
      !formValues.TransCode ||
      !phone ||
      !accountNo ||
      !routingNo
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

  paycardUsingToken() {
    const {
      match,
      dispatch,
      handleCloseModal,
      selectedInvoice,
      cardDetails,
      clientStore,
      selectedFirm,
    } = this.props;

    const clientData = clientStore && clientStore.byId[match.params.clientId];

    let cardObj = {
      method: "bank",
      payment_method_id: cardDetails.StaxToken,
      send_reciept: false,
      meta: {
        otherField1: `${clientData.name}|${match.params.clientId}|${
          selectedFirm && selectedFirm._id
        }|${selectedInvoice.invoice_id}`,
        subtotal: selectedInvoice.invoice_balance,
        tax: 0,
      },
      total: selectedInvoice.invoice_balance,
    };

    dispatch(
      transactionActions.createCharge(
        selectedFirm && selectedFirm._id,
        match.params.clientId,
        selectedInvoice.invoice_id,
        cardDetails.CustomerCardID,
        selectedInvoice.invoice_number,
        "ACH",
        cardObj
      )
    );
    setTimeout(() => {
      // toast.success("Paid successfully.", {
      //   duration: 5000,
      // });
      handleCloseModal(false);
    }, 5000);
  }

  handleTokenize() {
    const { clientStore, addressStore, selectedInvoice, match } = this.props;
    const primaryAddress =
      clientStore &&
      clientStore.byId[match.params.clientId] &&
      clientStore.byId[match.params.clientId]._primaryAddress;
    const addressData = addressStore && addressStore.byId[primaryAddress];
    const { formValues, phone, accountNo, routingNo } = this.state;
    const extraDetails = {
      last_name: formValues.LastName,
      first_name: formValues.FirstName,
      phone: phone,
      email: formValues.email,
      person_name: formValues.FirstName + " " + formValues.LastName,
      total: selectedInvoice && selectedInvoice.invoice_balance,
      address_1: addressData.street1
        ? addressData.street1
        : formValues.address1
        ? formValues.address1
        : null,
      address_2: addressData.street2
        ? addressData.street2
        : formValues.address2
        ? formValues.address2
        : "",
      address_city: addressData.city
        ? addressData.city
        : formValues.city
        ? formValues.city
        : null,
      address_state:
        addressData.state && addressData.state.length == 2
          ? addressData.state
          : formValues.state
          ? formValues.state
          : "NY",
      address_zip: addressData.postal
        ? addressData.postal
        : formValues.zip
        ? formValues.zip
        : null,
      address_country:
        addressData.country && addressData.country.length == 3
          ? addressData.country
          : this.state.country
          ? this.state.country
          : "USA",
      bank_account: accountNo,
      bank_routing: routingNo,
      bank_holder_type: "personal",
      bank_type: formValues.TransCode == "Checking" ? "checking" : "savings",
      url: "https://omni.fattmerchant.com/#/bill/",
      method: "bank",
      validate: false,
      send_reciept: false,
    };

    this.fattJs
      .tokenize(extraDetails)
      .then((tokenizedPaymentMethod) => {
        this.handlePay(tokenizedPaymentMethod);
      })
      .catch((e) => {
        let msg = e.message ? e.message : e.errors[0];
        toast.error(msg || "Please enter valid information.", {
          duration: 5000,
        });
      });
  }

  // if email is supplied, a reciept will be sent to customer
  handlePay = (tokenizeObj) => {
    const { clientStore, selectedInvoice, addressStore, match, selectedFirm } =
      this.props;

    const addressData =
      addressStore && addressStore.selected && addressStore.selected.address;
    const clientData = clientStore && clientStore.byId[match.params.clientId];

    const { formValues, phone, accountNo, routingNo } = this.state;
    const extraDetails = {
      last_name: formValues.LastName,
      first_name: formValues.FirstName,
      person_name: formValues.FirstName + " " + formValues.LastName,
      phone: phone,
      email: formValues.email,
      total: selectedInvoice.invoice_balance,
      address_1: addressData.street1
        ? addressData.street1
        : formValues.address1
        ? formValues.address1
        : null,
      address_2: addressData.street2
        ? addressData.street2
        : formValues.address2
        ? formValues.address2
        : "",
      address_city: addressData.city
        ? addressData.city
        : formValues.city
        ? formValues.city
        : null,
      address_state:
        addressData.state && addressData.state.length == 2
          ? addressData.state
          : formValues.state
          ? formValues.state
          : "NY",
      address_zip: addressData.postal
        ? addressData.postal
        : formValues.zip
        ? formValues.zip
        : null,
      address_country:
        addressData.country && addressData.country.length == 3
          ? addressData.country
          : this.state.country
          ? this.state.country
          : "USA",
      bank_account: accountNo,
      bank_routing: routingNo,
      bank_type: formValues.TransCode == "Checking" ? "checking" : "savings",
      bank_holder_type: "personal",
      method: "bank",
      validate: false,
      send_reciept: false,
      url: "https://omni.fattmerchant.com/#/bill/",
      meta: {
        reference: "Payment made in ImagineShare", // optional - will show up in emailed receipts
        memo: "Payment made in ImagineShare", // optional - will show up in emailed receipts
        otherField1: `${clientData.name}|${match.params.clientId}|${
          selectedFirm && selectedFirm._id
        }|${selectedInvoice.invoice_id}`,
        subtotal: selectedInvoice.invoice_balance, // optional - will show up in emailed receipts
        tax: 0, // optional - will show up in emailed receipts
      },
    };

    this.fattJs
      .pay(extraDetails)
      .then((completedTransaction) => {
        completedTransaction["card_last_four"] = tokenizeObj.card_last_four;
        completedTransaction["StaxToken"] = tokenizeObj.id;
        completedTransaction["payment_note"] = tokenizeObj.nickname;
        this.saveCardInformation(completedTransaction);
      })
      .catch((e) => {
        let msg = e.message ? e.message : e.errors[0];
        toast.error(msg || "Please enter valid information.", {
          duration: 5000,
        });
      });
  };

  saveCardInformation(result) {
    const { match, dispatch, handleCloseModal, cardDetails, selectedFirm } =
      this.props;
    const { formValues, phone, accountNo } = this.state;
    const achNo = accountNo.toString();
    let cardObj = {};
    cardObj["firm_id"] = selectedFirm && selectedFirm._id;
    cardObj["client_id"] = match.params.clientId;
    cardObj["CardNo"] = achNo.substring(6, 10);
    cardObj["NameOnCard"] = formValues.FirstName + " " + formValues.LastName;
    cardObj["TransType"] = "ACH";
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
    handleCloseModal(false);
    setTimeout(() => {
      toast.success("Paid successfully.", {
        duration: 5000,
      });
    }, 5000);
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
    const { match, dispatch, selectedInvoice, selectedFirm } = this.props;
    let paymentHeader = {};
    paymentHeader["StaxID"] = result.id;
    paymentHeader["firm_id"] = selectedFirm && selectedFirm._id;
    paymentHeader["client_id"] = match.params.clientId;
    paymentHeader["invoice_id"] = selectedInvoice.invoice_id;
    paymentHeader["invoice_number"] = selectedInvoice.invoice_number;
    paymentHeader["payment_note"] = result.payment_note;
    paymentHeader["payment_date"] = result.paid_at;
    paymentHeader["payment_type"] = "ACH";
    paymentHeader["amount"] = result.total;

    // call create payment header
    dispatch(paymentActions.createPaymentHeader(paymentHeader));
  }

  createPaymentDetails() {}

  render() {
    const {
      formValues,
      isValidForm,
      emailIsValid,
      emailError,
      isClosed,
      isNewBank,
      phone,
      accountNo,
      routingNo,
      country,
      accountNoError,
      routingNoError,
      accountNoIsValid,
      routingNoIsValid,
    } = this.state;

    const types = ["Checking", "Savings"];
    const {
      clientStore,
      selectedInvoice,
      paymentStore,
      cardDetails,
      match,
      addressStore,
    } = this.props;
    const clientData = clientStore && clientStore.byId[match.params.clientId];
    const isFetching =
      paymentStore.selected && !paymentStore.selected.isFetching;

    const addressData =
      addressStore && addressStore.selected && addressStore.selected.address;

    const handleCountry = (e) => {
      this.setState({
        country: e.target.value,
      });
    };

    return (
      <div>
        {!isFetching ? (
          <div className="-loading-hero">
            <div className="u-centerText">
              <div className="loading"></div>
            </div>
          </div>
        ) : (
          <div>
            <div>
              <div>
                <ul className="flex-container nowrap p-my-2">
                  <li className="flex-item service-line-item p-ml-0">
                    <b>Amount to charge</b>
                    <span className="p-px-3 ic-font-13">
                      <NumberFormat
                        thousandsGroupStyle="thousand"
                        value={
                          selectedInvoice && selectedInvoice.invoice_balance
                        }
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
                {isNewBank ? (
                  <div>
                    <ul className="flex-container nowrap p-mb-1">
                      <li className="flex-item service-line-item p-ml-0 p-mt-15">
                        <b className="required-field">Account to Debit</b>
                      </li>
                      <li className="flex-item service-line-item">
                        <div className="p-pt-2 ic-font-13">
                          <SelectFromObject
                            placeholder="Choose type..."
                            items={types}
                            change={(e) => this.handleType(e)}
                            selected={formValues.TransCode}
                          />
                        </div>
                      </li>
                    </ul>
                    <ul className="flex-container nowrap">
                      <li className="flex-item service-line-item p-ml-0">
                        <b className="required-field">First Name</b>
                        <div className="p-pt-2 ic-font-13">
                          <TextInput
                            name="FirstName"
                            value={formValues.FirstName || ""}
                            change={(e) => this.handleBankFormChange(e, null)}
                          />
                        </div>
                      </li>
                      <li className="flex-item service-line-item">
                        <b className="required-field">Last Name</b>
                        <div className="p-pt-2 ic-font-13">
                          <TextInput
                            name="LastName"
                            value={formValues.LastName || ""}
                            change={(e) => this.handleBankFormChange(e, null)}
                          />
                        </div>
                      </li>
                    </ul>
                    <ul className="flex-container nowrap">
                      <li className="flex-item service-line-item p-ml-0">
                        <b className="required-field">Phone No</b>
                        <div className="p-pt-2 ic-font-13">
                          <NumberFormat
                            value={phone}
                            format="### ### ####"
                            name="phone"
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
                            change={(e) =>
                              this.handleBankFormChange(e, "email")
                            }
                            autoComplete="nope"
                            required
                          />
                        </div>
                        {!emailIsValid && (
                          <div className="ic-red">{emailError}</div>
                        )}
                      </li>
                    </ul>

                    {addressData == null && (
                      <div>
                        <ul className="flex-container nowrap">
                          <li className="flex-item service-line-item p-ml-0">
                            <b className="required-field">Address 1</b>
                            <div className="p-pt-2 ic-font-13">
                              <TextInput
                                name="address1"
                                value={formValues.address1 || ""}
                                change={(e) =>
                                  this.handleBankFormChange(e, null)
                                }
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
                                change={(e) =>
                                  this.handleBankFormChange(e, null)
                                }
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
                                change={(e) =>
                                  this.handleBankFormChange(e, null)
                                }
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
                                change={(e) =>
                                  this.handleBankFormChange(e, null)
                                }
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
                                change={(e) =>
                                  this.handleBankFormChange(e, null)
                                }
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
                        <b className="required-field">Account Number</b>
                        <div className="p-pt-2 ic-font-13">
                          <NumberFormat
                            value={accountNo}
                            allowEmptyFormatting={true}
                            allowLeadingZeros={true}
                            className="custom-input"
                            // format="##########"
                            onValueChange={(e) => this.handleAccountNo(e)}
                          />
                        </div>
                        {!accountNoIsValid && (
                          <div className="ic-red">{accountNoError}</div>
                        )}
                      </li>
                      <li className="flex-item service-line-item">
                        <b className="required-field">Routing Number</b>
                        <div className="p-pt-2 ic-font-13">
                          <NumberFormat
                            value={routingNo}
                            allowEmptyFormatting={true}
                            allowLeadingZeros={true}
                            className="custom-input"
                            // format="#########"
                            onValueChange={(e) => this.handleRoutingNo(e)}
                          />
                        </div>
                        {!routingNoIsValid && (
                          <div className="ic-red">{routingNoError}</div>
                        )}
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
                          {cardDetails && cardDetails.NameOnCard}
                        </span>
                      </li>
                    </ul>
                    <ul className="flex-container nowrap p-my-2">
                      <li className="flex-item service-line-item p-ml-0 width-50p">
                        <b>Last 4 digits</b>
                      </li>
                      <li className="flex-item service-line-item p-ml-0">
                        <span className="p-px-3 ic-font-13">
                          {cardDetails && cardDetails.CardNo}
                        </span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              <div>
                {cardDetails && cardDetails.StaxCustomerID && !isNewBank && (
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
                      onClick={this.handleNewBank}
                    >
                      Add New Bank
                    </button>
                  </a>
                )}
                {!isNewBank ? (
                  <a href="#">
                    <button
                      className="yt-btn x-small"
                      type="button"
                      disabled={
                        cardDetails && cardDetails.StaxCustomerID ? false : true
                      }
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
        )}
      </div>
    );
  }
}

BankForm.propTypes = {};

export default BankForm;
