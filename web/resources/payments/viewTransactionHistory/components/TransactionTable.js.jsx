import React from "react";

import Binder from "../../../../global/components/Binder.js.jsx";
import TransactionListItem from "./TransactionListItem.js.jsx";
import TransactionModal from "./TransactionModal.js.jsx";

class PaymentTable extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      isClicked: false,
      selectedData: null,
      actionType: "",
    };
  }

  render() {
    const {
      data,
      dispatch,
      match,
      queryStr,
      paginatedList,
      sortBy,
      handleFilter,
      search,
    } = this.props;
    const { selectedData, isClicked, actionType } = this.state;

    const handleAction = (type, data) => {
      this.setState({ isClicked: true });
      if (this.state.isClicked) {
        this.setState({
          isClicked: false,
          actionType: "",
          selectedData: null,
        });
      }

      if (type == "refund") {
        this.setState({
          selectedData: data,
          actionType: "refund",
        });
      } else {
        this.setState({
          selectedData: data,
          actionType: "void",
        });
      }
    };

    const searchTransaction =
      paginatedList &&
      paginatedList.filter(
        (item) =>
          item.id.toLowerCase().indexOf(search.toLowerCase()) !== -1 ||
          JSON.stringify(item.total)
            .toLowerCase()
            .indexOf(search.toLowerCase()) !== -1 ||
          item.customer.firstname.toLowerCase().indexOf(search.toLowerCase()) !== -1
      );

    return (
      <div>
        <div className="yt-container fluid">
          <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table">
            <div className="-table-horizontal-scrolling">
              <div className="table-head">
                <div
                  className="table-cell _10 p-text-center"
                  onClick={() => handleFilter("created_at")}
                >
                  Date &nbsp;
                  {sortBy && sortBy == "created_at" ? (
                    <i className="fad fa-sort-down"></i>
                  ) : sortBy && sortBy == "-created_at" ? (
                    <i className="fad fa-sort-up"></i>
                  ) : (
                    <i className="fad fa-sort"></i>
                  )}
                </div>
                <div className="table-cell _20 p-text-left">
                  Transaction Reference
                </div>
                <div className="table-cell _10 p-text-left">Customer</div>
                <div className="table-cell _10 p-text-left">Client Name</div>
                <div className="table-cell _10 p-text-center">
                  Payment Method
                </div>
                <div
                  className="table-cell _10 p-text-center"
                  onClick={() => handleFilter("total")}
                >
                  Amount &nbsp;
                  {sortBy && sortBy == "total" ? (
                    <i className="fad fa-sort-down"></i>
                  ) : sortBy && sortBy == "-total" ? (
                    <i className="fad fa-sort-up"></i>
                  ) : (
                    <i className="fad fa-sort"></i>
                  )}
                </div>
                <div className="table-cell _10 p-text-center">Action</div>
              </div>
            </div>
            {searchTransaction &&
              searchTransaction.map((x, i) => {
                if (!x) {
                  return null;
                } else {
                  return (
                    <TransactionListItem
                      key={i}
                      data={x}
                      handleAction={handleAction}
                    />
                  );
                }
              })}
          </div>
          <TransactionModal
            handleAction={handleAction}
            selectedData={selectedData}
            isClicked={isClicked}
            actionType={actionType}
            dispatch={dispatch}
            match={match}
            queryStr={queryStr}
          />
        </div>
      </div>
    );
  }
}

PaymentTable.propTypes = {};

export default PaymentTable;
