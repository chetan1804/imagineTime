import React from "react";

import Binder from "../../../global/components/Binder.js.jsx";

import PaymentHeaderListItems from "./PaymentListItems.js.jsx";
import DetailsModal from "./DetailsModal.js.jsx";

import Search from "../../../global/components/forms/SearchInput.js.jsx";
import PageTabber from "../../../global/components/pagination/PageTabber.js.jsx";

class PaymentTable extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      detailIsClicked: false,
      search: "",
    };
    this._bind("updateSearch");
  }

  updateSearch = (event) => {
    this.setState({ search: event.target.value.substr(0, 20) });
  };

  render() {
    const {
      paymentData,
      dispatch,
      getByIdInvoice,
      selectedInvoice,
      invoiceStore,
      paginatedList,
      sortBy,
      handleFilter,
      utilPaymentStore,
      handleSetPagination,
      setPerPage,
    } = this.props;
    const { detailIsClicked, search } = this.state;

    const handleDetailModal = (data) => {
      this.setState({ detailIsClicked: true });
      dispatch(getByIdInvoice(data && data.invoice_id));
      if (detailIsClicked) {
        this.setState({ detailIsClicked: false, isUpdated: false });
      }
    };

    const paymentArr = Object.values(paginatedList);

    const searchPayment =
      paymentArr &&
      paymentArr.filter(
        (item) =>
          JSON.stringify(item.invoice_number)
            .toLowerCase()
            .indexOf(search.toLowerCase()) !== -1 ||
          item.payment_note.toLowerCase().indexOf(search.toLowerCase()) !==
            -1 ||
          JSON.stringify(item.amount)
            .toLowerCase()
            .indexOf(search.toLowerCase()) !== -1
      );

    return (
      <div>
        <div className="yt-toolbar">
          <div className="yt-tools space-between">
            <div className="-filters -left"></div>
            <div className="yt-tools -right">
              <div className="search">
                <Search
                  value={search}
                  change={(e) => this.updateSearch(e)}
                  placeholder="Search payment..."
                  className="search-fs-12"
                />
              </div>
            </div>
          </div>
        </div>
        <PageTabber
          totalItems={utilPaymentStore.items && utilPaymentStore.items.length}
          totalPages={Math.ceil(
            utilPaymentStore.items &&
              utilPaymentStore.items.length / utilPaymentStore.pagination &&
              utilPaymentStore.pagination.per
          )}
          pagination={utilPaymentStore.pagination}
          setPagination={this._handleSetPagination}
          setPerPage={this._setPerPage}
          viewingAs="top"
          itemName="payments"
        />
        {paginatedList && paginatedList.length != 0 ? (
          <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table">
            <div className="-table-horizontal-scrolling">
              <div class="table-head">
                <div
                  class="table-cell _4 p-text-left"
                  onClick={() => handleFilter("invoice_number")}
                >
                  Invoice # &nbsp;
                  {sortBy && sortBy == "invoice_number" ? (
                    <i className="fad fa-sort-down"></i>
                  ) : sortBy && sortBy == "-invoice_number" ? (
                    <i className="fad fa-sort-up"></i>
                  ) : (
                    <i className="fad fa-sort"></i>
                  )}
                </div>
                <div class="table-cell _10 p-text-left">Client Name</div>
                <div class="table-cell _20 p-text-left">Payment Note</div>
                <div
                  class="table-cell _10 p-text-left"
                  onClick={() => handleFilter("payment_date")}
                >
                  Payment Date &nbsp;
                  {sortBy && sortBy == "payment_date" ? (
                    <i className="fad fa-sort-down"></i>
                  ) : sortBy && sortBy == "-payment_date" ? (
                    <i className="fad fa-sort-up"></i>
                  ) : (
                    <i className="fad fa-sort"></i>
                  )}
                </div>
                <div
                  class="table-cell _10 p-text-center"
                  onClick={() => handleFilter("amount")}
                >
                  Payment Amount &nbsp;
                  {sortBy && sortBy == "amount" ? (
                    <i className="fad fa-sort-down"></i>
                  ) : sortBy && sortBy == "-amount" ? (
                    <i className="fad fa-sort-up"></i>
                  ) : (
                    <i className="fad fa-sort"></i>
                  )}
                </div>
                <div class="table-cell _8 p-text-center">Details</div>
              </div>
            </div>
            {searchPayment &&
              searchPayment.map((data, i) => {
                return (
                  <PaymentHeaderListItems
                    data={data}
                    index={i}
                    handleDetailModal={handleDetailModal}
                  />
                );
              })}
          </div>
        ) : (
          <div className="hero -empty-hero">
            <div className="u-centerText">
              <h2>No payment data.</h2>
            </div>
          </div>
        )}
        <PageTabber
          totalItems={utilPaymentStore.items && utilPaymentStore.items.length}
          totalPages={Math.ceil(
            utilPaymentStore.items &&
              utilPaymentStore.items.length / utilPaymentStore.pagination &&
              utilPaymentStore.pagination.per
          )}
          pagination={utilPaymentStore.pagination}
          setPagination={handleSetPagination}
          setPerPage={setPerPage}
          viewingAs="bottom"
          itemName="payments"
        />
        <DetailsModal
          detailIsClicked={detailIsClicked}
          handleDetailModal={() => handleDetailModal()}
          selectedInvoice={selectedInvoice}
          invoiceStore={invoiceStore}
        />
      </div>
    );
  }
}

PaymentTable.propTypes = {};

export default PaymentTable;
