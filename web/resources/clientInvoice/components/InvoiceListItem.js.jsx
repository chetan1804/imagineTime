import React from "react";
import moment from "moment";
import ReactTooltip from "react-tooltip";
import NumberFormat from "react-number-format";

const InvoiceListItem = ({
  data,
  handleInvoiceModal,
  handlePaymentModal,
  index,
  selectedFirm,
  handleAlertModal,
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
          data-for="edit"
          onClick={() => handleInvoiceModal("edit", data)}
        >
          <i
            className="fas fa-edit"
            title="Edit"
            style={{ marginRight: 10 }}
          ></i>
        </a>
        <ReactTooltip id="edit" place="top" type="dark" effect="solid">
          <span>Edit</span>
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

        <a
          data-tip
          data-for="email"
          className={
            selectedFirm && selectedFirm.stax_status != "APPROVED"
              ? "disabled"
              : ""
          }
          onClick={() => handleAlertModal("email", data)}
        >
          <i class="fas fa-envelope" style={{ marginRight: 10 }}></i>
        </a>
        <ReactTooltip id="email" place="top" type="dark" effect="solid">
          <span>Email</span>
        </ReactTooltip>
        <a
          data-tip
          data-for="delete"
          onClick={() => handleAlertModal("delete", data)}
        >
          <i
            className="far fa-trash-alt"
            style={{ color: "red", marginRight: 10 }}
          ></i>
        </a>
        <ReactTooltip id="delete" place="top" type="dark" effect="solid">
          <span>Delete</span>
        </ReactTooltip>

        {/* {data && index == 0 ? (
          <a
            data-tip
            data-for="create"
            onClick={() => handleInvoiceModal("add", data)}
            className={isDisabled ? "disabled" : ""}
          >
            <i className="fas fa-plus" title="Create"></i>
          </a>
        ) : (
          <span>&nbsp;&nbsp;&nbsp;</span>
        )}
        <ReactTooltip id="create" place="top" effect="solid">
          <span>Create invoice</span>
        </ReactTooltip> */}
      </td>
    </tr>
  );
};

InvoiceListItem.propTypes = {};

export default InvoiceListItem;
