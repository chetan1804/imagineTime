import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Helmet } from "react-helmet";

import * as serviceActions from "../ServiceActions";
import * as clientUserActions from "../../clientUser/clientUserActions";

import Binder from "../../../global/components/Binder.js.jsx";
import PracticeFirmLayout from "../../firm/practice/components/PracticeFirmLayout.js.jsx";
import { permissions } from "../../../global/utils";
import ServiceTable from "../components/ServiceTable.js.jsx";
class ServiceList extends Binder {
  constructor(props) {
    super(props);
    this.state = {};
    this._bind("_handleSetPagination", "_setPerPage", "_handleFilter");
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    dispatch(
      clientUserActions.fetchListIfNeeded(
        "_user",
        loggedInUser._id,
        "status",
        "active"
      )
    );
    dispatch(serviceActions.fetchServiceList());
    this._handleFetchList();
  }

  _handleFetchList() {
    // const { dispatch } = this.props;
    // dispatch(serviceActions.setFilter({ sortBy: "-service" }));
    this._handleSetPagination({ page: 1, per: 50 });
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    dispatch(serviceActions.setPagination(newPagination));
  }

  _setPerPage(per) {
    let newPagination = {};
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination);
  }

  _handleFilter(sortBy) {
    const { dispatch, utilServiceStore } = this.props;
    let newFilter = utilServiceStore.filter;
    if (
      utilServiceStore.filter.sortBy &&
      utilServiceStore.filter.sortBy.indexOf("-") < 0
    ) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0);
    }
    newFilter.sortBy = sortBy;
    dispatch(serviceActions.setFilter(newFilter));
  }

  render() {
    const { serviceStore, dispatch, utilServiceStore, paginatedList, sortBy } =
      this.props;

    const isFetching =
      serviceStore.lists &&
      serviceStore.lists["all"] &&
      serviceStore.lists["all"].isFetching;

    return (
      <PracticeFirmLayout>
        <Helmet>
          <title>Services</title>
        </Helmet>
        <div className="-practice-content">
          {isFetching ? (
            <div className="-loading-hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>
          ) : (
            <div>
              <ServiceTable
                utilServiceStore={utilServiceStore}
                handleSetPagination={this._handleSetPagination}
                setPerPage={this._setPerPage}
                serviceStore={serviceStore}
                dispatch={dispatch}
                createService={serviceActions.sendCreateService}
                updateService={serviceActions.sendUpdateService}
                deleteService={serviceActions.sendDeleteService}
                paginatedList={paginatedList}
                // sortBy={sortBy}
                handleFilter={this._handleFilter}
                search={this.state.search}
              />
            </div>
          )}
        </div>
      </PracticeFirmLayout>
    );
  }
}

ServiceList.propTypes = {};

const mapStoreToProps = (store, props) => {
  const { match } = props;
  const firmId = match.params.firmId;
  const loggedInUser = store.user.loggedIn.user;
  const isStaffOwner = permissions.isStaffOwner(
    store.staff,
    loggedInUser,
    firmId
  );

  // PAGINATION
  const serviceStore = store.service;
  const utilServiceStore = serviceStore.util.getSelectedStore();
  let serviceListItems = serviceStore.util.getList();
  let paginatedList = [];
  let orderedList = [];
  let sortBy = "";

  if (serviceListItems) {
    const pagination = utilServiceStore.pagination || { page: 1, per: 50 };
    // sortBy = utilServiceStore.filter
    //   ? utilServiceStore.filter.sortBy
    //   : "service";

    // SORT THE LIST
    switch (sortBy) {
      // case "service":
      //   orderedList = _.orderBy(
      //     serviceListItems,
      //     [(item) => item.service],
      //     ["asc"]
      //   );
      //   break;
      // case "-service":
      //   orderedList = _.orderBy(
      //     serviceListItems,
      //     [(item) => item.service],
      //     ["desc"]
      //   );
      //   break;
      // case "price":
      //   orderedList = _.orderBy(
      //     serviceListItems,
      //     [(item) => item.price],
      //     ["asc"]
      //   );
      //   break;
      // case "-price":
      //   orderedList = _.orderBy(
      //     serviceListItems,
      //     [(item) => item.price],
      //     ["desc"]
      //   );
      //   break;
      default:
        orderedList = _.orderBy(serviceListItems, ["asc"]);
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
    serviceStore: store.service,
    utilServiceStore,
    paginatedList,
    sortBy,
  };
};

export default withRouter(connect(mapStoreToProps)(ServiceList));
