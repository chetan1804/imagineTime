import React from "react";
import moment from "moment";
import NumberFormat from "react-number-format";
import ReactTooltip from "react-tooltip";

const PaymentListItems = ({ data, index, handleDetailModal }) => {
  return (
    <tr key={index} className="ic-font-13">
      <td className="p-p-6 p-text-left">{data && data.invoice_number}</td>
      <td className="p-text-left">{data && data.name}</td>
      <td className="p-text-left">{data && data.payment_note}</td>
      <td className="p-p-6">{moment(data && data.payment_date).utc().format("MM-DD-YYYY")}</td>
      <td className="p-p-6 p-text-center">
        {
          <NumberFormat
            thousandsGroupStyle="thousand"
            value={data && data.amount}
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
        <a data-tip data-for="detail" onClick={() => handleDetailModal(data)}>
          <i class="fas fa-info-circle"></i>
        </a>
        <ReactTooltip id="detail" place="top" type="dark" effect="solid">
          <span>Payment Details</span>
        </ReactTooltip>
      </td>
    </tr>
  );
};

PaymentListItems.propTypes = {};

export default PaymentListItems;
