import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import moment from "moment";
import { DateTime } from "luxon";
import NumberFormat from "react-number-format";

import * as clientUserActions from "../../../clientUser/clientUserActions";
import * as transactionActions from "../TransactionAction";

import Binder from "../../../../global/components/Binder.js.jsx";
import Breadcrumbs from "../../../../global/components/navigation/Breadcrumbs.js.jsx";
import PracticeLayout from "../../../../global/practice/components/PracticeLayout.js.jsx";
import {
  DateRangePickerInput,
  SelectFromObject,
} from "../../../../global/components/forms";
import TransactionTable from "../components/TransactionTable.js.jsx";
import PageTabber from "../../../../global/components/pagination/PageTabber.js.jsx";
import Search from "../../../../global/components/forms/SearchInput.js.jsx";

class ViewTransactionHistory extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      filter: {
        dateCreated: {
          startDate: DateTime.local().startOf("month").toMillis(),
          endDate: DateTime.local().toMillis(),
        },
        method: "",
        type: "",
        success: "",
        isFetching: false,
        queryStr: null,
      },
      search: "",
    };
    this._bind(
      "_handleSetPagination",
      "_setPerPage",
      "_handleFilter",
      "prepareQueryString",
      "getTransaction",
      "calculateTotals",
      "updateSearch"
    );
  }

  componentDidMount() {
    const { dispatch, loggedInUser } = this.props;
    dispatch(
      clientUserActions.fetchListIfNeeded(
        "_user",
        loggedInUser._id,
        "status",
        "active"
      )
    );
    this.prepareQueryString(null);
    this._handleFetchList();
  }

  prepareQueryString(e) {
    const { match } = this.props;
    if (e && e.target) {
      let fields = this.state.filter;
      if (e.target.name == "filter.dateCreated") {
        fields.dateCreated.startDate = e.target.value.startDate;
        fields.dateCreated.endDate = e.target.value.endDate;
      } else {
        fields[e.target.name] = e.target.value;
      }

      this.setState({ fields });
    }

    let fields = this.state.filter;

    const format = "YYYY-MM-DD HH:mm:ss";
    let queryStr = `?id=${match.params.firmId}&order=DESC&`;
    if (fields["method"]) {
      queryStr += `method=${fields["method"]}&`;
    }
    if (fields["type"]) {
      queryStr += `type=${fields["type"]}&`;
    }
    if (
      fields["success"] &&
      (fields["success"] == 0 || fields["success"] == 1)
    ) {
      queryStr += `success=${parseInt(fields["success"])}&`;
    }

    if (fields["dateCreated"]["startDate"]) {
      queryStr += `startDate=${moment(fields["dateCreated"]["startDate"])
        .startOf("day")
        .format(format)}&`;
    }

    if (fields["dateCreated"]["endDate"]) {
      queryStr += `endDate=${moment(fields["dateCreated"]["endDate"])
        .endOf("day")
        .format(format)}&`;
    }

    queryStr += `resourceType=transaction&per_page=200`;
    this.getTransaction(queryStr);
  }

  getTransaction(queryStr) {
    this.totalsales = 0;
    const { dispatch, match } = this.props;
    this.setState({
      queryStr: queryStr,
    });
    dispatch(
      transactionActions.getTransactionDetails(match.params.firmId, queryStr)
    );
    this.setState({
      isFetching: true,
    });

    setTimeout(() => {
      this.calculateTotals();
      this.setState({
        isFetching: false,
      });
    }, 6500);
  }

  calculateTotals() {
    const { transactionStore } = this.props;
    let tableDataSource =
      transactionStore.transaction && transactionStore.transaction.data;
    this.totalsales = tableDataSource
      ? tableDataSource.reduce(function (a, b) {
          return a + +b.total;
        }, 0)
      : 0;
  }

  _handleFetchList() {
    const { dispatch } = this.props;
    dispatch(transactionActions.setFilter({ sortBy: "-created_at" }));
    this._handleSetPagination({ page: 1, per: 50 });
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    dispatch(transactionActions.setPagination(newPagination));
  }

  _setPerPage(per) {
    let newPagination = {};
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination);
  }

  _handleFilter(sortBy) {
    const { dispatch, utilTransactionStore } = this.props;
    let newFilter = utilTransactionStore.filter;
    if (
      utilTransactionStore.filter.sortBy &&
      utilTransactionStore.filter.sortBy.indexOf("-") < 0
    ) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0);
    }
    newFilter.sortBy = sortBy;
    dispatch(transactionActions.setFilter(newFilter));
  }

  updateSearch = (event) => {
    this.setState({ search: event.target.value.substr(0, 20) });
  };

  render() {
    const {
      location,
      match,
      transactionStore,
      dispatch,
      utilTransactionStore,
      paginatedList,
      sortBy,
    } = this.props;
    const { isFetching, filter, queryStr } = this.state;
    const { dateCreated } = filter;
    this.totalsales = 0;
    let tableDataSource = paginatedList;
    let totalsales = tableDataSource
      ? tableDataSource.reduce(function (a, b) {
          return a + +b.total;
        }, 0)
      : 0;

    if (tableDataSource && tableDataSource.length > 0) {
      tableDataSource.map(function (obj) {
        obj["ClientName"] = "-";
        obj["refundAmount"] = obj.total;
        if (obj["meta"] && obj.meta.otherField1) {
          obj["ClientName"] = obj.meta.otherField1.split("|")[0];
        }
        return obj;
      });
    }

    const successTypes = [
      { label: "All", value: "" },
      { label: "Success", value: 1 },
      { label: "Failure", value: 0 },
    ];
    const methodTypes = [
      { label: "All", value: "" },
      { label: "Card", value: "card" },
      { label: "Bank", value: "bank" },
    ];
    const statusTypes = [
      { label: "All", value: "" },
      { label: "Charge", value: "charge" },
      { label: "Refund", value: "refund" },
      { label: "Void", value: "void" },
    ];

    return (
      <PracticeLayout>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} />
            </div>
          </div>
        </div>
        <div className="-practice-content flexbox p-m-0">
          <div class="flex-item">
            <div class="flex">
              <div class="child">
                <label className="label-text">Date Range</label>
                <DateRangePickerInput
                  startDatePlaceholderText="from"
                  endDatePlaceholderText="to"
                  minDate={0}
                  change={this.prepareQueryString}
                  name="filter.dateCreated"
                  dateRange={dateCreated}
                />
              </div>
              <div class="child">
                <label className="label-text">Method</label>
                <SelectFromObject
                  change={this.prepareQueryString}
                  name="method"
                  items={methodTypes}
                  display="label"
                  value="value"
                  selected={filter.method}
                />
              </div>
              <div class="child">
                <label className="label-text">Type</label>
                <SelectFromObject
                  change={this.prepareQueryString}
                  name="type"
                  items={statusTypes}
                  display="label"
                  value="value"
                  selected={filter.type}
                />
              </div>
              <div class="child">
                <label className="label-text">Success</label>
                <SelectFromObject
                  change={this.prepareQueryString}
                  name="success"
                  items={successTypes}
                  display="label"
                  value="value"
                  selected={filter.success}
                />
              </div>
              <div class="child p-text-center">
                <label className="label-text">Total Sales</label>
                <div className="p-pt-2 p-text-bold ic-red ic-size-18">
                  <NumberFormat
                    thousandsGroupStyle="thousand"
                    value={totalsales}
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
                </div>
              </div>
            </div>
          </div>
          <div class="flex-item">
            <div className="p-text-right ic-red p-px-3 m-x-8">
              <span>
                <a
                  href={`/firm/${match.params.firmId}/settings/electronic-payments`}
                >
                  Back
                </a>
              </span>
            </div>
            {isFetching ? (
              <div className="-loading-hero">
                <div className="u-centerText">
                  <div className="loading"></div>
                </div>
              </div>
            ) : tableDataSource && tableDataSource.length > 0 ? (
              <div>
                <Search
                  value={this.state.search}
                  change={(e) => this.updateSearch(e)}
                  placeholder="Search transaction..."
                  className="search-fs-12"
                />
                <PageTabber
                  totalItems={
                    utilTransactionStore.items &&
                    utilTransactionStore.items.length
                  }
                  totalPages={Math.ceil(
                    utilTransactionStore.items &&
                      utilTransactionStore.items.length /
                        utilTransactionStore.pagination &&
                      utilTransactionStore.pagination.per
                  )}
                  pagination={utilTransactionStore.pagination}
                  setPagination={this._handleSetPagination}
                  setPerPage={this._setPerPage}
                  viewingAs="top"
                  itemName="transactions"
                />
                <TransactionTable
                  data={tableDataSource}
                  dispatch={dispatch}
                  match={match}
                  queryStr={queryStr}
                  paginatedList={paginatedList}
                  sortBy={sortBy}
                  handleFilter={this._handleFilter}
                  search={this.state.search}
                />
                <PageTabber
                  totalItems={
                    utilTransactionStore.items &&
                    utilTransactionStore.items.length
                  }
                  totalPages={Math.ceil(
                    utilTransactionStore.items &&
                      utilTransactionStore.items.length /
                        utilTransactionStore.pagination &&
                      utilTransactionStore.pagination.per
                  )}
                  pagination={utilTransactionStore.pagination}
                  setPagination={this._handleSetPagination}
                  setPerPage={this._setPerPage}
                  viewingAs="bottom"
                  itemName="transactions"
                />
              </div>
            ) : (
              <div className="nodata">
                <span class="fas fa-exclamation-circle"></span> Data not found
              </div>
            )}
          </div>
        </div>
      </PracticeLayout>
    );
  }
}

ViewTransactionHistory.propTypes = {};

const mapStoreToProps = (store, props) => {
  const loggedInUser = store.user.loggedIn.user;

  // PAGINATION
  const transactionStore = store.transaction;
  const utilTransactionStore = transactionStore.util.getSelectedStore();
  let transactionListItems = transactionStore.util.getList();
  let paginatedList = [];
  let orderedList = [];
  let sortBy = "";

  if (transactionListItems) {
    const pagination = utilTransactionStore.pagination || { page: 1, per: 50 };
    sortBy = utilTransactionStore.filter
      ? utilTransactionStore.filter.sortBy
      : "created_at";

    // SORT THE LIST
    switch (sortBy) {
      case "created_at":
        orderedList = _.orderBy(
          transactionListItems,
          [(item) => item.created_at],
          ["asc"]
        );
        break;
      case "-created_at":
        orderedList = _.orderBy(
          transactionListItems,
          [(item) => item.created_at],
          ["desc"]
        );
        break;
      case "total":
        orderedList = _.orderBy(
          transactionListItems,
          [(item) => item.total],
          ["asc"]
        );
        break;
      case "-total":
        orderedList = _.orderBy(
          transactionListItems,
          [(item) => item.total],
          ["desc"]
        );
        break;
      default:
        orderedList = _.orderBy(
          transactionListItems,
          [(item) => item.created_at],
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
    merchantStore: store.merchant,
    transactionStore: store.transaction,
    utilTransactionStore,
    paginatedList,
    sortBy,
  };
};

export default withRouter(connect(mapStoreToProps)(ViewTransactionHistory));
