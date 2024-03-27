import React from "react";
import moment from "moment";
import ReactTooltip from "react-tooltip";
import NumberFormat from "react-number-format";
import { PDFDownloadLink } from "@react-pdf/renderer";

import MyDocument from "../../components/PdfDocument.js.jsx";

const InvoiceListItem = ({
  data,
  handleInvoiceModal,
  handlePaymentModal,
  index,
  deleteInvoice,
  match,
  dispatch,
  selectedFirm,
  handleAlertModal
}) => {
  return (
    <tr key={index} className="ic-font-13">
      <td className="p-p-6">{data && data.invoice_number}</td>
      <td className="p-text-left">{data && data.name}</td>
      <td className="p-text-left">{data && data.description}</td>
      <td className="p-p-6">
        {moment(data && data.invoice_date).utc().format("MM-DD-YYYY")}
      </td>
      <td className="p-p-6">
        {moment(data && data.payment_due_date).utc().format("MM-DD-YYYY")}
      </td>
      <td className="p-text-center">
        {
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
        }
      </td>
      <td className="p-text-center">
        {
          <NumberFormat
            thousandsGroupStyle="thousand"
            value={data && data.invoice_balance}
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
      </td>
      <td className="p-text-center ic-font-15">
      <a data-tip data-for="download" onClick={() => handleAlertModal("generate", data)}>
          <i class="fas fa-file-download" style={{ marginRight: 10 }}></i>
        </a>

        <ReactTooltip id="download" place="top" type="dark" effect="solid">
          <span>Generate and Download PDF</span>
        </ReactTooltip>
        <a
          data-tip
          data-for="pay"
          onClick={() => handlePaymentModal(data)}
          className={
            selectedFirm && selectedFirm.stax_status != "APPROVED"
              ? "disabled"
              : ""
          }
        >
          <i
            className="fab fa-cc-amazon-pay"
            style={{ color: "#F5684D", marginRight: 10 }}
          ></i>
        </a>
        <ReactTooltip id="pay" place="top" type="dark" effect="solid">
          <span>Pay</span>
        </ReactTooltip>
      </td>
    </tr>
  );
};

InvoiceListItem.propTypes = {};

export default InvoiceListItem;
