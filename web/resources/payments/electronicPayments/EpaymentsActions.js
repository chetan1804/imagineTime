import apiUtils from  "../../../global/utils/api";

// GET ENROLL MERCHANT STATUS
export const REQUEST_GET_ENROLL_MERCHANT_STATUS = "REQUEST_GET_ENROLL_MERCHANT_STATUS";
function requestGetEnrollMerchantStatus(registration) {
  return {
    registration,
    type: REQUEST_GET_ENROLL_MERCHANT_STATUS,
  };
}

export const RECEIVE_GET_ENROLL_MERCHANT_STATUS = "RECEIVE_GET_ENROLL_MERCHANT_STATUS";
function receiveGetEnrollMerchantStatus(json) {
  if (json.data) {
    return {
      item: json.data,
      receivedAt: Date.now(),
      type: RECEIVE_GET_ENROLL_MERCHANT_STATUS,
    };
  } else {
    return {
      item: json.firmData,
      receivedAt: Date.now(),
      success: json.success,
      type: RECEIVE_GET_ENROLL_MERCHANT_STATUS,
    };
  }
}

export function getEnrollMerchantStatus(firmId) {
  return (dispatch) => {
    dispatch(requestGetEnrollMerchantStatus(firmId));
    return apiUtils
      .callAPI(`/api/merchant/${firmId}/registration`, "GET")
      .then((json) => dispatch(receiveGetEnrollMerchantStatus(json)))
  };
}

// ENROLL ASSUME
export const REQUEST_ENROLL_ASSUME = "REQUEST_ENROLL_ASSUME";
function requestEnrollAssume(assume) {
  return {
    assume,
    type: REQUEST_ENROLL_ASSUME,
  };
}

export const RECEIVE_ENROLL_ASSUME = "RECEIVE_ENROLL_ASSUME";
function receiveEnrollAssume(json) {
  if (json.data) {
    return {
      item: json.data,
      receivedAt: Date.now(),
      success: json.success,
      type: RECEIVE_ENROLL_ASSUME,
    };
  } else {
    return {
      item: json.firmData,
      receivedAt: Date.now(),
      success: json.success,
      type: RECEIVE_ENROLL_ASSUME,
    };
  }
}

export function enrollAssume(firmId) {
  return (dispatch) => {
    dispatch(requestEnrollAssume(firmId));
    return apiUtils
      .callAPI(`/api/merchant/${firmId}/assume`, "POST")
      .then((json) => dispatch(receiveEnrollAssume(json)))
  };
}

// SSO TOKEN
export const REQUEST_SSO_TOKEN = "REQUEST_SSO_TOKEN";
function requestSSOToken(ssoToken) {
  return {
    ssoToken,
    type: REQUEST_SSO_TOKEN,
  };
}

export const RECEIVE_SSO_TOKEN = "RECEIVE_SSO_TOKEN";
function receiveSSOToken(json) {
  if (json.data) {
    return {
      item: json.data,
      receivedAt: Date.now(),
      success: json.success,
      type: RECEIVE_SSO_TOKEN,
    };
  } else {
    return {
      item: json.firmData,
      receivedAt: Date.now(),
      success: json.success,
      type: RECEIVE_SSO_TOKEN,
    };
  }
}

export function getSSOToken(data) {
  return (dispatch) => {
    dispatch(requestSSOToken(data));
    return apiUtils
      .callAPI(`/api/merchant/${data}`, "GET")
      .then((json) => dispatch(receiveSSOToken(json)))
  };
}