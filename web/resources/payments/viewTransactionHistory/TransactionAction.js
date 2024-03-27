import apiUtils from "../../../global/utils/api";
import * as invoiceAction from "../../clientInvoice/InvoiceActions";
import * as paymentAction from "../../payments/PaymentActions";

// GET TRANSACTION DETAILS
export const REQUEST_TRANSACTION_LIST = "REQUEST_TRANSACTION_LIST";
function requestGetTransactionDetails(listArgs) {
  return {
    listArgs,
    type: REQUEST_TRANSACTION_LIST,
  };
}

export const RECEIVE_TRANSACTION_LIST = "RECEIVE_TRANSACTION_LIST";
function receiveGetTransactionDetails(json, listArgs) {
  return {
    message: json.message,
    list: json.data,
    listArgs,
    receivedAt: Date.now(),
    success: json.success,
    type: RECEIVE_TRANSACTION_LIST,
  };
}

export function getTransactionDetails(firmId, params, ...listArgs) {
  return (dispatch) => {
    if (listArgs.length === 0) {
      listArgs = ["all"];
    }
    dispatch(requestGetTransactionDetails(listArgs));

    let apiTarget = `/api/transaction/${firmId}${params}`;
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
      .then((json) => dispatch(receiveGetTransactionDetails(json, listArgs)));
  };
}

// CREATE TRANSACTION CHARGE
export const REQUEST_CREATE_CHARGE = "REQUEST_CREATE_CHARGE";
function requestCreateCharge(firm_id, client_id, invoiceId, cardDetailId,invoiceNo, transType, body) {
  return {
    firm_id, client_id, invoiceId, cardDetailId,invoiceNo, transType, body,
    type: REQUEST_CREATE_CHARGE,
  };
}

export const RECEIVE_CREATE_CHARGE = "RECEIVE_CREATE_CHARGE";
function receiveCreateCharge(json) {
  if (json.data) {
    return {
      item: json.data,
      receivedAt: Date.now(),
      // success: json.data.success[0],
      type: RECEIVE_CREATE_CHARGE,
    };
  } else {
    return {
      item: json.data,
      receivedAt: Date.now(),
      success: json.success,
      type: RECEIVE_CREATE_CHARGE,
    };
  }
}

export function createCharge(firm_id, client_id, invoiceId, cardDetailId,invoiceNo, transType, body) {
  return (dispatch) => {
    dispatch(requestCreateCharge(body));
    return apiUtils
      .callAPI(`/api/transaction/charge/${firm_id}/${client_id}/${invoiceId}/${cardDetailId}/${invoiceNo}/${transType}`, "POST", body)
      .then((json) => dispatch(receiveCreateCharge(json)))
      .then(() => dispatch(invoiceAction.fetchInvoiceList(client_id)))
      .then(() => dispatch(invoiceAction.getLastInvoiceNumber(firm_id, client_id)))
      .then(() => dispatch(paymentAction.getCardDetails(client_id)));
  };
}

// VOID or REFUND
export const REQUEST_VOID_OR_REFUND = "REQUEST_VOID_OR_REFUND";
function requestVoidOrRefund(data) {
  return {
    data,
    type: REQUEST_VOID_OR_REFUND,
  };
}

export const RECEIVE_VOID_OR_REFUND = "RECEIVE_VOID_OR_REFUND";
function receiveVoidOrRefund(json) {
  if (json.data) {
    return {
      item: json.data,
      receivedAt: Date.now(),
      // success: json.data.success[0],
      type: RECEIVE_VOID_OR_REFUND,
    };
  } else {
    return {
      item: json.data,
      receivedAt: Date.now(),
      success: json.success,
      type: RECEIVE_VOID_OR_REFUND,
    };
  }
}

export function voidOrRefund(body) {
  return (dispatch) => {
    dispatch(requestVoidOrRefund(body));
    return apiUtils
      .callAPI(`/api/transaction/voidOrRefund/${body.type}/${body.firmId}`, "POST", body)
      .then((json) => dispatch(receiveVoidOrRefund(json)))
  };
}

// UTIL
export const SET_TRANSACTION_FILTER = "SET_TRANSACTION_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_TRANSACTION_FILTER
  }
}

export const SET_TRANSACTION_PAGINATION = "SET_TRANSACTION_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_TRANSACTION_PAGINATION
  }
}
