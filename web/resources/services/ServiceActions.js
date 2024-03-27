import apiUtils from "../../global/utils/api";

// FETCHING SERVICE
export const REQUEST_SERVICE_LIST = "REQUEST_SERVICE_LIST";
function requestServiceList(listArgs) {
  return {
    listArgs,
    type: REQUEST_SERVICE_LIST,
  };
}

export const RECEIVE_SERVICE_LIST = "RECEIVE_SERVICE_LIST";
function receiveServiceList(json, listArgs) {
  return {
    message: json.message,
    list: json.service,
    listArgs,
    receivedAt: Date.now(),
    success: json.success,
    type: RECEIVE_SERVICE_LIST,
  };
}

export function fetchServiceList(...listArgs) {
  return (dispatch) => {
    if (listArgs.length === 0) {
      listArgs = ["all"];
    }
    dispatch(requestServiceList(listArgs));

    let apiTarget = "/api/service/getAll";
    if (listArgs.length == 1 && listArgs[0] !== "all") {
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
      .then((json) => dispatch(receiveServiceList(json, listArgs)));
  };
}

// CREATE SERVICE
export const REQUEST_CREATE_SERVICE = "REQUEST_CREATE_SERVICE";
function requestCreateService(service) {
  return {
    service,
    type: REQUEST_CREATE_SERVICE,
  };
}

export const RECEIVE_CREATE_SERVICE = "RECEIVE_CREATE_SERVICE";
function receiveCreateService(json) {
  return {
    error: json.message,
    id: json.service ? json.service._id : null,
    item: json.service,
    receivedAt: Date.now(),
    success: json.success,
    type: RECEIVE_CREATE_SERVICE,
  };
}

export function sendCreateService(data) {
  return (dispatch) => {
    dispatch(requestCreateService(data));
    return apiUtils
      .callAPI("/api/service/create", "POST", data)
      .then((json) => dispatch(receiveCreateService(json)))
      .then(() => dispatch(fetchServiceList()));
  };
}

// UPDATE SERVICE
export const REQUEST_UPDATE_SERVICE = "REQUEST_UPDATE_SERVICE";
function requestUpdateService(data) {
  return {
    id: data ? data._id: null,
    data,
    type: REQUEST_UPDATE_SERVICE
  }
}

export const RECEIVE_UPDATE_SERVICE = "RECEIVE_UPDATE_SERVICE";
function receiveUpdateService(json) {
  return {
    error: json.message,
    id: json.data ? json.data._id: null,
    item: json.data,
    receivedAt: Date.now(),
    success: json.success,
    type: RECEIVE_UPDATE_SERVICE
  }
}

export function sendUpdateService(data) {
  return dispatch => {
    dispatch(requestUpdateService(data))
    return apiUtils
      .callAPI(`/api/service/updateService/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateService(json)))
      .then(() => dispatch(fetchServiceList()));
  }
}

// DELETE SERVICE
export const REQUEST_DELETE_SERVICE = "REQUEST_DELETE_SERVICE";
function requestDeleteService(id) {
  return {
    id,
    type: REQUEST_DELETE_SERVICE
  }
}

export const RECEIVE_DELETE_SERVICE = "RECEIVE_DELETE_SERVICE";
function receiveDeleteService(id, json) {
  return {
    error: json.message,
    id,
    receivedAt: Date.now(),
    success: json.success,
    type: RECEIVE_DELETE_SERVICE
  }
}

export function sendDeleteService(id) {
  return dispatch => {
    dispatch(requestDeleteService(id))
    return apiUtils
      .callAPI(`/api/service/delete/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteService(id, json)))
      .then(() => dispatch(fetchServiceList()));
  }
}

// GET BY ID
export const REQUEST_SERVICE_BY_ID = "REQUEST_SERVICE_BY_ID";
function requestServiceById(id) {
  return {
    id
    , type: REQUEST_SERVICE_BY_ID
  }
}

export const RECEIVE_SERVICE_BY_ID = "RECEIVE_SERVICE_BY_ID";
function receiveServiceById(json) {
  return {
     item: json.data
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SERVICE_BY_ID
  }
}

export function fetchServiceById(id) {
  return dispatch => {
    dispatch(requestServiceById(id))
    return apiUtils.callAPI(`/api/service/getById/${id}`, 'GET')
      .then(json => dispatch(receiveServiceById(json)))
  }
}

// UTIL
export const SET_SERVICE_FILTER = "SET_SERVICE_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_SERVICE_FILTER
  }
}

export const SET_SERVICE_PAGINATION = "SET_SERVICE_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_SERVICE_PAGINATION
  }
}
