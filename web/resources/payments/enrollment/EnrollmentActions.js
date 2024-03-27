import apiUtils from  "../../../global/utils/api";

// CREATE MERCHANT
export const REQUEST_CREATE_MERCHANT = "REQUEST_CREATE_MERCHANT";
function requestCreateMerchant(merchant) {
  return {
    merchant,
    type: REQUEST_CREATE_MERCHANT,
  };
}

export const RECEIVE_CREATE_MERCHANT = "RECEIVE_CREATE_MERCHANT";
function receiveCreateMerchant(json) {
  if (json.data) {
    return {
      item: json.data,
      receivedAt: Date.now(),
      success: json.data.success[0],
      type: RECEIVE_CREATE_MERCHANT,
    };
  } else {
    return {
      item: json.firmData,
      receivedAt: Date.now(),
      success: json.success,
      type: RECEIVE_CREATE_MERCHANT,
    };
  }
}

export function sendCreateMerchant(data) {
  return (dispatch) => {
    dispatch(requestCreateMerchant(data));
    return apiUtils
      .callAPI("/api/merchant/register", "POST", data)
      .then((json) => dispatch(receiveCreateMerchant(json)))
  };
}

// GET MERCHANT STATUS
export const REQUEST_GET_MERCHANT_STATUS = "REQUEST_GET_MERCHANT_STATUS";
function requestGetMerchantStatus(merchant) {
  return {
    merchant,
    type: REQUEST_GET_MERCHANT_STATUS,
  };
}

export const RECEIVE_GET_MERCHANT_STATUS = "RECEIVE_GET_MERCHANT_STATUS";
function receiveGetMerchantStatus(json) {
  if (json.data) {
    return {
      item: json.data,
      receivedAt: Date.now(),
      type: RECEIVE_GET_MERCHANT_STATUS,
    };
  } else {
    return {
      item: json.firmData,
      receivedAt: Date.now(),
      success: json.success,
      type: RECEIVE_GET_MERCHANT_STATUS,
    };
  }
}

export function getMerchantStatus(firmId) {
  return (dispatch) => {
    dispatch(requestGetMerchantStatus(firmId));
    return apiUtils
      .callAPI(`/api/merchant/${firmId}`, "GET")
      .then((json) => dispatch(receiveGetMerchantStatus(json)))
  };
}