import React from "react";
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from "../../../global/components/modals/Modal.js.jsx";
import ServiceTable from "./ServiceTable.js.jsx";
import { v4 as uuidv4 } from "uuid";
import { DateTime } from "luxon";
import moment from "moment";
//import toast from "react-hot-toast";

import {
  SingleDatePickerInput,
  TextAreaInput,
} from "../../../global/components/forms";
class InvoiceModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      isDisabled: false,
      fireEvent: false,
    };
    this.handleDate = this.handleDate.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleDescription = this.handleDescription.bind(this);
    this.handleAddRow = this.handleAddRow.bind(this);
    this.handleRemoveRow = this.handleRemoveRow.bind(this);
    this.verifyValidForm = this.verifyValidForm.bind(this);
  }

  handleAddRow = (rowitem) => {
    const { selectedInvoice, match } = this.props;
    let serviceDetails = selectedInvoice && selectedInvoice.invoice_details;
    if (
      rowitem != "isNew" &&
      (!rowitem.invoice_description ||
        !rowitem.invoice_amount ||
        !rowitem.service_id)
    ) {
      return false;
    }
    let newItem = {
      client_id: parseInt(match.params.clientId),
      firm_id: parseInt(match.params.firmId),
      invoice_description: "",
      invoice_amount: 0,
      service_id: null,
      isNewDetail: true,
      invoiceDetail_id: Math.random(),
    };
    serviceDetails.push(newItem);
    this.setState({
      fireEvent: true,
    });
    this.verifyValidForm();
  };

  handleRemoveRow = (rowitem, rowNum) => {
    const { selectedInvoice, dispatch, deleteInvoiceDetail, updateInvoice } =
      this.props;
    let serviceDetails = selectedInvoice && selectedInvoice.invoice_details;
    let index = serviceDetails.findIndex(
      (x) => x.invoiceDetail_id == rowitem.invoiceDetail_id
    );
    if (rowitem && rowitem["isNewDetail"] == true) {
      serviceDetails.splice(index, 1);
    } else {
      dispatch(deleteInvoiceDetail(rowitem["invoiceDetail_id"]));
      serviceDetails.splice(index, 1);
      // we need to update invoice table
      selectedInvoice.invoice_amount = serviceDetails
        .filter((item) => {
          return item.isNewDetail != true;
        })
        .reduce(function (a, b) {
          return a + +b.invoice_amount;
        }, 0);
      selectedInvoice.invoice_balance = selectedInvoice.invoice_amount;
      dispatch(updateInvoice(selectedInvoice, "remove"));
      this.setState({
        isUpdated: false,
      });
    }
    this.setState({
      fireEvent: true,
    });
  };

  handleDate(e) {
    const { selectedInvoice } = this.props;
    if (e.target.name === "invoice_date") {
      let date = new Date(e.target.value);

      this.setState({
        invoiceDate: date.toDateString(),
      });

      selectedInvoice["invoice_date"] = e.target.value;
      this.verifyValidForm();
    } else {
      const date = new Date(e.target.value);

      this.setState({
        paymentDueDate: date.toDateString(),
      });
      selectedInvoice["payment_due_date"] = e.target.value;
      this.verifyValidForm();
    }

    var start = moment(selectedInvoice["invoice_date"]).format("MM-DD-YYYY");
    var end = moment(selectedInvoice["payment_due_date"]).format("MM-DD-YYYY");
    let validDate = moment(start).isAfter(end, "day");
    if (validDate) {
      selectedInvoice["payment_due_date"] = e.target.value;
    }
    const date = new Date(e.target.value);
    this.setState({
      paymentDueDate: date.toDateString(),
    });
  }

  handleDescription(e) {
    const { selectedInvoice } = this.props;
    this.setState({
      description: e.target.value,
    });
    selectedInvoice["description"] = e.target.value;
    this.validateRow(e.target.value);
    this.verifyValidForm();
  }

  handleSubmit() {
    let {
      selectedInvoice,
      dispatch,
      createInvoice,
      handleInvoiceModal,
      isUpdated,
      updateInvoice,
      invoiceStore,
      lastInvoiceNo,
      getState,
    } = this.props;

    selectedInvoice.invoice_date = moment(
      selectedInvoice.invoice_date
    ).format('YYYY-MM-DDTHH:mm:ss');
    selectedInvoice.payment_due_date = moment(
      selectedInvoice.payment_due_date
    ).format('YYYY-MM-DDTHH:mm:ss');
    selectedInvoice.description = selectedInvoice.description.trim();
    selectedInvoice.isPaid = false;
    selectedInvoice.invoice_amount = selectedInvoice.invoice_details.reduce(
      function (a, b) {
        return a + +b.invoice_amount;
      },
      0
    );
    selectedInvoice.invoice_balance = selectedInvoice.invoice_amount;

    if (!isUpdated) {
      lastInvoiceNo += 1;
      selectedInvoice.paynow_token = uuidv4();
      dispatch(createInvoice(selectedInvoice));
      setTimeout(() => {
        handleInvoiceModal();
        toast.success("Created successfully.", {
          duration: 5000,
        });
      }, 4000);
    } else {
      dispatch(updateInvoice(selectedInvoice));
      setTimeout(() => {
        handleInvoiceModal();
        toast.success("Updated successfully.", {
          duration: 5000,
        });
      }, 4000);
    }
    invoiceStore.isValidForm = false;
    getState();
  }

  validateRow(value) {
    if (!value) {
      this.setState({
        isDisabled: true,
      });
    }
    this.setState({
      fireEvent: true,
    });
  }

  verifyValidForm() {
    const { selectedInvoice, invoiceStore } = this.props;
    invoiceStore.isValidForm = true;
    if (
      !selectedInvoice.invoice_date ||
      !selectedInvoice.payment_due_date ||
      !selectedInvoice.description ||
      selectedInvoice.invoice_details.length == 0
    ) {
      invoiceStore.isValidForm = false;
    } else if (selectedInvoice.invoice_details.length > 0) {
      for (
        let index = 0;
        index < selectedInvoice.invoice_details.length;
        index++
      ) {
        const element = selectedInvoice.invoice_details[index];
        if (
          !element.service_id ||
          !element.invoice_description ||
          !element.invoice_amount ||
          element.invoice_amount == 0
        ) {
          invoiceStore.isValidForm = false;
          break;
        }
      }
    }
    this.setState({
      fireEvent: true,
    });
  }

  verifyValidForm() {
    const { selectedInvoice, invoiceStore } = this.props;
    invoiceStore.isValidForm = true;
    if (
      !selectedInvoice.invoice_date ||
      !selectedInvoice.payment_due_date ||
      !selectedInvoice.description ||
      selectedInvoice.invoice_details.length == 0
    ) {
      invoiceStore.isValidForm = false;
    } else if (selectedInvoice.invoice_details.length > 0) {
      for (
        let index = 0;
        index < selectedInvoice.invoice_details.length;
        index++
      ) {
        const element = selectedInvoice.invoice_details[index];
        if (
          !element.service_id ||
          !element.invoice_description ||
          !element.invoice_amount ||
          element.invoice_amount == 0
        ) {
          invoiceStore.isValidForm = false;
          break;
        }
      }
    }
    this.setState({
      fireEvent: true,
    });
  }

  verifyValidForm() {
    const { selectedInvoice, invoiceStore } = this.props;
    invoiceStore.isValidForm = true;
    if (
      !selectedInvoice.invoice_date ||
      !selectedInvoice.payment_due_date ||
      !selectedInvoice.description ||
      selectedInvoice.invoice_details.length == 0
    ) {
      invoiceStore.isValidForm = false;
    } else if (selectedInvoice.invoice_details.length > 0) {
      for (
        let index = 0;
        index < selectedInvoice.invoice_details.length;
        index++
      ) {
        const element = selectedInvoice.invoice_details[index];
        if (
          !element.service_id ||
          !element.invoice_description ||
          !element.invoice_amount ||
          element.invoice_amount == 0
        ) {
          invoiceStore.isValidForm = false;
          break;
        }
      }
    }
    this.setState({
      fireEvent: true,
    });
  }

  render() {
    const {
      handleInvoiceModal,
      invoiceIsClicked,
      serviceStore,
      isUpdated,
      selectedInvoice,
      invoiceStore,
      match,
    } = this.props;

    selectedInvoice &&
      selectedInvoice.invoice_details &&
      selectedInvoice.invoice_details.map((item) => {
        item["isEditFlow"] = true;
      });

    const isFetching =
      invoiceStore.selected && !invoiceStore.selected.isFetching;

    return (
      <div>
        <Modal
          isOpen={invoiceIsClicked}
          closeAction={handleInvoiceModal}
          cardSize="large"
          modalHeader={isUpdated ? "Update Invoice" : "Create New Invoice"}
          showButtons={true}
          confirmAction={this.handleSubmit}
          confirmText={isUpdated ? "Save" : "Create Invoice"}
          showClose={false}
          disableConfirm={
            invoiceStore &&
            invoiceStore.isValidForm &&
            selectedInvoice &&
            selectedInvoice.invoice_number != 0
              ? false
              : true
          }
          headerStyle={{
            color: "#F5684D",
          }}
        >
          {!isFetching && isUpdated ? (
            <div className="-loading-hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>
          ) : (
            <div className="-share-link-configuration">
              <div className="-body p-p-0">
                <ul className="flex-container nowrap">
                  <li className="flex-item">
                    <b>Invoice Number</b>
                    <div className="p-pt-2 ic-font-13">
                      {selectedInvoice && selectedInvoice.invoice_number}
                    </div>
                  </li>
                  <li className="flex-item service-line-item">
                    <b className={`${isUpdated ? "" : "required-field"}`}>
                      Invoice Date
                    </b>
                    <SingleDatePickerInput
                      change={(e) => this.handleDate(e)}
                      name="invoice_date"
                      numberOfMonths={1}
                      initialDate={
                        selectedInvoice && selectedInvoice.invoice_date
                      }
                      minDate={DateTime.local().toMillis()}
                      inputClasses="custom-date ic-font-13"
                      disabled={isUpdated ? true : false}
                    />
                  </li>
                  <li className="flex-item service-line-item">
                    <b className="required-field">Payment Due Date</b>
                    <SingleDatePickerInput
                      change={(e) => this.handleDate(e)}
                      name="payment_due_date"
                      initialDate={
                        selectedInvoice && selectedInvoice.payment_due_date
                      }
                      numberOfMonths={1}
                      minDate={moment().valueOf(
                        selectedInvoice && selectedInvoice.invoice_date
                      )}
                      inputClasses="custom-date ic-font-13"
                    />
                  </li>
                </ul>
                <ul className="flex-container nowrap">
                  <li className="flex-item">
                    <b className="required-field">Memo</b>
                    <div className="flex-item m-mb-0 m-pb-0 p-ml-0">
                      {" "}
                      <TextAreaInput
                        rows="2"
                        name="description"
                        className="ic-font-13"
                        change={this.handleDescription}
                        value={selectedInvoice && selectedInvoice.description}
                      />
                    </div>
                  </li>
                </ul>
              </div>
              <div className="sample">
                <b className="required-field m-r-13">Line Items</b>
                <b className="top-add">
                  {/* {selectedInvoice &&
                    selectedInvoice.invoice_details &&
                    selectedInvoice.invoice_details.length == 0 && ( */}
                  <a
                    className="yt-btn x-small info"
                    onClick={() => this.handleAddRow("isNew")}
                  >
                    Add Item
                  </a>
                  {/* )} */}
                </b>
                <ServiceTable
                  serviceStore={serviceStore}
                  isUpdated={isUpdated}
                  serviceDetails={
                    selectedInvoice &&
                    selectedInvoice.invoice_details &&
                    selectedInvoice.invoice_details
                  }
                  handleAddRow={this.handleAddRow}
                  handleRemoveRow={this.handleRemoveRow}
                  match={match}
                  validateForm={this.verifyValidForm}
                  invoiceStore={invoiceStore}
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }
}

InvoiceModal.propTypes = {};

export default InvoiceModal;
