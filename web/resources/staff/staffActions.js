/**
 * All staff CRUD actions
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

/**
 * NOTE: this is for associating 'logged in' staff objects by firm id and 
 * exposing them to the reducer 
 * @param {*} state 
 * @param {*} id 
 */

const shouldFetchLoggedInByFirm = (state, firmId) => {
  /**
   * This is helper method to determine whether we should fetch a new single
   * user object from the server, or if a valid one already exists in the store
   *
   * NOTE: Uncomment console logs to help debugging
   */
  // console.log("shouldFetch single");
  const { loggedInByFirm } = state.staff;
  if(!firmId) {
    // passed in null or undefined for the id parameter.  so we should NOT fetch 
    return false;
  } else if(!loggedInByFirm[firmId]) {
    // the firmId is not in the map.  fetch from server
    return true; 
  } else if(loggedInByFirm[firmId].isFetching) {
    // it is already fetching, don't do anything
    return false;
  } else if(!loggedInByFirm[firmId].error && !loggedInByFirm[firmId].staff) {
    // the firmId is in the map, but the staff object doesn't exist 
    // however, if the api returned an error, then the staff ojbect SHOULDN'T be in there
    // so re-fetching it will result in an infinite loop
    // console.log("Y shouldFetch - true: not in map");
    return true;
  } else if(new Date().getTime() - loggedInByFirm[firmId].lastUpdated > (1000 * 60 * 5)) {
    // it's been longer than 5 minutes since the last fetch, get a new one
    // console.log("Y shouldFetch - true: older than 5 minutes");
    // also, don't automatically invalidate on server error. if server throws an error,
    // that won't change on subsequent requests and we will have an infinite loop
    return true;
  } else {
    // if "selected" is invalidated, fetch a new one, otherwise don't
    // console.log("Y shouldFetch - " + selected.didInvalidate + ": didInvalidate");
    return loggedInByFirm[firmId].didInvalidate;
  }
}

export const INVALIDATE_STAFF_LOGGED_IN_BY_FIRM = "INVALIDATE_STAFF_LOGGED_IN_BY_FIRM"
export function invalidateLoggedInByFirm(firmId) {
  return {
    firmId
    , type: INVALIDATE_STAFF_LOGGED_IN_BY_FIRM
  }
}

export const fetchStaffLoggedInByFirmIfNeeded = (firmId) => (dispatch, getState) => {
  if (shouldFetchLoggedInByFirm(getState(), firmId)) {
    return dispatch(fetchStaffLoggedInByFirmId(firmId))
  } else {
    return dispatch(returnStaffLoggedInByFirmPromise(firmId)); // return promise that contains staff
  }
}


export const returnStaffLoggedInByFirmPromise = (firmId) => (dispatch, getState) => {
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
      firmId: firmId
      , item: getState().staff.loggedInByFirm[firmId].staff
      , success: true
      , type: "RETURN_STAFF_LOGGED_IN_BY_FIRM_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_STAFF_LOGGED_IN_BY_FIRM = "REQUEST_STAFF_LOGGED_IN_BY_FIRM";
function requestStaffLoggedInByFirmId(firmId) {
  return {
    firmId
    , type: REQUEST_STAFF_LOGGED_IN_BY_FIRM
  }
}

export const RECEIVE_STAFF_LOGGED_IN_BY_FIRM = "RECEIVE_STAFF_LOGGED_IN_BY_FIRM";
function receiveStaffLoggedInByFirmId(json, firmId) {
  return {
    error: json.message
    , firmId: firmId // When no staff is found this was creating a new list called null and leaving the original list fetching forever.
    , item: json.staff
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_STAFF_LOGGED_IN_BY_FIRM
  }
}

export function fetchStaffLoggedInByFirmId(firmId) {
  return dispatch => {
    dispatch(requestStaffLoggedInByFirmId(firmId))
    return apiUtils.callAPI(`/api/staff/logged-in-by-firm/${firmId}`)
      .then(json => dispatch(receiveStaffLoggedInByFirmId(json, firmId)))
  }
}








const shouldFetchSingle = (state, id) => {
  /**
   * This is helper method to determine whether we should fetch a new single
   * user object from the server, or if a valid one already exists in the store
   *
   * NOTE: Uncomment console logs to help debugging
   */
  // console.log("shouldFetch single");
  const { byId, selected } = state.staff;
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

export const INVALIDATE_SELECTED_STAFF = "INVALIDATE_SELECTED_STAFF"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_STAFF
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleStaffById(id))
  } else {
    return dispatch(returnSingleStaffPromise(id)); // return promise that contains staff
  }
}


export const returnSingleStaffPromise = (id) => (dispatch, getState) => {
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
      , item: getState().staff.byId[id]
      , success: true
      , type: "RETURN_SINGLE_STAFF_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SINGLE_STAFF = "REQUEST_SINGLE_STAFF";
function requestSingleStaff(id) {
  return {
    id
    , type: REQUEST_SINGLE_STAFF
  }
}

export const RECEIVE_SINGLE_STAFF = "RECEIVE_SINGLE_STAFF";
function receiveSingleStaff(json) {
  return {
    error: json.message
    , id: json.staff ? json.staff._id : null
    , item: json.staff
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_STAFF
  }
}

export function fetchSingleStaffById(id) {
  return dispatch => {
    dispatch(requestSingleStaff(id))
    return apiUtils.callAPI(`/api/staff/${id}`)
      .then(json => dispatch(receiveSingleStaff(json)))
  }
}

export const ADD_SINGLE_STAFF_TO_MAP = "ADD_SINGLE_STAFF_TO_MAP";
export function addSingleStaffToMap(item) {
  return {
    item
    , type: ADD_SINGLE_STAFF_TO_MAP
  }
}

export const SET_SELECTED_STAFF = "SET_SELECTED_STAFF";
export function setSelectedStaff(item) {
  return {
    type: SET_SELECTED_STAFF
    , item
  }
}

export const REQUEST_DEFAULT_STAFF = "REQUEST_DEFAULT_STAFF";
function requestDefaultStaff(id) {
  return {
    type: REQUEST_DEFAULT_STAFF
  }
}

export const RECEIVE_DEFAULT_STAFF = "RECEIVE_DEFAULT_STAFF";
function receiveDefaultStaff(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_STAFF
  }
}

export function fetchDefaultStaff() {
  return dispatch => {
    dispatch(requestDefaultStaff())
    return apiUtils.callAPI(`/api/staff/default`)
      .then(json => dispatch(receiveDefaultStaff(json)))
  }
}

export const REQUEST_STAFF_SCHEMA = "REQUEST_STAFF_SCHEMA";
function requestStaffSchema(id) {
  return {
    type: REQUEST_STAFF_SCHEMA
  }
}
 export const RECEIVE_STAFF_SCHEMA = "RECEIVE_STAFF_SCHEMA";
function receiveStaffSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_STAFF_SCHEMA
  }
}
 export function fetchStaffSchema() {
  return dispatch => {
    dispatch(requestStaffSchema())
    return apiUtils.callAPI(`/api/staff/schema`)
      .then(json => dispatch(receiveStaffSchema(json)))
  }
}

export const REQUEST_CREATE_STAFF = "REQUEST_CREATE_STAFF";
function requestCreateStaff(staff) {
  return {
    staff
    , type: REQUEST_CREATE_STAFF
  }
}

export const RECEIVE_CREATE_STAFF = "RECEIVE_CREATE_STAFF";
function receiveCreateStaff(json) {
  return {
    error: json.message
    , id: json.staff ? json.staff._id : null
    , item: json.staff
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_STAFF
  }
}

export function sendCreateStaff(data) {
  return dispatch => {
    dispatch(requestCreateStaff(data))
    return apiUtils.callAPI('/api/staff', 'POST', data)
      .then(json => dispatch(receiveCreateStaff(json)))
  }
}

/**
 * INVITE STAFF MEMBERS VIA EMAIL 
 */

export const REQUEST_INVITE_STAFF = "REQUEST_INVITE_STAFF";
function requestInviteStaff(staff) {
  return {
    staff
    , type: REQUEST_INVITE_STAFF
  }
}

export const RECEIVE_INVITE_STAFF = "RECEIVE_INVITE_STAFF";
function receiveInviteStaff(json) {
  return {
    error: json.message
    , data: json.data
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_INVITE_STAFF
  }
}

export function sendInviteStaff(firmId, data) {
  return dispatch => {
    dispatch(requestInviteStaff(data))
    return apiUtils.callAPI('/api/staff/invite/' + firmId, 'POST', data)
      .then(json => dispatch(receiveInviteStaff(json)))
  }
}

export const REQUEST_UPDATE_STAFF = "REQUEST_UPDATE_STAFF";
function requestUpdateStaff(staff) {
  return {
    id: staff ? staff._id: null
    , staff
    , type: REQUEST_UPDATE_STAFF
  }
}

export const RECEIVE_UPDATE_STAFF = "RECEIVE_UPDATE_STAFF";
function receiveUpdateStaff(json) {
  return {
    error: json.message
    , id: json.staff ? json.staff._id : null
    , item: json.staff
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_STAFF
  }
}

export function sendUpdateStaff(data) {
  return dispatch => {
    dispatch(requestUpdateStaff(data))
    return apiUtils.callAPI(`/api/staff/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateStaff(json)))
  }
}

export const REQUEST_DELETE_STAFF = "REQUEST_DELETE_STAFF";
function requestDeleteStaff(id) {
  return {
    id
    , type: REQUEST_DELETE_STAFF
  }
}

export const RECEIVE_DELETE_STAFF = "RECEIVE_DELETE_STAFF";
function receiveDeleteStaff(id, json) {
  return {
    error: json.message
    , id
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_STAFF
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteStaff(id))
    return apiUtils.callAPI(`/api/staff/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteStaff(id, json)))
  }
}


/**
 * LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest staffLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.staff.lists, {});
  let list = { ...state.staff.lists }
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
    return dispatch(returnStaffListPromise(...listArgs));
  }
}

export const returnStaffListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItems = listItemIds.map(id => state.staff.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_STAFF_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_STAFF_LIST = "REQUEST_STAFF_LIST"
function requestStaffList(listArgs) {
  return {
    listArgs
    , type: REQUEST_STAFF_LIST
  }
}

export const RECEIVE_STAFF_LIST = "RECEIVE_STAFF_LIST"
function receiveStaffList(json, listArgs) {
  // console.log("____________")
  // console.log(json);
  return {
    error: json.message
    , list: json.staff
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_STAFF_LIST
  }
}

export const ADD_STAFF_TO_LIST = "ADD_STAFF_TO_LIST";
export function addStaffToList(item, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  // allow user to either send the entire object or just the _id
  if(typeof(item) === 'string' || typeof(item) === 'number') {
    return {
      type: ADD_STAFF_TO_LIST
      , id: item
      , listArgs
    }
  } else {
    return {
      type: ADD_STAFF_TO_LIST
      , id: item._id
      , listArgs
    }
  }
}

export const REMOVE_STAFF_FROM_LIST = "REMOVE_STAFF_FROM_LIST"
export function removeStaffFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_STAFF_FROM_LIST
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
    dispatch(requestStaffList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/staff/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/staff/by-[ARG1]/[ARG2]".
     *    ex: /api/staff/by-category/:category
     *  if 2nd arg is an array, though, return "/api/staff/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/staff";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of staff given an array of staff id's, among other things
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
      json => dispatch(receiveStaffList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_STAFF_FILTER = "SET_STAFF_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_STAFF_FILTER
  }
}

export const SET_STAFF_PAGINATION = "SET_STAFF_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_STAFF_PAGINATION
  }
}

export const INVALIDATE_STAFF_LIST = "INVALIDATE_STAFF_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , type: INVALIDATE_STAFF_LIST
  }
}

// Assuresign actions

export const REQUEST_CREATE_ESIG_CREDENTIALS = "REQUEST_CREATE_ESIG_CREDENTIALS";
function requestCreateESigCredentials(staffId) {
  return {
    id: staffId
    , type: REQUEST_CREATE_ESIG_CREDENTIALS
  }
}

export const RECEIVE_CREATE_ESIG_CREDENTIALS = "RECEIVE_CREATE_ESIG_CREDENTIALS";
function receiveCreateESigCredentials(json) {
  return {
    error: json.message
    , id: json.staff ? json.staff._id : null
    , item: json.staff
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_ESIG_CREDENTIALS
  }
}

export function sendCreateESigCredentials(data) {
  return dispatch => {
    dispatch(requestCreateESigCredentials(data.staffId))
    return apiUtils.callAPI(`/api/staff/${data.staffId}/create-api-user`, 'PUT', { eSigEmail: data.eSigEmail, reAddUser: !!data.reAddUser })
      .then(json => dispatch(receiveCreateESigCredentials(json)))
  }
}

export const REQUEST_INVITE_RESET_USER = "REQUEST_INVITE_RESET_USER";
function requestInviteWithResetUser(user) {
  return {
    type: REQUEST_INVITE_RESET_USER
    , user
  }
}

export const RECEIVE_INVITE_RESET_USER = "RECEIVE_INVITE_RESET_USER";
function receiveInviteWithResetUser(json) {
  return {
    error: json.message
    , data: json.data
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_INVITE_RESET_USER
  }
}

export function sendInviteWithResetUser(data) {
  return dispatch => {
    dispatch(requestInviteWithResetUser(data))
    return apiUtils.callAPI(`/api/staff/invite-reset/${data.firmId}`, 'POST', { user: data.user })
      .then(json => dispatch(receiveInviteWithResetUser(json)))
  }
}


export function sendBulkInviteStaffs(data) {
  return dispatch => {
    dispatch(requestBulkInviteStaffs(data));
    return apiUtils.callAPI('/api/staff/bulk-invite', 'POST', data)
      .then(json => dispatch(receiveBulkInviteStaffs(json)));
  }
}

export const REQUEST_CREATE_BULK_STAFF = "REQUEST_CREATE_BULK_STAFF";
function requestBulkInviteStaffs(staffs) {
  return {
    staffs
    , type: REQUEST_CREATE_BULK_STAFF
  }
}

export const RECEIVE_CREATE_BULK_STAFF = "RECEIVE_CREATE_BULK_STAFF";
function receiveBulkInviteStaffs(json) {
  return {
    error: json.message
    , item: json.staffs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_BULK_STAFF
  }
}