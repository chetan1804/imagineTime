import React from "react";
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from "../../../global/components/modals/Modal.js.jsx";
import { SelectFromObject } from "../../../global/components/forms";
import * as addressActions from "../../address/addressActions";

import CreditCardForm from "./CreditCardForm.js.jsx";
import BankForm from "./BankForm.js.jsx";

class PaymentModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      type: "",
      isNewCardFlow: false,
    };
    this.handleType = this.handleType.bind(this);
    this.getType = this.getType.bind(this);
  }

  componentDidMount() {
    const { addressId, dispatch } = this.props;
    dispatch(addressActions.fetchSingleAddressById(addressId));
  }

  componentDidUpdate(prevProps) {
    const { paymentIsClicked } = this.props;
    if (prevProps.paymentIsClicked != paymentIsClicked) {
      this.setState({
        type: "",
      });
    }
  }

  handleType(e) {
    this.setState({
      type: e.target.value,
    });
  }

  getType(type) {
    this.setState({
      type: type,
    });
  }

  render() {
    const {
      paymentIsClicked,
      handlePaymentModal,
      clientStore,
      selectedInvoice,
      selectedFirm,
      cardDetails,
      match,
      addressStore,
      dispatch,
      handleCloseModal,
      paymentStore,
      updateInvoice,
    } = this.props;
    const { type } = this.state;
    const types = ["Credit Card", "ACH"];
    let crCardItem =
      cardDetails &&
      cardDetails.filter((data) => data && data.TransType == "CC");
    crCardItem = crCardItem && crCardItem.length > 0 ? crCardItem[0] : {};
    let achCardItem =
      cardDetails &&
      cardDetails.filter((data) => data && data.TransType == "ACH");
    achCardItem = achCardItem && achCardItem.length > 0 ? achCardItem[0] : {};

    return (
      <div>
        <Modal
          isOpen={paymentIsClicked}
          closeAction={handlePaymentModal}
          cardSize="standard"
          showButtons={false}
          showClose={false}
          modalHeader={
            type == ""
              ? "Type of Payment"
              : type === "Credit Card"
              ? "Credit Card Payment"
              : "Ach Payment"
          }
          headerStyle={{
            color: "#F5684D",
          }}
        >
          <div className="-share-link-configuration">
            <div className="-body">
              <div className="grid-container-mod">
                <div className="grid-item">
                  <b className="p-mr-2">Payment Type</b>
                  <SelectFromObject
                    placeholder="Choose type..."
                    items={types}
                    change={(e) => this.handleType(e)}
                    selected={type}
                    style={{ width: "50%", marginTop: -9, marginLeft: 10 }}
                  />
                  {type == "" ? (
                    ""
                  ) : type == "Credit Card" ? (
                    <CreditCardForm
                      close={handlePaymentModal}
                      clientStore={clientStore}
                      handleCloseModal={handleCloseModal}
                      selectedInvoice={selectedInvoice}
                      selectedFirm={selectedFirm}
                      match={match}
                      addressStore={addressStore}
                      getType={this.getType}
                      dispatch={dispatch}
                      cardDetails={crCardItem}
                      paymentStore={paymentStore}
                      updateInvoice={updateInvoice}
                    />
                  ) : (
                    <BankForm
                      close={handlePaymentModal}
                      clientStore={clientStore}
                      selectedInvoice={selectedInvoice}
                      selectedFirm={selectedFirm}
                      addressStore={addressStore}
                      match={match}
                      getType={this.getType}
                      dispatch={dispatch}
                      cardDetails={achCardItem}
                      updateInvoice={updateInvoice}
                      paymentStore={paymentStore}
                      handleCloseModal={handleCloseModal}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

PaymentModal.propTypes = {};

export default PaymentModal;
