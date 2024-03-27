import React from "react";
import NumberFormat from "react-number-format";
import ReactTooltip from "react-tooltip";
import { TextInput } from "../../../../global/components/forms";

import Binder from "../../../../global/components/Binder.js.jsx";
import { SelectFromObject } from "../../../../global/components/forms";

class ServiceListItem extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      rowItem: this.props.rowItem,
      serviceId: null,
      disabled: "disabled",
    };
    this.handleService = this.handleService.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.validateRow = this.validateRow.bind(this);
    this.formateAmount = this.formateAmount.bind(this);
  }

  handleChange(e) {
    const { rowItem } = this.state;
    const { validateForm } = this.props;
    rowItem[e.target.name] = e.target.value;
    rowItem["isEditFlow"] = false;
    this.setState({
      rowItem: rowItem,
    });
    this.validateRow(e.target.value);
    validateForm();
  }

  formateAmount(e) {
    const { rowItem } = this.state;
    const { validateForm } = this.props;
    rowItem["invoice_amount"] = parseFloat(e.value);
    rowItem["isEditFlow"] = false;
    this.setState({
      rowItem: rowItem,
    });
    this.validateRow(e.value);
    validateForm();
  }

  validateRow(value) {
    let str = "";
    if (!value || value == ".00" || value == "0.00") {
      str = "disabled";
    }

    this.setState({
      disabled: str,
    });
  }

  handleService(e) {
    const { data, rowItem, validateForm } = this.props;
    this.setState({
      serviceId: parseInt(e.target.value),
    });
    const filteredService = data.filter(
      (service) => service._id == e.target.value
    );
    rowItem["isEditFlow"] = false;
    rowItem["service_id"] = parseInt(e.target.value);
    rowItem["invoice_description"] = filteredService[0].description;
    rowItem["invoice_amount"] = parseFloat(filteredService[0].price);
    this.setState({
      rowItem: rowItem,
    });
    validateForm();
  }

  handleRemoveItem = (item, rowNum) => {
    this.props.handleRemoveRow(item, rowNum);
  };

  handleAddRow = (item) => {
    this.props.handleAddRow(item);
  };

  render() {
    const {
      data,
      rowNum,
      handleAddRow,
      handleRemoveRow,
      noOfRows,
      rowItem,
      invoiceStore,
    } = this.props;
    const { disabled, serviceId } = this.state;
    const MAX_VAL = 5000;
    const withValueLimit = ({ floatValue }) => floatValue <= MAX_VAL;

    if (serviceId == null) {
      rowItem["service_id"] = rowItem && rowItem.service_id;
    } else {
      rowItem["service_id"] = this.state.serviceId;
    }

    return (
      <tr className="ic-font-13 service-line-item">
        <td className="p-pr-2">
          <SelectFromObject
            placeholder="Choose service..."
            items={data}
            change={this.handleService}
            selected={rowItem && rowItem.service_id}
            display="service"
            value="_id"
          />
        </td>

        <td className="p-pr-2">
          <TextInput
            change={this.handleChange}
            name="invoice_description"
            value={rowItem && rowItem.invoice_description}
          />
        </td>

        <td className="p-pr-2 p-pt-2">
          <NumberFormat
            thousandsGroupStyle="thousand"
            value={rowItem && rowItem.invoice_amount == 0 ? 0 : rowItem.invoice_amount}
            isAllowed={withValueLimit}
            prefix="$"
            decimalSeparator="."
            displayType="input"
            type="text"
            thousandSeparator={true}
            allowNegative={true}
            decimalScale={2}
            fixedDecimalScale={true}
            allowEmptyFormatting={true}
            allowLeadingZeros={true}
            className="custom-input cost-text"
            onValueChange={this.formateAmount}
          />
        </td>
        <td className="p-text-center">
          <span>
            {rowNum == noOfRows - 1 ? (
              <span>
                {rowItem.isEditFlow == true && (
                  <a
                    data-tip
                    data-for="minus"
                    onClick={() => handleRemoveRow(rowItem, rowNum)}
                  >
                    <i
                      className="fas fa-minus p-mr-1"
                      style={{ color: "#f5684d" }}
                    ></i>
                  </a>
                )}

                <a
                  data-tip
                  data-for="add"
                  className={
                    invoiceStore &&
                    (invoiceStore.isValidForm || rowItem.isEditFlow == true)
                      ? ""
                      : disabled
                  }
                  onClick={() => handleAddRow(rowItem)}
                >
                  <i className="fas fa-plus"></i>
                </a>
              </span>
            ) : (
              <span>
                <a
                  data-tip
                  data-for="minus"
                  onClick={() => handleRemoveRow(rowItem, rowNum)}
                >
                  <i className="fas fa-minus" style={{ color: "#f5684d" }}></i>
                </a>
                <a>
                  <span style={{ padding: "0 8px" }}></span>
                </a>
              </span>
            )}
          </span>

          <ReactTooltip id="add" place="top" type="dark" effect="solid">
            <span>Add row</span>
          </ReactTooltip>

          <ReactTooltip id="minus" place="top" type="dark" effect="solid">
            <span>Remove row</span>
          </ReactTooltip>
        </td>
      </tr>
    );
  }
}

ServiceListItem.propTypes = {};

export default ServiceListItem;
