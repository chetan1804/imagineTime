import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Helmet } from "react-helmet";

import * as clientActions from "../../client/clientActions";
import * as clientUserActions from "../../clientUser/clientUserActions";
import * as firmActions from "../../firm/firmActions";
import * as invoiceActions from "../InvoiceActions";
import * as serviceActions from "../../services/ServiceActions";
import * as paymentActions from "../../payments/PaymentActions";
import * as userActions from "../../user/userActions";
import * as addressActions from "../../address/addressActions";

import Binder from "../../../global/components/Binder.js.jsx";
import WorkspaceLayout from "../../client/practice/components/WorkspaceLayout.js.jsx";
import { permissions } from "../../../global/utils";
import InvoiceTable from "../components/InvoiceTable.js.jsx";
class InvoiceList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      isFetching: false,
    };
    this._bind("_handleSetPagination", "_setPerPage", "_handleFilter");
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    dispatch(firmActions.fetchSingleFirmByDomain());
    dispatch(userActions.fetchListIfNeeded("_firm", match.params.firmId)); // fetches contacts
    dispatch(userActions.fetchListIfNeeded("_firmStaff", match.params.firmId)); // fetches staff
    dispatch(clientActions.fetchListIfNeeded("_firm", match.params.firmId)); // this should live on every top-level route of the portal
    dispatch(
      clientUserActions.fetchListIfNeeded(
        "_user",
        loggedInUser._id,
        "status",
        "active"
      )
    );
    dispatch(firmActions.fetchListIfNeeded("_user", loggedInUser._id));
    dispatch(invoiceActions.fetchInvoiceList(match.params.clientId));
    dispatch(serviceActions.fetchServiceList());
    dispatch(invoiceActions.getLastInvoiceNumber(match.params.clientId));
    dispatch(paymentActions.getCardDetails(match.params.clientId));

    dispatch(addressActions.fetchList());

    this._handleFetchList();
  }

  _handleFetchList() {
    const { match, dispatch } = this.props;
    dispatch(
      invoiceActions.setFilter(
        { sortBy: "-invoice_number" },
        match.params.clientId
      )
    );
    this._handleSetPagination({ page: 1, per: 50 });
  }

  _handleSetPagination(newPagination) {
    const { dispatch, match } = this.props;
    dispatch(
      invoiceActions.setPagination(newPagination, match.params.clientId)
    );
  }

  _setPerPage(per) {
    let newPagination = {};
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination);
  }

  _handleFilter(sortBy) {
    const { match, dispatch, utilInvoiceStore } = this.props;
    let newFilter = utilInvoiceStore.filter;
    if (
      utilInvoiceStore.filter.sortBy &&
      utilInvoiceStore.filter.sortBy.indexOf("-") < 0
    ) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0);
    }
    newFilter.sortBy = sortBy;
    dispatch(invoiceActions.setFilter(newFilter, match.params.clientId));
  }

  _handleSetPagination(newPagination) {
    const { dispatch, match } = this.props;
    dispatch(
      invoiceActions.setPagination(newPagination, match.params.clientId)
    );
  }

  _setPerPage(per) {
    let newPagination = {};
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination);
  }

  _handleFilter(sortBy) {
    const { match, dispatch, utilInvoiceStore } = this.props;
    let newFilter = utilInvoiceStore.filter;
    if (
      utilInvoiceStore.filter.sortBy &&
      utilInvoiceStore.filter.sortBy.indexOf("-") < 0
    ) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0);
    }
    newFilter.sortBy = sortBy;
    dispatch(invoiceActions.setFilter(newFilter, match.params.clientId));
  }

  _handleSetPagination(newPagination) {
    const { dispatch, match } = this.props;
    dispatch(
      invoiceActions.setPagination(newPagination, match.params.clientId)
    );
  }

  _setPerPage(per) {
    let newPagination = {};
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination);
  }

  _handleFilter(sortBy) {
    const { match, dispatch, utilInvoiceStore } = this.props;
    let newFilter = utilInvoiceStore.filter;
    if (
      utilInvoiceStore.filter.sortBy &&
      utilInvoiceStore.filter.sortBy.indexOf("-") < 0
    ) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0);
    }
    newFilter.sortBy = sortBy;
    dispatch(invoiceActions.setFilter(newFilter, match.params.clientId));
  }

  updateSearch = (event) => {
    this.setState({ search: event.target.value.substr(0, 20) });
  };

  render() {
    const {
      // staffStore,
      match,
      invoiceStore,
      serviceStore,
      dispatch,
      clientStore,
      paymentStore,
      firmStore,
      // clientUserStore,
      addressStore,
      userStore,
      utilInvoiceStore,
      paginatedList,
      sortBy,
    } = this.props;

    const isFetching =
      invoiceStore.lists &&
      invoiceStore.lists[match.params.clientId] &&
      !invoiceStore.lists[match.params.clientId].isFetching;

    const lastInvoiceNo = invoiceStore && invoiceStore.invoice;
    const clientName =
      clientStore &&
      clientStore.byId[match.params.clientId] &&
      clientStore.byId[match.params.clientId].name;
    const selectedFirm = firmStore && firmStore.byId[match.params.firmId];
    const selectedClient =
      clientStore && clientStore.byId[match.params.clientId];

    const addressId =
      clientStore &&
      clientStore.byId[match.params.clientId] &&
      clientStore.byId[match.params.clientId]._primaryAddress;
    return (
      <WorkspaceLayout>
        <Helmet>
          <title>Client Invoices</title>
        </Helmet>
        {!isFetching ? (
          <div className="-loading-hero">
            <div className="u-centerText">
              <div className="loading"></div>
            </div>
          </div>
        ) : (
          <div>
            <InvoiceTable
              addressId={addressId}
              utilInvoiceStore={utilInvoiceStore}
              handleSetPagination={this._handleSetPagination}
              setPerPage={this._setPerPage}
              serviceStore={serviceStore}
              invoiceStore={invoiceStore}
              dispatch={dispatch}
              createInvoice={invoiceActions.sendCreateInvoice}
              updateInvoice={invoiceActions.sendUpdateInvoice}
              getLastInvoiceNo={invoiceActions.getLastInvoiceNumber}
              deleteInvoice={invoiceActions.deleteInvoice}
              match={match}
              lastInvoiceNo={lastInvoiceNo}
              getByIdInvoice={invoiceActions.fetchInvoiceGetById}
              clientName={clientName}
              clientStore={clientStore}
              paymentStore={paymentStore}
              selectedFirm={selectedFirm}
              deleteInvoiceDetail={invoiceActions.deleteInvoiceDetail}
              addressStore={addressStore}
              userStore={userStore}
              selectedClient={selectedClient}
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

InvoiceList.propTypes = {};

const mapStoreToProps = (store, props) => {
  const { match } = props;
  const firmId = match.params.firmId;
  const loggedInUser = store.user.loggedIn.user;
  const isStaffOwner = permissions.isStaffOwner(
    store.staff,
    loggedInUser,
    firmId
  );
  const clientMap = store.client.byId;
  const clientList =
    store.client.lists && store.client.lists._firm
      ? store.client.lists._firm[firmId]
      : null;

  const clientArr =
    clientList &&
    clientList.items &&
    clientList.items.map((clientId) => {
      return clientMap[clientId];
    });

  // PAGINATION
  const invoiceStore = store.invoice;
  const utilInvoiceStore = invoiceStore.util.getSelectedStore(
    match.params.clientId
  );
  let invoiceListItems = invoiceStore.util.getList(match.params.clientId);
  let paginatedList = [];
  let orderedList = [];
  let sortBy = "";

  if (invoiceListItems) {
    const pagination = utilInvoiceStore.pagination || { page: 1, per: 50 };
    sortBy = utilInvoiceStore.filter
      ? utilInvoiceStore.filter.sortBy
      : "invoice_number";

    // SORT THE LIST
    switch (sortBy) {
      case "invoice_number":
        orderedList = _.orderBy(
          invoiceListItems,
          [(item) => item.invoice_number],
          ["asc"]
        );
        break;
      case "-invoice_number":
        orderedList = _.orderBy(
          invoiceListItems,
          [(item) => item.invoice_number],
          ["desc"]
        );
        break;
      case "invoice_amount":
        orderedList = _.orderBy(
          invoiceListItems,
          [(item) => item.invoice_amount],
          ["asc"]
        );
        break;
      case "-invoice_amount":
        orderedList = _.orderBy(
          invoiceListItems,
          [(item) => item.invoice_amount],
          ["desc"]
        );
        break;
      case "invoice_date":
        orderedList = _.orderBy(
          invoiceListItems,
          [(item) => item.invoice_date],
          ["asc"]
        );
        break;
      case "-invoice_date":
        orderedList = _.orderBy(
          invoiceListItems,
          [(item) => item.invoice_date],
          ["desc"]
        );
        break;
      default:
        orderedList = _.orderBy(
          invoiceListItems,
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
    isStaffOwner,
    staffStore: store.staff,
    clientStore: store.client,
    clientUserStore: store.clientUser,
    firmStore: store.firm,
    invoiceStore: store.invoice,
    serviceStore: store.service,
    clientData: clientArr,
    paymentStore: store.payments,
    addressStore: store.address,
    phoneNumberStore: store.phoneNumber,
    userStore: store.user,
    utilInvoiceStore,
    paginatedList,
    sortBy,
  };
};

export default withRouter(connect(mapStoreToProps)(InvoiceList));
