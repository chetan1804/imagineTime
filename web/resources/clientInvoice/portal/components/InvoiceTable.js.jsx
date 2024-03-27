import React from "react";
import moment from "moment";
//import { Toaster, toast } from "react-hot-toast";
import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";

import Binder from "../../../../global/components/Binder.js.jsx";
import InvoiceModal from "./InvoiceModal.js.jsx";
import InvoiceListItem from "./InvoiceListItem.js.jsx";
import PaymentModal from "../../../payments/components/PaymentModal.js.jsx";
import PageTabber from "../../../../global/components/pagination/PageTabber.js.jsx";
import Search from "../../../../global/components/forms/SearchInput.js.jsx";

import AlertModal from "../../../../global/components/modals/AlertModal.js.jsx";
import MyDocument from "../../components/PdfDocument.js.jsx";
class InvoiceTable extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      invoiceIsClicked: false,
      isUpdated: false,
      paymentIsClicked: false,
      ClientName: this.props.clientName,
      isDisabled: false,
      search: "",
      showModal: false,
      selectedData: null,
      alertType: "",
    };
    this._bind("updateSearch");
  }

  updateSearch = (event) => {
    this.setState({ search: event.target.value.substr(0, 20) });
  };

  render() {
    const {
      serviceStore,
      invoiceStore,
      createInvoice,
      updateInvoice,
      dispatch,
      match,
      lastInvoiceNo,
      deleteInvoice,
      getByIdInvoice,
      getLastInvoiceNo,
      clientName,
      paymentStore,
      selectedFirm,
      clientStore,
      deleteInvoiceDetail,
      addressStore,
      userStore,
      selectedClient,
      paginatedList,
      sortBy,
      handleFilter,
      utilInvoiceStore,
      handleSetPagination,
      setPerPage,
      addressId,
    } = this.props;
    const {
      invoiceIsClicked,
      isUpdated,
      paymentIsClicked,
      ClientName,
      selectedData,
      isDisabled,
      search,
      showModal,
      alertType,
    } = this.state;
    const isFetching =
    invoiceStore.selected && !invoiceStore.selected.isFetching;
    
    const handleInvoiceModal = (type, data) => {
      this.setState({ invoiceIsClicked: true });
      if (invoiceIsClicked) {
        this.setState({ invoiceIsClicked: false, isUpdated: false });
      }

      if (type === "edit") {
        dispatch(getByIdInvoice(data && data.invoice_id));
      } else {
        invoiceStore.selectedInvoice = null;
        invoiceStore.isValidForm = false;
        let defaultObj = {
          invoice_date: "",
          payment_due_date: "",
          invoice_amount: 0,
          invoice_balance: 0,
          description: "",
          invoice_type: "",
          is_archived: false,
          invoice_number: null,
          client_id: null,
          firm_id: null,
          invoice_details: [],
        };
        defaultObj["payment_due_date"] = moment().utc().format();
        defaultObj["invoice_date"] = moment().utc().format();
        defaultObj["invoice_number"] =
          lastInvoiceNo && lastInvoiceNo.number ? lastInvoiceNo.number + 1 : 0;
        defaultObj["client_id"] = parseInt(match.params.clientId);
        defaultObj["firm_id"] = parseInt(selectedFirm && selectedFirm._id);
        defaultObj["ClientName"] = ClientName;
        invoiceStore.selectedInvoice = defaultObj;
      }
      this.setState({
        isUpdated: type == "edit" ? true : false,
        selectedData: data,
        ClientName: ClientName,
      });
    };

    const handlePaymentModal = (data) => {
      this.setState({ paymentIsClicked: true, selectedData: data });
      if (paymentIsClicked) {
        this.setState({ paymentIsClicked: false });
      }
    };

    const handleCloseModal = (bool) => {
      this.setState({
        paymentIsClicked: false,
      });
    };

    const selectedInvoice = invoiceStore && invoiceStore.selectedInvoice;

    //fetching invoice under client
    const filteredInvoice = paginatedList.filter(
      (data) =>
        data &&
        data.client_id == match.params.clientId &&
        data &&
        data.is_archived == false
    );

    const searchInvoice =
      filteredInvoice &&
      filteredInvoice.filter(
        (item) =>
          JSON.stringify(item.invoice_number)
            .toLowerCase()
            .indexOf(search.toLowerCase()) !== -1 ||
          item.description.toLowerCase().indexOf(search.toLowerCase()) !== -1 ||
          JSON.stringify(item.invoice_amount)
            .toLowerCase()
            .indexOf(search.toLowerCase()) !== -1
      );

    let cardDetails =
      paymentStore &&
      paymentStore.details &&
      paymentStore.details.data &&
      paymentStore.details.data;

    const getState = () => {
      this.setState({
        isDisabled: true,
      });
      setTimeout(() => {
        this.setState({
          isDisabled: false,
        });
      }, 7000);
    };

    const handleAlertModal = (type, data) => {
      if (type == "generate") {
        dispatch(getByIdInvoice(data && data.invoice_id));
      }
      this.setState({ showModal: true, selectedData: data, alertType: type });
      if (showModal) {
        this.setState({ showModal: false });
      }
    };

    const handleGeneratePdf = async () => {
      const clientPrimaryAddress =
        clientStore &&
        clientStore.byId[match.params.clientId] &&
        clientStore.byId[match.params.clientId]._primaryAddress;
      const clientAddress =
        addressStore && addressStore.byId[clientPrimaryAddress];
      const firmPrimaryAddress = selectedFirm && selectedFirm._primaryAddress;
      const firmAddress =
        addressStore && addressStore.addressList[firmPrimaryAddress];

      const blob = await pdf(
        <MyDocument
          firmName={selectedFirm && selectedFirm.name}
          invoiceDate={moment(
            selectedInvoice && selectedInvoice.invoice_date
          ).utc().format("MM-DD-YYYY")}
          invoiceNum={selectedInvoice && selectedInvoice.invoice_number}
          invoiceAmt={selectedInvoice && selectedInvoice.invoice_amount}
          invoiceBal={selectedInvoice && selectedInvoice.invoice_balance}
          clientName={clientName}
          dueDate={moment(
            selectedInvoice && selectedInvoice.payment_due_date
          ).utc().format("MM-DD-YYYY")}
          clientAddress={clientAddress}
          firmAddress={firmAddress}
          service={selectedInvoice && selectedInvoice.invoice_details}
        />
      ).toBlob();
      saveAs(
        blob,
        `Invoice #${selectedInvoice && selectedInvoice.invoice_number}`
      );
      handleAlertModal();
    };
    
    return (
      <div>
        {/* <Toaster /> */}
        <AlertModal
          alertTitle={
            alertType == "delete"
              ? "Delete Invoice"
              : alertType == "generate"
              ? "PDF"
              : "Send Email"
          }
          closeAction={handleAlertModal}
          confirmAction={
            alertType == "delete"
              ? handleDelete
              : handleGeneratePdf
          }
          confirmText={
            alertType == "delete"
              ? "Delete"
              : alertType == "generate"
              ? !isFetching
                ? "Generating..."
                : "Download"
              : "Send"
          }
          declineAction={null}
          declineText={null}
          isOpen={showModal}
          disableConfirm={!isFetching ? true : false}
        >
          <div style={{ color: "black" }}>
            <p>
              {alertType == "delete"
                ? `Do you want to delete invoice #${
                    selectedData && selectedData.invoice_number
                  }?`
                : alertType == "generate"
                ? `Do you want to generate and download invoice #${
                    selectedData && selectedData.invoice_number
                  }?`
                : `Do you want to send email to ${
                    selectedData && selectedData.name
                  }?`}
            </p>
          </div>
        </AlertModal>
        {/* {paginatedList && paginatedList.length == 0 && ( */}
        <div className="yt-toolbar">
          <div className="yt-tools space-between">
            <div className="-filters -left"></div>
            <div className="yt-tools -right">
              <div className="search">
                <Search
                  value={search}
                  change={(e) => this.updateSearch(e)}
                  placeholder="Search invoice..."
                  className="search-fs-12"
                />
              </div>
            </div>
          </div>
        </div>
        {/* // )} */}

        <PageTabber
          totalItems={utilInvoiceStore.items && utilInvoiceStore.items.length}
          totalPages={Math.ceil(
            utilInvoiceStore.items &&
              utilInvoiceStore.items.length / utilInvoiceStore.pagination &&
              utilInvoiceStore.pagination.per
          )}
          pagination={utilInvoiceStore.pagination}
          setPagination={handleSetPagination}
          setPerPage={setPerPage}
          viewingAs="top"
          itemName="invoices"
        />
        {paginatedList && paginatedList.length != 0 ? (
          <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table">
            <div className="-table-horizontal-scrolling">
              <div className="table-head">
                <div
                  className="table-cell _8"
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
                <div className="table-cell _15 p-text-left">Client Name</div>
                <div className="table-cell _15 p-text-left">Description</div>
                <div
                  className="table-cell _10"
                  onClick={() => handleFilter("invoice_date")}
                >
                  Invoice Date &nbsp;
                  {sortBy && sortBy == "invoice_date" ? (
                    <i className="fad fa-sort-down"></i>
                  ) : sortBy && sortBy == "-invoice_date" ? (
                    <i className="fad fa-sort-up"></i>
                  ) : (
                    <i className="fad fa-sort"></i>
                  )}
                </div>
                <div className="table-cell _10">Payment Due Date</div>
                <div
                  className="table-cell _10 p-text-center"
                  onClick={() => handleFilter("invoice_amount")}
                >
                  Amount &nbsp;
                  {sortBy && sortBy == "invoice_amount" ? (
                    <i className="fad fa-sort-down"></i>
                  ) : sortBy && sortBy == "-invoice_amount" ? (
                    <i className="fad fa-sort-up"></i>
                  ) : (
                    <i className="fad fa-sort"></i>
                  )}
                </div>
                <div className="table-cell _10 p-text-center">Balance</div>
                <div className="table-cell _10 p-text-center">Action</div>
              </div>
            </div>
            {searchInvoice.map((data, i) => {
              if (!data) {
                return null;
              } else {
                return (
                  <InvoiceListItem
                    index={i}
                    data={data}
                    handleInvoiceModal={handleInvoiceModal}
                    handlePaymentModal={handlePaymentModal}
                    deleteInvoice={deleteInvoice}
                    dispatch={dispatch}
                    match={match}
                    selectedFirm={selectedFirm}
                    userStore={userStore}
                    selectedClient={selectedClient}
                    isDisabled={isDisabled}
                    handleAlertModal={(type, data) =>
                      handleAlertModal(type, data)
                    }
                  />
                );
              }
            })}
          </div>
        ) : (
          <div className="hero -empty-hero">
            <div className="u-centerText">
              <h2>No invoice data.</h2>
            </div>
          </div>
        )}
        <PageTabber
          totalItems={utilInvoiceStore.items && utilInvoiceStore.items.length}
          totalPages={Math.ceil(
            utilInvoiceStore.items &&
              utilInvoiceStore.items.length / utilInvoiceStore.pagination &&
              utilInvoiceStore.pagination.per
          )}
          pagination={utilInvoiceStore.pagination}
          setPagination={handleSetPagination}
          setPerPage={setPerPage}
          viewingAs="bottom"
          itemName="invoices"
        />
        <InvoiceModal
          invoiceIsClicked={invoiceIsClicked}
          serviceStore={serviceStore}
          invoiceStore={invoiceStore}
          handleInvoiceModal={() => handleInvoiceModal()}
          selectedInvoice={selectedInvoice}
          createInvoice={createInvoice}
          updateInvoice={updateInvoice}
          dispatch={dispatch}
          isUpdated={isUpdated}
          match={match}
          ClientName={ClientName}
          lastInvoiceNo={lastInvoiceNo}
          getLastInvoiceNo={getLastInvoiceNo}
          deleteInvoiceDetail={deleteInvoiceDetail}
          getState={() => getState()}
          selectedFirm={selectedFirm}
        />
        <PaymentModal
          paymentIsClicked={paymentIsClicked}
          handlePaymentModal={() => handlePaymentModal()}
          handleCloseModal={() => handleCloseModal()}
          clientName={clientName}
          cardDetails={cardDetails}
          selectedInvoice={selectedData}
          selectedFirm={selectedFirm}
          clientStore={clientStore}
          match={match}
          addressStore={addressStore}
          dispatch={dispatch}
          paymentStore={paymentStore}
          updateInvoice={updateInvoice}
          addressId={addressId}
        />
      </div>
    );
  }
}

InvoiceTable.propTypes = {};

export default InvoiceTable;
