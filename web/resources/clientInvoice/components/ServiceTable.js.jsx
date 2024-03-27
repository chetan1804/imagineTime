import React from "react";
import Binder from "../../../global/components/Binder.js.jsx";
import ServiceListItem from "./ServiceListItem.js.jsx";

class ServiceTable extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    const { serviceStore, serviceDetails, handleAddRow, handleRemoveRow, validateForm, invoiceStore } = this.props;

    const service = serviceStore.byId;
    const arrData = Object.values(service);
    let invoiceDetails = serviceDetails ? serviceDetails : [];
    const serviceArr =
      arrData &&
      arrData.map((data) => {
        return data;
      });

    return (
      <div>
        <div
          className="yt-table table -workspace-table truncate-cells -yt-edit-table"
          style={{ padding: "0px 8px 0px 8px" }}
        >
          <div className="-table-horizontal-scrolling">
            <div className="table-head">
              <div className="table-cell _40">Service</div>
              <div className="table-cell _40">Description</div>
              <div className="table-cell _10">Price</div>
              <div className="table-cell _10 p-text-center">Action</div>
            </div>
            {invoiceDetails.map((element, index) => {
              return (
                <ServiceListItem
                  data={serviceArr}
                  rowNum={index}
                  rowItem={element}
                  noOfRows={invoiceDetails.length}
                  handleAddRow={handleAddRow}
                  handleRemoveRow={handleRemoveRow}
                  validateForm={validateForm}
                  invoiceStore={invoiceStore}
                />
              );
            })}
          </div>
        </div>
        <br />
      </div>
    );
  }
}

ServiceTable.propTypes = {};

export default ServiceTable;
