/**
 * All PhoneNumber CRUD actions
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
  const { byId, selected } = state.phoneNumber;
  if(!id) {
    // passed in null or undefined for the id parameter.  so we should NOT fetch 
    return false;
  // } else if(selected.id != id) {
  //   // the "selected" id changed, so we _should_ fetch
  //   // console.log("Y shouldFetch - true: id changed");
  //   return true;
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

export const INVALIDATE_SELECTED_PHONE_NUMBER = "INVALIDATE_SELECTED_PHONE_NUMBER"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_PHONE_NUMBER
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSinglePhoneNumberById(id))
  } else {
    return dispatch(returnSinglePhoneNumberPromise(id)); // return promise that contains phoneNumber
  }
}

export const returnSinglePhoneNumberPromise = (id) => (dispatch, getState) => {
  /**
   * This returns the object from the map so that we can do things with it in
   * the component.
   *
   * For the "fetchIfNeeded()" functionality, we need to return a promised object
   * EVEN IF we don't need to fetch it. this is because if we have any .then()'s
   * in the components, they will fail when we don't need to fetch.
   */
  return new Promise((resolve, reject) => {
    resolve({
      type: "RETURN_SINGLE_PHONE_NUMBER_WITHOUT_FETCHING"
      , id: id
      , item: getState().phoneNumber.byId[id]
      , success: true
    })
  });
}

export const REQUEST_SINGLE_PHONE_NUMBER = "REQUEST_SINGLE_PHONE_NUMBER";
function requestSinglePhoneNumber(id) {
  return {
    type: REQUEST_SINGLE_PHONE_NUMBER
    , id
  }
}

export const RECEIVE_SINGLE_PHONE_NUMBER = "RECEIVE_SINGLE_PHONE_NUMBER";
function receiveSinglePhoneNumber(json) {
  return {
    type: RECEIVE_SINGLE_PHONE_NUMBER
    , id: json.phoneNumber ? json.phoneNumber._id : null
    , item: json.phoneNumber
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function fetchSinglePhoneNumberById(phoneNumberId) {
  return dispatch => {
    dispatch(requestSinglePhoneNumber(phoneNumberId))
    return apiUtils.callAPI(`/api/phone-numbers/${phoneNumberId}`)
      .then(json => dispatch(receiveSinglePhoneNumber(json)))
  }
}

export const ADD_SINGLE_PHONE_NUMBER_TO_MAP = "ADD_SINGLE_PHONE_NUMBER_TO_MAP";
export function addSinglePhoneNumberToMap(item) {
  return {
    type: ADD_SINGLE_PHONE_NUMBER_TO_MAP
    , item
  }
}

export const SET_SELECTED_PHONE_NUMBER = "SET_SELECTED_PHONE_NUMBER";
export function setSelectedPhoneNumber(item) {
  return {
    type: SET_SELECTED_PHONE_NUMBER
    , item
  }
}


export const REQUEST_DEFAULT_PHONE_NUMBER = "REQUEST_DEFAULT_PHONE_NUMBER";
function requestDefaultPhoneNumber(id) {
  return {
    type: REQUEST_DEFAULT_PHONE_NUMBER
  }
}

export const RECEIVE_DEFAULT_PHONE_NUMBER = "RECEIVE_DEFAULT_PHONE_NUMBER";
function receiveDefaultPhoneNumber(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_PHONE_NUMBER
  }
}

export function fetchDefaultPhoneNumber() {
  return dispatch => {
    dispatch(requestDefaultPhoneNumber())
    return apiUtils.callAPI(`/api/phone-numbers/default`)
      .then(json => dispatch(receiveDefaultPhoneNumber(json)))
  }
}


export const REQUESTPHONE_NUMBER_SCHEMA = "REQUESTPHONE_NUMBER_SCHEMA";
function requestPhoneNumberSchema(id) {
  return {
    type: REQUESTPHONE_NUMBER_SCHEMA
  }
}

export const RECEIVEPHONE_NUMBER_SCHEMA = "RECEIVEPHONE_NUMBER_SCHEMA";
function receivePhoneNumberSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVEPHONE_NUMBER_SCHEMA
  }
}

export function fetchPhoneNumberSchema() {
  return dispatch => {
    dispatch(requestPhoneNumberSchema())
    return apiUtils.callAPI(`/api/phone-numbers/schema`)
      .then(json => dispatch(receivePhoneNumberSchema(json)))
  }
}


export const REQUEST_CREATE_PHONE_NUMBER = "REQUEST_CREATE_PHONE_NUMBER";
function requestCreatePhoneNumber(phoneNumber) {
  return {
    type: REQUEST_CREATE_PHONE_NUMBER
    , phoneNumber
  }
}

export const RECEIVE_CREATE_PHONE_NUMBER = "RECEIVE_CREATE_PHONE_NUMBER";
function receiveCreatePhoneNumber(json) {
  return {
    type: RECEIVE_CREATE_PHONE_NUMBER
    , id: json.phoneNumber ? json.phoneNumber._id : null
    , item: json.phoneNumber
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function sendCreatePhoneNumber(data) {
  return dispatch => {
    dispatch(requestCreatePhoneNumber(data))
    return apiUtils.callAPI('/api/phone-numbers', 'POST', data)
      .then(json => dispatch(receiveCreatePhoneNumber(json)))
  }
}

export const REQUEST_UPDATE_PHONE_NUMBER = "REQUEST_UPDATE_PHONE_NUMBER";
function requestUpdatePhoneNumber(phoneNumber) {
  return {
    id: phoneNumber ? phoneNumber._id : null
    , phoneNumber
    , type: REQUEST_UPDATE_PHONE_NUMBER
  }
}

export const RECEIVE_UPDATE_PHONE_NUMBER = "RECEIVE_UPDATE_PHONE_NUMBER";
function receiveUpdatePhoneNumber(json) {
  return {
    type: RECEIVE_UPDATE_PHONE_NUMBER
    , id: json.phoneNumber ? json.phoneNumber._id : null
    , item: json.phoneNumber
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function sendUpdatePhoneNumber(data) {
  return dispatch => {
    dispatch(requestUpdatePhoneNumber(data))
    return apiUtils.callAPI(`/api/phone-numbers/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdatePhoneNumber(json)))
  }
}

export const REQUEST_DELETE_PHONE_NUMBER = "REQUEST_DELETE_PHONE_NUMBER";
function requestDeletePhoneNumber(id) {
  return {
    type: REQUEST_DELETE_PHONE_NUMBER
    , id
  }
}

export const RECEIVE_DELETE_PHONE_NUMBER = "RECEIVE_DELETE_PHONE_NUMBER";
function receiveDeletePhoneNumber(id, json) {
  return {
    id
    , error: json.message
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_PHONE_NUMBER
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeletePhoneNumber(id))
    return apiUtils.callAPI(`/api/phone-numbers/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeletePhoneNumber(id, json)))
  }
}


/**
 * PHONE_NUMBER LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest phoneNumberLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.phoneNumber.lists, {});
  let list = { ...state.phoneNumber.lists }
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
    return dispatch(returnPhoneNumberListPromise(...listArgs));
  }
}

export const returnPhoneNumberListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItems = listItemIds.map(id => state.phoneNumber.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_PHONE_NUMBER_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_PHONE_NUMBER_LIST = "REQUEST_PHONE_NUMBER_LIST"
function requestPhoneNumberList(listArgs) {
  return {
    type: REQUEST_PHONE_NUMBER_LIST
    , listArgs
  }
}

export const RECEIVE_PHONE_NUMBER_LIST = "RECEIVE_PHONE_NUMBER_LIST"
function receivePhoneNumberList(json, listArgs) {
  return {
    type: RECEIVE_PHONE_NUMBER_LIST
    , listArgs
    , list: json.phoneNumbers
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export const ADD_PHONE_NUMBER_TO_LIST = "ADD_PHONE_NUMBER_TO_LIST";
export function addPhoneNumberToList(id, ...listArgs) {
  // console.log("Add phoneNumber to list", id);
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: ADD_PHONE_NUMBER_TO_LIST
    , id
    , listArgs
  }
}

export const REMOVE_PHONE_NUMBER_FROM_LIST = "REMOVE_PHONE_NUMBER_FROM_LIST"
export function removePhoneNumberFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_PHONE_NUMBER_FROM_LIST
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
    dispatch(requestPhoneNumberList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/phone-numbers/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/phone-numbers/by-[ARG1]/[ARG2]".
     *    ex: /api/phone-numbers/by-category/:category
     *  if 2nd arg is an array, though, return "/api/phone-numbers/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/phone-numbers";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of phoneNumbers given an array of phoneNumber id's, among other things
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
      json => dispatch(receivePhoneNumberList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_PHONE_NUMBER_FILTER = "SET_PHONE_NUMBER_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET_PHONE_NUMBER_FILTER
    , filter
    , listArgs
  }
}

export const SET_PHONE_NUMBER_PAGINATION = "SET_PHONE_NUMBER_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET_PHONE_NUMBER_PAGINATION
    , pagination
    , listArgs
  }
}

export const INVALIDATE_PHONE_NUMBER_LIST = "INVALIDATE_PHONE_NUMBER_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: INVALIDATE_PHONE_NUMBER_LIST
    , listArgs
  }
}

export function addPhoneNumbersList(phoneNumbers, listArgs) {
  return {
    type: RECEIVE_PHONE_NUMBER_LIST
    , listArgs
    , list: phoneNumbers
    , success: true
    , error: null
    , receivedAt: Date.now()
  }
}

export const fetchListByClientIdsIfNeeded = (listArgs, clientIds) => (dispatch, getState) => {
  if(shouldFetchList(getState(), listArgs)) {
    dispatch(requestPhoneNumberList(listArgs))
    return apiUtils.callAPI('/api/phone-numbers/list-by-client-ids', 'POST', { clientIds })
        .then(json => dispatch(receivePhoneNumberList(json, listArgs)));
  } else {
    return dispatch(returnPhoneNumberListPromise(...listArgs));
  }
}

export const fetchListByIdsIfNeeded = (listArgs, ids) => (dispatch, getState) => {
  if(shouldFetchList(getState(), listArgs)) {
    dispatch(requestPhoneNumberList(listArgs))
    return apiUtils.callAPI('/api/phone-numbers/list-by-ids', 'POST', { ids })
        .then(json => dispatch(receivePhoneNumberList(json, listArgs)));
  } else {
    return dispatch(returnPhoneNumberListPromise(...listArgs));
  }
}