/**
 * All staffClient CRUD actions
 *
 * Actions are payloads of information that send data from the application
 * (i.e. Yote server) to the store. They are the _only_ source of information
 * for the store.
 *
 * NOTE: In Yote, we try to keep actions and reducers dealing with CRUD payloads
 * in terms of 'item' or 'items'. This keeps the action payloads consistent and
 * aides various scoping issues with list management in the reducers.
 */

// import api utility
import apiUtils from '../../global/utils/api'

const shouldFetchSingle = (state, id) => {
  /**
   * This is helper method to determine whether we should fetch a new single
   * user object from the server, or if a valid one already exists in the store
   *
   * NOTE: Uncomment console logs to help debugging
   */
  // console.log("shouldFetch single");
  const { byId, selected } = state.staffClient;
  if(!id) {
    // passed in null or undefined for the id parameter.  so we should NOT fetch 
    return false;
  } else if(selected.id != id) {
    // the "selected" id changed, so we _should_ fetch
    // console.log("Y shouldFetch - true: id changed");
    return true;
  } else if(selected.isFetching) {
    // "selected" is already fetching, don't do anything
    // console.log("Y shouldFetch - false: isFetching");
    return false;
  } else if(!byId[id] && !selected.error) {
    // the id is not in the map, fetch from server
    // however, if the api returned an error, then it SHOULDN'T be in the map
    // so re-fetching it will result in an infinite loop
    // console.log("Y shouldFetch - true: not in map");
    return true;
  } else if(new Date().getTime() - selected.lastUpdated > (1000 * 60 * 5)) {
    // it's been longer than 5 minutes since the last fetch, get a new one
    // console.log("Y shouldFetch - true: older than 5 minutes");
    // also, don't automatically invalidate on server error. if server throws an error,
    // that won't change on subsequent requests and we will have an infinite loop
    return true;
  } else {
    // if "selected" is invalidated, fetch a new one, otherwise don't
    // console.log("Y shouldFetch - " + selected.didInvalidate + ": didInvalidate");
    return selected.didInvalidate;
  }
}

export const INVALIDATE_SELECTED_STAFF_CLIENT = "INVALIDATE_SELECTED_STAFF_CLIENT"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_STAFF_CLIENT
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleStaffClientById(id))
  } else {
    return dispatch(returnSingleStaffClientPromise(id)); // return promise that contains staffClient
  }
}


export const returnSingleStaffClientPromise = (id) => (dispatch, getState) => {
  /**
   * This returns the object from the map so that we can do things with it in
   * the component.
   *
   * For the "fetchIfNeeded()" functionality, we need to return a promised object
   * EVEN IF we don't need to fetch it. this is because if we have any .then()'s
   * in the components, they will fail when we don't need to fetch.
   */
  return new Promise((resolve) => {
    resolve({
      id: id
      , item: getState().staffClient.byId[id]
      , success: true
      , type: "RETURN_SINGLE_STAFF_CLIENT_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SINGLE_STAFF_CLIENT = "REQUEST_SINGLE_STAFF_CLIENT";
function requestSingleStaffClient(id) {
  return {
    id
    , type: REQUEST_SINGLE_STAFF_CLIENT
  }
}

export const RECEIVE_SINGLE_STAFF_CLIENT = "RECEIVE_SINGLE_STAFF_CLIENT";
function receiveSingleStaffClient(json) {
  return {
    error: json.message
    , id: json.staffClient ? json.staffClient._id : null
    , item: json.staffClient
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_STAFF_CLIENT
  }
}

export function fetchSingleStaffClientById(id) {
  return dispatch => {
    dispatch(requestSingleStaffClient(id))
    return apiUtils.callAPI(`/api/staff-clients/${id}`)
      .then(json => dispatch(receiveSingleStaffClient(json)))
  }
}

export const ADD_SINGLE_STAFF_CLIENT_TO_MAP = "ADD_SINGLE_STAFF_CLIENT_TO_MAP";
export function addSingleStaffClientToMap(item) {
  return {
    item
    , type: ADD_SINGLE_STAFF_CLIENT_TO_MAP
  }
}

export const SET_SELECTED_STAFF_CLIENT = "SET_SELECTED_STAFF_CLIENT";
export function setSelectedStaffClient(item) {
  return {
    type: SET_SELECTED_STAFF_CLIENT
    , item
  }
}

export const REQUEST_DEFAULT_STAFF_CLIENT = "REQUEST_DEFAULT_STAFF_CLIENT";
function requestDefaultStaffClient(id) {
  return {
    type: REQUEST_DEFAULT_STAFF_CLIENT
  }
}

export const RECEIVE_DEFAULT_STAFF_CLIENT = "RECEIVE_DEFAULT_STAFF_CLIENT";
function receiveDefaultStaffClient(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_STAFF_CLIENT
  }
}

export function fetchDefaultStaffClient() {
  return dispatch => {
    dispatch(requestDefaultStaffClient())
    return apiUtils.callAPI(`/api/staff-clients/default`)
      .then(json => dispatch(receiveDefaultStaffClient(json)))
  }
}

export const REQUEST_STAFF_CLIENT_SCHEMA = "REQUEST_STAFF_CLIENT_SCHEMA";
function requestStaffClientSchema(id) {
  return {
    type: REQUEST_STAFF_CLIENT_SCHEMA
  }
}
 export const RECEIVE_STAFF_CLIENT_SCHEMA = "RECEIVE_STAFF_CLIENT_SCHEMA";
function receiveStaffClientSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_STAFF_CLIENT_SCHEMA
  }
}
 export function fetchStaffClientSchema() {
  return dispatch => {
    dispatch(requestStaffClientSchema())
    return apiUtils.callAPI(`/api/staff-clients/schema`)
      .then(json => dispatch(receiveStaffClientSchema(json)))
  }
}

export const REQUEST_CREATE_STAFF_CLIENT = "REQUEST_CREATE_STAFF_CLIENT";
function requestCreateStaffClient(staffClient) {
  return {
    staffClient
    , type: REQUEST_CREATE_STAFF_CLIENT
  }
}

export const RECEIVE_CREATE_STAFF_CLIENT = "RECEIVE_CREATE_STAFF_CLIENT";
function receiveCreateStaffClient(json) {
  return {
    error: json.message
    , id: json.staffClient ? json.staffClient._id : null
    , item: json.staffClient
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_STAFF_CLIENT
  }
}

export function sendCreateStaffClient(data) {
  return dispatch => {
    dispatch(requestCreateStaffClient(data))
    return apiUtils.callAPI('/api/staff-clients', 'POST', data)
      .then(json => dispatch(receiveCreateStaffClient(json)))
  }
}

export const REQUEST_CREATE_STAFF_MULTIPLE_CLIENT = "REQUEST_CREATE_STAFF_MULTIPLE_CLIENT";
function requestCreateStaffMultipleClient(data) {
  return {
    data
    , type: REQUEST_CREATE_STAFF_MULTIPLE_CLIENT
  }
}

export const RECEIVE_CREATE_STAFF_MULTIPLE_CLIENT = "RECEIVE_CREATE_STAFF_MULTIPLE_CLIENT";
function receiveCreateStaffMultipleClient(json) {
  return {
    error: json.message
    , data: json.data
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_STAFF_MULTIPLE_CLIENT
  }
}

export function sendCreateStaffMultipleClient(data) {
  return dispatch => {
    dispatch(requestCreateStaffMultipleClient(data))
    return apiUtils.callAPI('/api/staff-multiple-client', 'POST', data)
      .then(json => dispatch(receiveCreateStaffMultipleClient(json)))
  }
}

export const REQUEST_UPDATE_STAFF_CLIENT = "REQUEST_UPDATE_STAFF_CLIENT";
function requestUpdateStaffClient(staffClient) {
  return {
    id: staffClient ? staffClient._id: null
    , staffClient
    , type: REQUEST_UPDATE_STAFF_CLIENT
  }
}

export const RECEIVE_UPDATE_STAFF_CLIENT = "RECEIVE_UPDATE_STAFF_CLIENT";
function receiveUpdateStaffClient(json) {
  return {
    error: json.message
    , id: json.staffClient ? json.staffClient._id : null
    , item: json.staffClient
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_STAFF_CLIENT
  }
}

export function sendUpdateStaffClient(data) {
  return dispatch => {
    dispatch(requestUpdateStaffClient(data))
    return apiUtils.callAPI(`/api/staff-clients/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateStaffClient(json)))
  }
}

export const REQUEST_DELETE_STAFF_CLIENT = "REQUEST_DELETE_STAFF_CLIENT";
function requestDeleteStaffClient(id) {
  return {
    id
    , type: REQUEST_DELETE_STAFF_CLIENT
  }
}

export const RECEIVE_DELETE_STAFF_CLIENT = "RECEIVE_DELETE_STAFF_CLIENT";
function receiveDeleteStaffClient(id, json) {
  return {
    error: json.message
    , id
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_STAFF_CLIENT
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteStaffClient(id))
    return apiUtils.callAPI(`/api/staff-clients/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteStaffClient(id, json)))
  }
}

// BULK DELETE
export const REQUEST_BULK_DELETE_STAFF_CLIENT = "REQUEST_BULK_DELETE_STAFF_CLIENT";
function requestBulkDeleteStaffClient(staff) {
  return {
    staff
    , type: REQUEST_BULK_DELETE_STAFF_CLIENT
  }
}

export const RECEIVE_BULK_DELETE_STAFF_CLIENT = "RECEIVE_BULK_DELETE_STAFF_CLIENT";
function receiveBulkDeleteStaffClient(data, json) {
  return {
    error: json.message
    , data
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_BULK_DELETE_STAFF_CLIENT
  }
}

export function sendBulkDelete(data, firmId) {
  return dispatch => {
    dispatch(requestBulkDeleteStaffClient(data))
    return apiUtils.callAPI(`/api/staff-clients/${firmId}/bulkDelete`, 'POST', data)
      .then(json => dispatch(receiveBulkDeleteStaffClient(data, json)))
  }
}


/**
 * LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest staffClientLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.staffClient.lists, {});
  let list = { ...state.staffClient.lists }
  for(let i = 0; i < listArgs.length; i++) {
    list = list[listArgs[i]];
    if(!list) {
      return false;
    }
  }
  return list;
}

const shouldFetchList = (state, listArgs) => {
  /**
   * Helper method to determine whether to fetch the list or not from arbitrary
   * listArgs
   *
   * NOTE: Uncomment console logs to help debugging
   */
  // console.log("shouldFetchList with these args ", listArgs, "?");
  const list = findListFromArgs(state, listArgs);
  // console.log("LIST in question: ", list);
  if(!list || !list.items) {
    // yes, the list we're looking for wasn't found
    // console.log("X shouldFetch - true: list not found");
    return true;
  } else if(list.isFetching) {
    // no, this list is already fetching
    // console.log("X shouldFetch - false: fetching");
    return false
  } else if(new Date().getTime() - list.lastUpdated > (1000 * 60 * 5)) {
    // yes, it's been longer than 5 minutes since the last fetch
    // console.log("X shouldFetch - true: older than 5 minutes");
    return true;
  } else {
    // maybe, depends on if the list was invalidated
    // console.log("X shouldFetch - " + list.didInvalidate + ": didInvalidate");
    return list.didInvalidate;
  }
}

export const fetchListIfNeeded = (...listArgs) => (dispatch, getState) => {
  if(listArgs.length === 0) {
    // If no arguments passed, make the list we want "all"
    listArgs = ["all"];
  }
  if(shouldFetchList(getState(), listArgs)) {
    return dispatch(fetchList(...listArgs));
  } else {
    return dispatch(returnStaffClientListPromise(...listArgs));
  }
}

export const returnStaffClientListPromise = (...listArgs) => (dispatch, getState) => {
  /**
   * This returns the list object from the reducer so that we can do things with it in
   * the component.
   *
   * For the "fetchIfNeeded()" functionality, we need to return a promised object
   * EVEN IF we don't need to fetch it. This is because if we have any .then()'s
   * in the components, they will fail when we don't need to fetch.
   */

  // return the array of objects just like the regular fetch
  const state = getState();
  const listItemIds = findListFromArgs(state, listArgs).items
  const listItems = listItemIds.map(id => state.staffClient.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_STAFF_CLIENT_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_STAFF_CLIENT_LIST = "REQUEST_STAFF_CLIENT_LIST"
function requestStaffClientList(listArgs) {
  return {
    listArgs
    , type: REQUEST_STAFF_CLIENT_LIST
  }
}

export const RECEIVE_STAFF_CLIENT_LIST = "RECEIVE_STAFF_CLIENT_LIST"
function receiveStaffClientList(json, listArgs) {
  return {
    error: json.message
    , list: json.staffClients
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_STAFF_CLIENT_LIST
  }
}

export const ADD_STAFF_CLIENT_TO_LIST = "ADD_STAFF_CLIENT_TO_LIST";
export function addStaffClientToList(item, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  // allow user to either send the entire object or just the _id
  if(typeof(item) === 'string' || typeof(item) === 'number') {
    return {
      type: ADD_STAFF_CLIENT_TO_LIST
      , id: item
      , listArgs
    }
  } else {
    return {
      type: ADD_STAFF_CLIENT_TO_LIST
      , id: item._id
      , listArgs
    }
  }
}

export const REMOVE_STAFF_CLIENT_FROM_LIST = "REMOVE_STAFF_CLIENT_FROM_LIST"
export function removeStaffClientFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_STAFF_CLIENT_FROM_LIST
    , id
    , listArgs
  }
}

export function fetchList(...listArgs) {
  return dispatch => {
    if(listArgs.length === 0) {
      // default to "all" list if we don't pass any listArgs
      listArgs = ["all"];
    }
    dispatch(requestStaffClientList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/staff-clients/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/staff-clients/by-[ARG1]/[ARG2]".
     *    ex: /api/staff-clients/by-category/:category
     *  if 2nd arg is an array, though, return "/api/staff-clients/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/staff-clients";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of staffClients given an array of staffClient id's, among other things
      apiTarget += `/by-${listArgs[0]}-list?`;
      // build query string
      for(let i = 0; i < listArgs[1].length; i++) {
        apiTarget += `${listArgs[0]}=${listArgs[1][i]}&`
      }
    } else if(listArgs.length == 2) {
      // ex: ("author","12345")
      apiTarget += `/by-${listArgs[0]}/${listArgs[1]}`;
    } else if(listArgs.length > 2) {
      apiTarget += `/by-${listArgs[0]}/${listArgs[1]}`;
      for(let i = 2; i < listArgs.length; i++) {
        apiTarget += `/${listArgs[i]}`;
      }
    }
    return apiUtils.callAPI(apiTarget).then(
      json => dispatch(receiveStaffClientList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_STAFF_CLIENT_FILTER = "SET_STAFF_CLIENT_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_STAFF_CLIENT_FILTER
  }
}

export const SET_STAFF_CLIENT_PAGINATION = "SET_STAFF_CLIENT_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_STAFF_CLIENT_PAGINATION
  }
}

export const INVALIDATE_STAFF_CLIENT_LIST = "INVALIDATE_STAFF_CLIENT_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , type: INVALIDATE_STAFF_CLIENT_LIST
  }
}


export function addStaffClientsList(staffClients, listArgs) {
  return {
    error: null
    , list: staffClients
    , listArgs
    , receivedAt: Date.now()
    , success: true
    , type: RECEIVE_STAFF_CLIENT_LIST
  }
}


export const fetchListByClientIds = (listArgs, clientIds) => (dispatch, getState) => {
  dispatch(requestStaffClientList(listArgs))
  return apiUtils.callAPI('/api/staff-clients/list-by-client-ids', 'POST', { clientIds })
    .then(json => dispatch(receiveStaffClientList(json, listArgs)));
}

export const fetchListByClientIdsIfNeeded = (listArgs, clientIds) => (dispatch, getState) => {
  if(shouldFetchList(getState(), listArgs)) {
    dispatch(requestStaffClientList(listArgs))
    return apiUtils.callAPI('/api/staff-clients/list-by-client-ids', 'POST', { clientIds })
        .then(json => dispatch(receiveStaffClientList(json, listArgs)));
  } else {
    return dispatch(returnStaffClientListPromise(...listArgs));
  }
}

export const RECEIVE_CREATE_MULTIPLE_STAFF_CLIENT = "RECEIVE_CREATE_MULTIPLE_STAFF_CLIENT";
function receiveCreateMultipleStaffClient(json) {
  return {
    error: json.message
    , list: json.staffClients
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_MULTIPLE_STAFF_CLIENT
  }
}

export const REQUEST_CREATE_MULTIPLE_STAFF_CLIENT = "REQUEST_CREATE_MULTIPLE_STAFF_CLIENT";
function requestCreateMultipleStaffClient(staffIds) {
  return {
    staffIds
    , type: REQUEST_CREATE_MULTIPLE_STAFF_CLIENT
  }
}

export function sendCreateMultipleStaffClient(data) {
  return dispatch => {
    dispatch(requestCreateMultipleStaffClient())
    return apiUtils.callAPI('/api/staff-clients/assign-multiple-staff', 'POST', data)
      .then(json => dispatch(receiveCreateMultipleStaffClient(json)))
  }
}

export const ADD_STAFF_CLIENTS_TO_LIST = "ADD_STAFF_CLIENTS_TO_LIST"
export function addStaffClientsToList(ids, listArgs) {
  return {
    type: ADD_STAFF_CLIENTS_TO_LIST
    , ids
    , listArgs
    , receivedAt: Date.now()
  }
}

export const REQUEST_BULK_UPDATE_STAFF_CLIENT = "REQUEST_BULK_UPDATE_STAFF_CLIENT";
function requestBulkUpdateStaffClient(client) {
  return {
    client
    , type: REQUEST_BULK_UPDATE_STAFF_CLIENT
  }
}

export const RECEIVE_BULK_UPDATE_STAFF_CLIENT = "RECEIVE_BULK_UPDATE_STAFF_CLIENT";
function receiveBulkUpdateStaffClient(json) {
  return {
    error: json.message
    , list: json.data
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_BULK_UPDATE_STAFF_CLIENT
  }
}

export function sendBulkNotificationUpdate(data) {
  return dispatch => {
    dispatch(requestBulkUpdateStaffClient(data))
    return apiUtils.callAPI(`/api/staff-clients/bulk-notification-update`, 'POST', data)
      .then(json => dispatch(receiveBulkUpdateStaffClient(json)))
  }
}