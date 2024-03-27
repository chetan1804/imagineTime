import React from "react";
import NumberFormat from "react-number-format";;
import ReactTooltip from "react-tooltip";
import moment from "moment";

const TransactionListItem = ({ data, key, handleAction }) => {
  const format = "YYYY-MM-DD";
  const transaction = data;
  const payment = data.payment_method;
  const customer = data.customer;

  return (
    <tr key={key} className="ic-font-13">
      <td className="p-text-center p-pt-3">
        {moment(transaction.created_at).format(format)}
      </td>
      <td className="p-text-left p-pt-3">{transaction.id}</td>
      <td className="p-text-left p-pt-3">
        {customer.firstname} {customer.lastname}
      </td>
      <td className="p-text-left p-pt-3">
        {transaction.ClientName || "-"}
      </td>
      <td className="p-text-center p-pt-3">
        {payment.method == "card" ? (
          payment.card_type == "visa" ? (
            <i
              title="Visa"
              class="fab fa-cc-visa f-size-25"
              style={{ color: "#0DA79D" }}
            ></i>
          ) : payment.card_type == "mastercard" ? (
            <i
              title="Mastercard"
              class="fab fa-cc-mastercard f-size-25"
              style={{ color: "#0DA79D" }}
            ></i>
          ) : payment.card_type == "discover" ? (
            <i
              title="Discover"
              class="fab fa-cc-discover f-size-25"
              style={{ color: "#0DA79D" }}
            ></i>
          ) : payment.card_type == "amex" ? (
            <i
              title="Amex"
              class="fab fa-cc-amex ic-amex f-size-25"
              style={{ color: "#0DA79D" }}
            ></i>
          ) : (
            ""
          )
        ) : (
          <i
            title="Bank"
            class="fas fa-money-check f-size-25"
            style={{ color: "#f5684d" }}
          ></i>
        )}
      </td>
      <td className="p-text-center p-pt-3">
        <NumberFormat
          thousandsGroupStyle="thousand"
          value={transaction.total}
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
      <td className="p-text-center p-pt-3">
        {!payment.card_type ? (
          "-"
        ) : transaction.child_transactions.length == 0 &&
          transaction.success &&
          payment.card_type ? (
          <div>
            <a data-tip data-for="refund">
              <button
                class="yt-btn x-small success"
                type="button"
                onClick={() => handleAction("refund", data)}
                disabled={!transaction.is_refundable}
                style={{
                  marginRight: 10,
                  height: 28,
                  padding: "2px 8px"
                }}
              >
                Refund
              </button>
            </a>
            <ReactTooltip id="refund" place="top" effect="solid">
              <span>Refund</span>
            </ReactTooltip>
            <a data-tip data-for="void">
              <button
                class="yt-btn x-small success"
                type="button"
                onClick={() => handleAction("void", data)}
                disabled={transaction.is_refundable}
                style={{
                  height: 28,
                  padding: "2px 8px"
                }}
              >
                Void
              </button>
            </a>
            <ReactTooltip id="void" place="top" effect="solid">
              <span>Void</span>
            </ReactTooltip>
          </div>
        ) : transaction.child_transactions.length > 0 &&
          transaction.success &&
          payment.card_type ? (
          <span className="ic-red p-text-bold">{transaction.is_voided ? "Voided" : "Refunded"}</span>
        ) : !transaction.success && payment.card_type ? (
          <div>
            <a data-tip data-for="error">
              <i class="fas fa-exclamation-circle ic-red ic-size-22"></i>
            </a>
            <ReactTooltip id="error" place="top" effect="solid">
              <span>{transaction.message}</span>
            </ReactTooltip>
          </div>
        ) : (
          ""
        )}
      </td>
    </tr>
  );
};

TransactionListItem.propTypes = {};

export default TransactionListItem;
