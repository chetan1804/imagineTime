import React from "react";
import NumberFormat from "react-number-format";

import Binder from "../../../../global/components/Binder.js.jsx";
import Modal from "../../../../global/components/modals/Modal.js.jsx";
// import Swal from "sweetalert2";

import * as transactionActions from "../TransactionAction";

// let Toast = Swal.mixin({
//   toast: true,
//   position: "top-end",
//   showConfirmButton: false,
//   timer: 4000,
//   timerProgressBar: true,
//   didOpen: (toast) => {
//     toast.addEventListener("mouseenter", Swal.stopTimer);
//     toast.addEventListener("mouseleave", Swal.resumeTimer);
//   },
// });

class TransactionModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { isClicked, handleAction, selectedData, actionType } = this.props;

    const handleSubmit = (type, rowData) => {
      const { dispatch, handleAction, match, queryStr } = this.props;
      let obj = {
        transactionId: rowData && rowData.id,
        amount: rowData && rowData.total,
        invoiceid:
          rowData &&
          rowData.meta &&
          rowData.meta.otherField1 &&
          rowData.meta.otherField1.split("|")[3],
        type: type,
        firmId: match.params.firmId,
      };
      dispatch(transactionActions.voidOrRefund(obj));
      setTimeout(() => {
        // Toast.fire({
        //   icon: "info",
        //   title: "Please wait..",
        // });
        handleAction();
      }, 500);

      setTimeout(() => {
        dispatch(
          transactionActions.getTransactionDetails(
            match.params.firmId,
            queryStr
          )
        );
      }, 3500);
    };

    return (
      <div>
        <Modal
          isOpen={isClicked}
          closeAction={() => handleAction()}
          cardSize="large"
          showButtons={true}
          showClose={false}
          modalHeader={
            actionType == "refund" ? "Refund Transaction" : "Void Transaction"
          }
          confirmAction={() =>
            handleSubmit(
              actionType == "refund" ? "refund" : "void",
              selectedData
            )
          }
          confirmText={
            actionType == "refund"
              ? `Refund $${selectedData && selectedData.total}`
              : `Void $${selectedData && selectedData.total}`
          }
          closeText="Cancel"
        >
          <div className="-share-link-configuration">
            <ul className="flex-container nowrap p-my-2">
              <li className="flex-item service-line-item p-ml-0">
                <b>Customer</b>
                <p className="f-size-14">
                  {selectedData &&
                    selectedData.customer &&
                    selectedData.customer.firstname}{" "}
                  {selectedData &&
                    selectedData.customer &&
                    selectedData.customer.lastname}
                </p>
              </li>
              <li className="flex-item service-line-item p-ml-0">
                <b>Total</b>
                <p className="f-size-14">
                  <NumberFormat
                    thousandsGroupStyle="thousand"
                    value={selectedData && selectedData.total}
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
                </p>
              </li>
            </ul>
            <ul className="flex-container nowrap">
              <li className="flex-item service-line-item p-ml-0">
                <b>Transaction Id</b>
                <p className="f-size-14">{selectedData && selectedData.id}</p>
              </li>
              <li className="flex-item service-line-item p-ml-0">
                <b>
                  Refund Total (NET:{" "}
                  <NumberFormat
                    thousandsGroupStyle="thousand"
                    value={selectedData && selectedData.total}
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
                  )
                </b>
                <p className="f-size-14">
                  <NumberFormat
                    thousandsGroupStyle="thousand"
                    value={selectedData && selectedData.total}
                    prefix="$"
                    decimalSeparator="."
                    displayType="input"
                    type="text"
                    className="custom-input"
                    thousandSeparator={true}
                    allowNegative={true}
                    decimalScale={2}
                    fixedDecimalScale={true}
                    allowEmptyFormatting={true}
                    allowLeadingZeros={true}
                    disabled={true}
                  />
                </p>
              </li>
            </ul>
            <ul className="flex-container nowrap">
              <li className="flex-item service-line-item p-ml-0">
                <b>Memo</b>
                <p className="f-size-14">
                  {(selectedData && selectedData["meta"]["memo"]) || "-"}
                </p>
              </li>
            </ul>
          </div>
        </Modal>
      </div>
    );
  }
}

TransactionModal.propTypes = {};

export default TransactionModal;
