import apiUtils from "../../global/utils/api";

// GET CARD DETAILS
export const REQUEST_GET_CARD_DETAILS = "REQUEST_GET_CARD_DETAILS";
function requestGetCardDetails(details) {
  return {
    details,
    type: REQUEST_GET_CARD_DETAILS,
  };
}

export const RECEIVE_GET_CARD_DETAILS = "RECEIVE_GET_CARD_DETAILS";
function receiveGetCardDetails(json) {
  if (json.data) {
    return {
      item: json.data,
      receivedAt: Date.now(),
      type: RECEIVE_GET_CARD_DETAILS,
    };
  } else {
    return {
      item: json.data,
      receivedAt: Date.now(),
      success: json.success,
      type: RECEIVE_GET_CARD_DETAILS,
    };
  }
}

export function getCardDetails(clientId) {
  return (dispatch) => {
    dispatch(requestGetCardDetails(clientId));
    return apiUtils
      .callAPI(`/api/getCardDetails/${clientId}`, "GET")
      .then((json) => dispatch(receiveGetCardDetails(json)))
  };
}

// CREATE CARD DETAILS
export const REQUEST_CREATE_CARD_DETAILS = "REQUEST_CREATE_CARD_DETAILS";
function requestCreateCardDetails(details) {
  return {
    details,
    type: REQUEST_CREATE_CARD_DETAILS,
  };
}

export const RECEIVE_CREATE_CARD_DETAILS = "RECEIVE_CREATE_CARD_DETAILS";
function receiveCreateCardDetails(json) {
  if (json.data) {
    return {
      item: json.data,
      receivedAt: Date.now(),
      type: RECEIVE_CREATE_CARD_DETAILS,
    };
  } else {
    return {
      item: json.data,
      receivedAt: Date.now(),
      success: json.success,
      type: RECEIVE_CREATE_CARD_DETAILS,
    };
  }
}

export function createCardDetails(data) {
  return (dispatch) => {
    dispatch(requestCreateCardDetails(data));
    return apiUtils
      .callAPI(`/api/createCardDetails`, "POST", data)
      .then((json) => dispatch(receiveCreateCardDetails(json)))
  };
}

// UPDATE CARD DETAILS
export const REQUEST_UPDATE_CARD_DETAILS = "REQUEST_UPDATE_CARD_DETAILS";
function requestUpdateCardDetails(details) {
  return {
    details,
    type: REQUEST_UPDATE_CARD_DETAILS,
  };
}

export const RECEIVE_UPDATE_CARD_DETAILS = "RECEIVE_UPDATE_CARD_DETAILS";
function receiveUpdateCardDetails(json) {
  if (json.data) {
    return {
      item: json.data,
      receivedAt: Date.now(),
      type: RECEIVE_UPDATE_CARD_DETAILS,
    };
  } else {
    return {
      item: json.data,
      receivedAt: Date.now(),
      success: json.success,
      type: RECEIVE_UPDATE_CARD_DETAILS,
    };
  }
}

export function updateCardDetails(customerCardID,body) {
  return (dispatch) => {
    dispatch(requestUpdateCardDetails(customerCardID));
    return apiUtils
      .callAPI(`/api/updateCardDetails/${customerCardID}`, "PUT", body)
      .then((json) => dispatch(receiveUpdateCardDetails(json)))
      .then((json) => dispatch(getCardDetails(body.client_id)))
  };
}

// CREATE PAYMENT HEADER
export const REQUEST_CREATE_PAYMENT_HEADER = "REQUEST_CREATE_PAYMENT_HEADER";
function requestCreatePaymentHeader(data) {
  return {
    data,
    type: REQUEST_CREATE_PAYMENT_HEADER,
  };
}

export const RECEIVE_CREATE_PAYMENT_HEADER = "RECEIVE_CREATE_PAYMENT_HEADER";
function receiveCreatePaymentHeader(json) {
  if (json.data) {
    return {
      item: json.data,
      receivedAt: Date.now(),
      type: RECEIVE_CREATE_PAYMENT_HEADER,
    };
  } else {
    return {
      item: json.data,
      receivedAt: Date.now(),
      success: json.success,
      type: RECEIVE_CREATE_PAYMENT_HEADER,
    };
  }
}

export function createPaymentHeader(data) {
  return (dispatch) => {
    dispatch(requestCreatePaymentHeader(data));
    return apiUtils
      .callAPI(`/api/createPaymentHeader`, "POST", data)
      .then((json) => dispatch(receiveCreatePaymentHeader(json)))
      .then((json) => dispatch(getCardDetails(data.client_id)))
  };
}

// UPDATE PAYMENT HEADER
export const REQUEST_UPDATE_PAYMENT_HEADER = "REQUEST_UPDATE_PAYMENT_HEADER";
function requestUpdatePaymentHeader(data) {
  return {
    data,
    type: REQUEST_UPDATE_PAYMENT_HEADER,
  };
}

export const RECEIVE_UPDATE_PAYMENT_HEADER = "RECEIVE_UPDATE_PAYMENT_HEADER";
function receiveUpdatePaymentHeader(json) {
  if (json.data) {
    return {
      item: json.data,
      receivedAt: Date.now(),
      type: RECEIVE_UPDATE_PAYMENT_HEADER,
    };
  } else {
    return {
      item: json.data,
      receivedAt: Date.now(),
      success: json.success,
      type: RECEIVE_UPDATE_PAYMENT_HEADER,
    };
  }
}

export function updatePaymentHeader(data) {
  return (dispatch) => {
    dispatch(requestUpdatePaymentHeader(data));
    return apiUtils
      .callAPI(`/api/updatePaymentHeader`, "POST", data)
      .then((json) => dispatch(receiveUpdatePaymentHeader(json)))
  };
}

// GET PAYMENT HEADER
export const REQUEST_PAYMENT_LIST = "REQUEST_PAYMENT_LIST";
function requestGetPaymentHeader(listArgs) {
  return {
    listArgs,
    type: REQUEST_PAYMENT_LIST,
  };
}

export const RECEIVE_PAYMENT_LIST = "RECEIVE_PAYMENT_LIST";
function receiveGetPaymentHeader(json, listArgs) {
    return {
      message: json.message,
      list: json.data,
      listArgs,
      receivedAt: Date.now(),
      success: json.success,
      type: RECEIVE_PAYMENT_LIST,
    };
}

export function getPaymentHeader(...listArgs) {
  return (dispatch) => {
    if (listArgs.length === 0) {
      listArgs = ["all"];
    }
    dispatch(requestGetPaymentHeader(listArgs));

    let apiTarget = `/api/getPaymentHeader/${listArgs[0]}`;
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
      .then((json) => dispatch(receiveGetPaymentHeader(json, listArgs)));
  };
}

// SEND EMAIL
export const REQUEST_SEND_EMAIL = "REQUEST_SEND_EMAIL";
function requestSendEmail(data) {
  return {
    data,
    type: REQUEST_SEND_EMAIL,
  };
}

export const RECEIVE_SEND_EMAIL = "RECEIVE_SEND_EMAIL";
function receiveSendEmail(json) {
  if (json.success) {
    return {
      message: json.message,
      receivedAt: Date.now(),
      success: json.success,
      type: RECEIVE_SEND_EMAIL,
    };
  } else {
    return {
      message: json.message,
      receivedAt: Date.now(),
      success: json.success,
      type: RECEIVE_SEND_EMAIL,
    };
  }
}

export function sendEmail(data) {
  return (dispatch) => {
    dispatch(requestSendEmail(data));
    return apiUtils
      .callAPI(`/api/sendEmailLink`, "POST", data)
      .then((json) => dispatch(receiveSendEmail(json)))
  };
}

// UTIL
export const SET_PAYMENT_FILTER = "SET_PAYMENT_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_PAYMENT_FILTER
  }
}

export const SET_PAYMENT_PAGINATION = "SET_PAYMENT_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_PAYMENT_PAGINATION
  }
}
