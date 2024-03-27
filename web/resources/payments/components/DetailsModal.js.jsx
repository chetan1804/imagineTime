import React from "react";
import moment from "moment";
import NumberFormat from "react-number-format";

import Binder from "../../../global/components/Binder.js.jsx";
import Modal from "../../../global/components/modals/Modal.js.jsx";

class DetailsModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const {
      handleDetailModal,
      detailIsClicked,
      selectedInvoice,
      invoiceStore,
    } = this.props;
    const isFetching =
      invoiceStore.selected && !invoiceStore.selected.isFetching;
    return (
      <div>
        <Modal
          isOpen={detailIsClicked}
          closeAction={handleDetailModal}
          cardSize="large"
          showButtons={true}
          modalHeader="Details"
          showClose={false}
          headerStyle={{
            color: "#F5684D",
          }}
        >
          {!isFetching ? (
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
                    <b>Invoice Date</b>
                    <div className="p-pt-2 ic-font-13">
                      {moment(
                        selectedInvoice && selectedInvoice.invoice_date
                      ).format("MM-DD-YYYY")}
                    </div>
                  </li>
                  <li className="flex-item service-line-item">
                    <b>Payment Due Date</b>
                    <div className="p-pt-2 ic-font-13">
                      {moment(
                        selectedInvoice && selectedInvoice.payment_due_date
                      ).format("MM-DD-YYYY")}
                    </div>
                  </li>
                </ul>
                <ul className="flex-container nowrap">
                  <li className="flex-item">
                    <b>Memo</b>
                    <div className="p-pt-2 ic-font-13">
                      {selectedInvoice && selectedInvoice.description}
                    </div>
                  </li>
                </ul>
              </div>
              <div className="sample">
                <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table">
                  <div className="-table-horizontal-scrolling">
                    <div className="table-head">
                      <div className="table-cell _20">Service Name</div>
                      <div className="table-cell _20">Description</div>
                      <div className="table-cell _20  p-text-center">Price</div>
                    </div>
                  </div>
                  {selectedInvoice &&
                    selectedInvoice.invoice_details.map((data, i) => {
                      if (!data) {
                        return null;
                      } else {
                        return (
                          <tr key={i} className="ic-font-13 service-line-item">
                            <td className="p-text-left">
                              {data && data.service}
                            </td>

                            <td className="p-text-left">
                              {data && data.invoice_description}
                            </td>

                            <td className="p-text-center">
                              <NumberFormat
                                thousandsGroupStyle="thousand"
                                value={data && data.invoice_amount}
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
                            </td>
                          </tr>
                        );
                      }
                    })}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }
}

DetailsModal.propTypes = {};

export default DetailsModal;
