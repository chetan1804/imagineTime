import apiUtils from "../../global/utils/api";

// FETCHING INVOICES
export const REQUEST_INVOICE_LIST = "REQUEST_INVOICE_LIST";
function requestInvoiceList(listArgs) {
  return {
    listArgs,
    type: REQUEST_INVOICE_LIST,
  };
}

export const RECEIVE_INVOICE_LIST = "RECEIVE_INVOICE_LIST";
function receiveInvoiceList(json, listArgs) {
  return {
    error: json.message,
    list: json.data,
    listArgs,
    receivedAt: Date.now(),
    success: json.success,
    selectedInvoice: {},
    type: RECEIVE_INVOICE_LIST,
  };
}

export function fetchInvoiceList(...listArgs) {
  return (dispatch) => {
    if (listArgs.length === 0) {
      listArgs = ["all"];
    }
    dispatch(requestInvoiceList(listArgs));

    let apiTarget = `/api/invoice/getAll/${listArgs[0]}`;
    if (listArgs.length == 2 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if (listArgs.length == 2 && Array.isArray(listArgs[1])) {
      apiTarget += `/by-${listArgs[0]}-list?`;

      for (let i = 0; i < listArgs[1].length; i++) {
        apiTarget += `${listArgs[0]}=${listArgs[1][i]}&`;
      }
    } else if (listArgs.length == 2) {
      apiTarget += `/by-${listArgs[0]}/${listArgs[1]}`;
    } else if (listArgs.length > 2) {
      apiTarget += `/by-${listArgs[0]}/${listArgs[1]}`;
      for (let i = 2; i < listArgs.length; i++) {
        apiTarget += `/${listArgs[i]}`;
      }
    }
    return apiUtils
      .callAPI(apiTarget)
      .then((json) => dispatch(receiveInvoiceList(json, listArgs)));
  };
}

// CREATE INVOICE
export const REQUEST_CREATE_INVOICE = "REQUEST_CREATE_INVOICE";
function requestCreateInvoice(invoice) {
  return {
    invoice,
    type: REQUEST_CREATE_INVOICE,
  };
}

export const RECEIVE_CREATE_INVOICE = "RECEIVE_CREATE_INVOICE";
function receiveCreateInvoice(json) {
  return {
    error: json.message,
    id: json.invoice ? json.invoice._id : null,
    item: json.invoice,
    receivedAt: Date.now(),
    success: json.success,
    type: RECEIVE_CREATE_INVOICE,
  };
}

export function sendCreateInvoice(data) {
  return (dispatch) => {
    dispatch(requestCreateInvoice(data));
    return apiUtils
      .callAPI("/api/invoice/create", "POST", data)
      .then((json) => dispatch(receiveCreateInvoice(json)))
      .then(() => dispatch(fetchInvoiceList(data.client_id)))
      .then(() => dispatch(getLastInvoiceNumber(data.client_id)));
  };
}

// UPDATE INVOICE
export const REQUEST_UPDATE_INVOICE = "REQUEST_UPDATE_INVOICE";
function requestUpdateInvoice(data) {
  return {
    id: data ? data._id : null,
    data,
    type: REQUEST_UPDATE_INVOICE,
  };
}

export const RECEIVE_UPDATE_INVOICE = "RECEIVE_UPDATE_INVOICE";
function receiveUpdateInvoice() {
  return {
    receivedAt: Date.now(),
    success: true,
    type: RECEIVE_UPDATE_INVOICE,
  };
}

export function sendUpdateInvoice(data, type) {
  return (dispatch) => {
    dispatch(requestUpdateInvoice(data));
    return apiUtils
      .callAPI(`/api/invoice/update/${data.invoice_id}`, "PUT", data)
      .then(() => dispatch(receiveUpdateInvoice()))
      .then(() => {
        if (type != 'remove') {
          dispatch(fetchInvoiceList(data.client_id))
        }
      });
  };
}

// GET INVOICE LAST NUMBER
export const REQUEST_GET_INVOICE_LAST_NUMBER =
  "REQUEST_GET_INVOICE_LAST_NUMBER";
function requestGetLastInvoiceNumber(data) {
  return {
    id: data ? data._id : null,
    data,
    type: REQUEST_GET_INVOICE_LAST_NUMBER,
  };
}

export const RECEIVE_GET_INVOICE_LAST_NUMBER =
  "RECEIVE_GET_INVOICE_LAST_NUMBER";
function receiveGetLastInvoiceNumber(json) {
  return {
    // error: json.message,
    // id: json.data ? json.data._id: null,
    item: json.invoice.invoice_number,
    receivedAt: Date.now(),
    success: json.success,
    type: RECEIVE_GET_INVOICE_LAST_NUMBER,
  };
}

export function getLastInvoiceNumber(clientId) {
  return (dispatch) => {
    dispatch(requestGetLastInvoiceNumber(clientId));
    return apiUtils
      .callAPI(`/api/getLastInvoiceNumber/${clientId}`, "GET")
      .then((json) => dispatch(receiveGetLastInvoiceNumber(json)))
      // .then(() => dispatch(fetchInvoiceList(clientId)));
  };
}

// DELETE INVOICE
export const REQUEST_DELETE_INVOICE = "REQUEST_DELETE_INVOICE";
function requestDeleteInvoice(id) {
  return {
    id,
    type: REQUEST_DELETE_INVOICE,
  };
}

export const RECEIVE_DELETE_INVOICE = "RECEIVE_DELETE_INVOICE";
function receiveDeleteInvoice() {
  return {
    item: null,
    receivedAt: Date.now(),
    success: true,
    type: RECEIVE_DELETE_INVOICE,
  };
}

export function deleteInvoice(id, clientId) {
  return (dispatch) => {
    dispatch(requestDeleteInvoice(id));
    return apiUtils
      .callAPI(`/api/delete-invoice/${id}`, "DELETE")
      .then((json) => dispatch(receiveDeleteInvoice()))
      .then(() => dispatch(fetchInvoiceList(clientId)));
  };
}

// INVOICE GET BY ID
export const REQUEST_INVOICE_GET_BY_ID = "REQUEST_INVOICE_GET_BY_ID";
function requestInvoiceGetById(data) {
  return {
    id: data ? data.invoice_id : null,
    data,
    type: REQUEST_INVOICE_GET_BY_ID,
  };
}

export const RECEIVE_INVOICE_GET_BY_ID = "RECEIVE_INVOICE_GET_BY_ID";
function receiveInvoiceGetById(json) {
  return {
    error: json.message,
    id: json.data ? json.data.invoice_id : null,
    item: json.data,
    selectedInvoice: json.data,
    receivedAt: Date.now(),
    success: json.success,
    type: RECEIVE_INVOICE_GET_BY_ID,
  };
}

export function fetchInvoiceGetById(invoiceId) {
  return (dispatch) => {
    dispatch(requestInvoiceGetById(invoiceId));
    return apiUtils
      .callAPI(`/api/invoice/getById/${invoiceId}`, "GET")
      .then((json) => dispatch(receiveInvoiceGetById(json)))
  };
}

// DELETE INVOICE DETAIL
export const REQUEST_DELETE_INVOICE_DETAIL = "REQUEST_DELETE_INVOICE_DETAIL";
function requestDeleteInvoiceDetail(id) {
  return {
    id,
    type: REQUEST_DELETE_INVOICE_DETAIL,
  };
}

export const RECEIVE_DELETE_INVOICE_DETAIL = "RECEIVE_DELETE_INVOICE_DETAIL";
function receiveDeleteInvoiceDetail() {
  return {
    item: null,
    receivedAt: Date.now(),
    success: true,
    type: RECEIVE_DELETE_INVOICE_DETAIL,
  };
}

export function deleteInvoiceDetail(invoiceDetailId) {
  return (dispatch) => {
    dispatch(requestDeleteInvoiceDetail(invoiceDetailId));
    return apiUtils
      .callAPI(`/api/invoice-details/${invoiceDetailId}`, "DELETE")
      .then((json) => dispatch(receiveDeleteInvoiceDetail()))
  };
}

// UTIL
export const SET_INVOICE_FILTER = "SET_INVOICE_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_INVOICE_FILTER
  }
}

export const SET_INVOICE_PAGINATION = "SET_INVOICE_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_INVOICE_PAGINATION
  }
}
