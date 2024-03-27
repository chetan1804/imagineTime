import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Helmet } from "react-helmet";

import * as clientUserActions from "../../clientUser/clientUserActions";
import * as paymentActions from "../PaymentActions";
import * as invoiceActions from "../../clientInvoice/InvoiceActions";

import Binder from "../../../global/components/Binder.js.jsx";
import WorkspaceLayout from "../../client/practice/components/WorkspaceLayout.js.jsx";

import PaymentTable from "../components/PaymentTable.js.jsx";
class PaymentList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      detailIsClicked: false,
    };
    this._bind("_handleSetPagination", "_setPerPage", "_handleFilter");
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match, paymentStore } = this.props;
    dispatch(
      clientUserActions.fetchListIfNeeded(
        "_user",
        loggedInUser._id,
        "status",
        "active"
      )
    );
    dispatch(paymentActions.getPaymentHeader(match.params.clientId));
    this._handleFetchList();
  }

  _handleFetchList() {
    const { match, dispatch } = this.props;
    dispatch(
      paymentActions.setFilter(
        { sortBy: "-invoice_number" },
        match.params.clientId
      )
    );
    this._handleSetPagination({ page: 1, per: 50 });
  }

  _handleSetPagination(newPagination) {
    const { dispatch, match } = this.props;
    dispatch(
      paymentActions.setPagination(newPagination, match.params.clientId)
    );
  }

  _setPerPage(per) {
    let newPagination = {};
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination);
  }

  _handleFilter(sortBy) {
    const { match, dispatch, utilPaymentStore } = this.props;
    let newFilter = utilPaymentStore.filter;
    if (
      utilPaymentStore.filter.sortBy &&
      utilPaymentStore.filter.sortBy.indexOf("-") < 0
    ) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0);
    }
    newFilter.sortBy = sortBy;
    dispatch(paymentActions.setFilter(newFilter, match.params.clientId));
  }

  render() {
    const {
      paymentStore,
      dispatch,
      selectedInvoice,
      invoiceStore,
      utilPaymentStore,
      paginatedList,
      sortBy,
      match,
    } = this.props;

    const isFetching =
      paymentStore.lists &&
      paymentStore.lists[match.params.clientId] &&
      !paymentStore.lists[match.params.clientId].isFetching;

    return (
      <WorkspaceLayout>
        <Helmet>
          <title>Client Payments</title>
        </Helmet>
        {!isFetching ? (
          <div className="-loading-hero">
            <div className="u-centerText">
              <div className="loading"></div>
            </div>
          </div>
        ) : (
          <div>
            <PaymentTable
              utilPaymentStore={utilPaymentStore}
              handleSetPagination={this._handleSetPagination}
              setPerPage={this._setPerPage}
              paymentData={paymentStore.payment}
              dispatch={dispatch}
              getByIdInvoice={invoiceActions.fetchInvoiceGetById}
              selectedInvoice={selectedInvoice}
              invoiceStore={invoiceStore}
              paginatedList={paginatedList}
              sortBy={sortBy}
              handleFilter={this._handleFilter}
            />
          </div>
        )}
      </WorkspaceLayout>
    );
  }
}

PaymentList.propTypes = {};

const mapStoreToProps = (store, props) => {
  const { match } = props;
  const loggedInUser = store.user.loggedIn.user;

  // PAGINATION
  const paymentStore = store.payments;
  const utilPaymentStore = paymentStore.util.getSelectedStore(
    match.params.clientId
  );
  let paymentListItems = paymentStore.util.getList(match.params.clientId);
  let paginatedList = [];
  let orderedList = [];
  let sortBy = "";

  if (paymentListItems) {
    const pagination = utilPaymentStore.pagination || { page: 1, per: 50 };
    sortBy = utilPaymentStore.filter
      ? utilPaymentStore.filter.sortBy
      : "invoice_number";

    // SORT THE LIST
    switch (sortBy) {
      case "invoice_number":
        orderedList = _.orderBy(
          paymentListItems,
          [(item) => item.invoice_number],
          ["asc"]
        );
        break;
      case "-invoice_number":
        orderedList = _.orderBy(
          paymentListItems,
          [(item) => item.invoice_number],
          ["desc"]
        );
        break;
      case "payment_date":
        orderedList = _.orderBy(
          paymentListItems,
          [(item) => item.payment_date],
          ["asc"]
        );
        break;
      case "-payment_date":
        orderedList = _.orderBy(
          paymentListItems,
          [(item) => item.payment_date],
          ["desc"]
        );
        break;
      case "amount":
        orderedList = _.orderBy(
          paymentListItems,
          [(item) => item.amount],
          ["asc"]
        );
        break;
      case "-amount":
        orderedList = _.orderBy(
          paymentListItems,
          [(item) => item.amount],
          ["desc"]
        );
        break;
      default:
        orderedList = _.orderBy(
          paymentListItems,
          [(item) => item.invoice_number],
          ["asc"]
        );
    }

    // APPLY PAGINATION
    const start = (pagination.page - 1) * pagination.per;
    const end = start + pagination.per;
    paginatedList = _.slice(orderedList, start, end);
  }

  return {
    loggedInUser,
    staffStore: store.staff,
    paymentStore: store.payments,
    invoiceStore: store.invoice,
    selectedInvoice: store.invoice.selectedInvoice,
    utilPaymentStore,
    paginatedList,
    sortBy,
  };
};

export default withRouter(connect(mapStoreToProps)(PaymentList));
