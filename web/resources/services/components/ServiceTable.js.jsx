import React from "react";
//import { Toaster } from "react-hot-toast";

import Binder from "../../../global/components/Binder.js.jsx";
import ServiceModal from "./ServiceModal.js.jsx";
import ServiceListItem from "./ServiceListItem.js.jsx";
import PageTabber from "../../../global/components/pagination/PageTabber.js.jsx";
import Search from "../../../global/components/forms/SearchInput.js.jsx";

class ServiceTable extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      serviceIsClicked: false,
      isUpdated: false,
      selectedData: null,
      search: "",
    };
    this._bind("updateSearch");
  }

  updateSearch = (event) => {
    this.setState({ search: event.target.value.substr(0, 20) });
  };

  render() {
    const {
      serviceStore,
      createService,
      updateService,
      deleteService,
      dispatch,
      paginatedList,
      // sortBy,
      handleFilter,
      utilServiceStore,
      handleSetPagination,
      setPerPage,
    } = this.props;
    const { serviceIsClicked, isUpdated, selectedData, search } = this.state;

    const handleServiceModal = (type, data) => {
      this.setState({ serviceIsClicked: true });
      if (serviceIsClicked) {
        this.setState({ serviceIsClicked: false, isUpdated: false });
      }

      if (type === "edit") {
        this.setState({
          isUpdated: true,
          selectedData: data,
        });
      }
    };
    const argsArr = paginatedList;
    const searchService =
      argsArr &&
      argsArr.filter(
        (item) =>
          (item &&
            item.service &&
            item.service.toLowerCase() &&
            item.service
              .toLowerCase()
              .indexOf(search && search.toLowerCase()) !== -1) ||
          (item &&
            item.description &&
            item.description.toLowerCase() &&
            item.description
              .toLowerCase()
              .indexOf(search && search.toLowerCase()) !== -1) ||
          (JSON.stringify(item && item.price) &&
            JSON.stringify(item && item.price).toLowerCase() &&
            JSON.stringify(item && item.price)
              .toLowerCase()
              .indexOf(search && search.toLowerCase()) !== -1)
      );

    return (
      <div>
        {/* {argsArr && argsArr.length == 0 && ( */}
        {/* <Toaster /> */}
        <div className="yt-toolbar">
          <div className="yt-tools space-between">
            <div className="-filters -left"></div>
            <div className="-options -right">
              <div className="search">
                <Search
                  value={search}
                  change={(e) => this.updateSearch(e)}
                  placeholder="Search service..."
                  className="search-fs-12"
                />
              </div>
              <a
                className="yt-btn x-small info"
                href="#"
                onClick={() => handleServiceModal("create")}
              >
                {/* <i
                    class="fas fa-plus-circle"
                    style={{
                      fontSize: 30,
                      float: "right",
                      marginRight: 20,
                    }}
                  ></i> */}
                Create Service
              </a>
            </div>
          </div>
        </div>
        {/* )} */}
        <PageTabber
          totalItems={utilServiceStore.items && utilServiceStore.items.length}
          totalPages={Math.ceil(
            utilServiceStore.items &&
              utilServiceStore.items.length / utilServiceStore.pagination &&
              utilServiceStore.pagination.per
          )}
          pagination={utilServiceStore.pagination}
          setPagination={handleSetPagination}
          setPerPage={setPerPage}
          viewingAs="top"
          itemName="services"
        />
        <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table">
          <div className="-table-horizontal-scrolling">
            <div className="table-head">
              <div
                className="table-cell _15"
                onClick={() => handleFilter("service")}
              >
                Service Name
              </div>
              <div className="table-cell _60">Description</div>
              <div
                className="table-cell _15  p-text-center"
                onClick={() => handleFilter("price")}
              >
                Price
              </div>
              <div className="table-cell _15  p-text-center">Actions</div>
            </div>
          </div>
          {searchService.map((data, i) => {
            if (!data) {
              return null;
            } else {
              return (
                <ServiceListItem
                  index={i}
                  data={data}
                  dispatch={dispatch}
                  deleteService={deleteService}
                  handleServiceModal={handleServiceModal}
                />
              );
            }
          })}
        </div>
        <PageTabber
          totalItems={utilServiceStore.items && utilServiceStore.items.length}
          totalPages={Math.ceil(
            utilServiceStore.items &&
              utilServiceStore.items.length / utilServiceStore.pagination &&
              utilServiceStore.pagination.per
          )}
          pagination={utilServiceStore.pagination}
          setPagination={this._handleSetPagination}
          setPerPage={this._setPerPage}
          viewingAs="bottom"
          itemName="services"
        />
        <ServiceModal
          serviceIsClicked={serviceIsClicked}
          handleServiceModal={handleServiceModal}
          createService={createService}
          updateService={updateService}
          dispatch={dispatch}
          selectedData={selectedData}
          isUpdated={isUpdated}
          serviceStore={argsArr}
        />
      </div>
    );
  }
}

ServiceTable.propTypes = {};

export default ServiceTable;
