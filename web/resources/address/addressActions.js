/**
 * All Address CRUD actions
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
  const { byId, selected } = state.address;
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

export const INVALIDATE_SELECTED_ADDRESS = "INVALIDATE_SELECTED_ADDRESS"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_ADDRESS
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleAddressById(id))
  } else {
    return dispatch(returnSingleAddressPromise(id)); // return promise that contains address
  }
}

export const returnSingleAddressPromise = (id) => (dispatch, getState) => {
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
      type: "RETURN_SINGLE_ADDRESS_WITHOUT_FETCHING"
      , id: id
      , item: getState().address.byId[id]
      , success: true
    })
  });
}

export const REQUEST_SINGLE_ADDRESS = "REQUEST_SINGLE_ADDRESS";
function requestSingleAddress(id) {
  return {
    type: REQUEST_SINGLE_ADDRESS
    , id
  }
}

export const RECEIVE_SINGLE_ADDRESS = "RECEIVE_SINGLE_ADDRESS";
function receiveSingleAddress(json) {
  return {
    type: RECEIVE_SINGLE_ADDRESS
    , id: json.address ? json.address._id : null
    , item: json.address
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function fetchSingleAddressById(addressId) {
  return dispatch => {
    dispatch(requestSingleAddress(addressId))
    return apiUtils.callAPI(`/api/addresses/${addressId}`)
      .then(json => dispatch(receiveSingleAddress(json)))
  }
}

export const ADD_SINGLE_ADDRESS_TO_MAP = "ADD_SINGLE_ADDRESS_TO_MAP";
export function addSingleAddressToMap(item) {
  return {
    type: ADD_SINGLE_ADDRESS_TO_MAP
    , item
  }
}

export const SET_SELECTED_ADDRESS = "SET_SELECTED_ADDRESS";
export function setSelectedAddress(item) {
  return {
    type: SET_SELECTED_ADDRESS
    , item
  }
}


export const REQUEST_DEFAULT_ADDRESS = "REQUEST_DEFAULT_ADDRESS";
function requestDefaultAddress(id) {
  return {
    type: REQUEST_DEFAULT_ADDRESS
  }
}

export const RECEIVE_DEFAULT_ADDRESS = "RECEIVE_DEFAULT_ADDRESS";
function receiveDefaultAddress(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_ADDRESS
  }
}

export function fetchDefaultAddress() {
  return dispatch => {
    dispatch(requestDefaultAddress())
    return apiUtils.callAPI(`/api/addresses/default`)
      .then(json => dispatch(receiveDefaultAddress(json)))
  }
}


export const REQUESTADDRESS_SCHEMA = "REQUESTADDRESS_SCHEMA";
function requestAddressSchema(id) {
  return {
    type: REQUESTADDRESS_SCHEMA
  }
}

export const RECEIVEADDRESS_SCHEMA = "RECEIVEADDRESS_SCHEMA";
function receiveAddressSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVEADDRESS_SCHEMA
  }
}

export function fetchAddressSchema() {
  return dispatch => {
    dispatch(requestAddressSchema())
    return apiUtils.callAPI(`/api/addresses/schema`)
      .then(json => dispatch(receiveAddressSchema(json)))
  }
}


export const REQUEST_CREATE_ADDRESS = "REQUEST_CREATE_ADDRESS";
function requestCreateAddress(address) {
  return {
    type: REQUEST_CREATE_ADDRESS
    , address
  }
}

export const RECEIVE_CREATE_ADDRESS = "RECEIVE_CREATE_ADDRESS";
function receiveCreateAddress(json) {
  return {
    type: RECEIVE_CREATE_ADDRESS
    , id: json.address ? json.address._id : null
    , item: json.address
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function sendCreateAddress(data) {
  return dispatch => {
    dispatch(requestCreateAddress(data))
    return apiUtils.callAPI('/api/addresses', 'POST', data)
      .then(json => dispatch(receiveCreateAddress(json)))
  }
}

export const REQUEST_UPDATE_ADDRESS = "REQUEST_UPDATE_ADDRESS";
function requestUpdateAddress(address) {
  return {
    id: address ? address._id : null
    , address
    , type: REQUEST_UPDATE_ADDRESS
  }
}

export const RECEIVE_UPDATE_ADDRESS = "RECEIVE_UPDATE_ADDRESS";
function receiveUpdateAddress(json) {
  return {
    type: RECEIVE_UPDATE_ADDRESS
    , id: json.address ? json.address._id : null
    , item: json.address
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function sendUpdateAddress(data) {
  return dispatch => {
    dispatch(requestUpdateAddress(data))
    return apiUtils.callAPI(`/api/addresses/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateAddress(json)))
  }
}

export const REQUEST_DELETE_ADDRESS = "REQUEST_DELETE_ADDRESS";
function requestDeleteAddress(id) {
  return {
    type: REQUEST_DELETE_ADDRESS
    , id
  }
}

export const RECEIVE_DELETE_ADDRESS = "RECEIVE_DELETE_ADDRESS";
function receiveDeleteAddress(id, json) {
  return {
    id
    , error: json.message
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_ADDRESS
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteAddress(id))
    return apiUtils.callAPI(`/api/addresses/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteAddress(id, json)))
  }
}


/**
 * ADDRESS LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest addressLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.address.lists, {});
  let list = { ...state.address.lists }
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
    return dispatch(returnAddressListPromise(...listArgs));
  }
}

export const returnAddressListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItems = listItemIds.map(id => state.address.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_ADDRESS_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_ADDRESS_LIST = "REQUEST_ADDRESS_LIST"
function requestAddressList(listArgs) {
  return {
    type: REQUEST_ADDRESS_LIST
    , listArgs
  }
}

export const RECEIVE_ADDRESS_LIST = "RECEIVE_ADDRESS_LIST"
function receiveAddressList(json, listArgs) {
  return {
    type: RECEIVE_ADDRESS_LIST
    , listArgs
    , list: json.addresses
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export const ADD_ADDRESS_TO_LIST = "ADD_ADDRESS_TO_LIST";
export function addAddressToList(id, ...listArgs) {
  // console.log("Add address to list", id);
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: ADD_ADDRESS_TO_LIST
    , id
    , listArgs
  }
}

export const REMOVE_ADDRESS_FROM_LIST = "REMOVE_ADDRESS_FROM_LIST"
export function removeAddressFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_ADDRESS_FROM_LIST
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
    dispatch(requestAddressList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/addresses/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/addresses/by-[ARG1]/[ARG2]".
     *    ex: /api/addresses/by-category/:category
     *  if 2nd arg is an array, though, return "/api/addresses/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/addresses";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of addresses given an array of address id's, among other things
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
      json => dispatch(receiveAddressList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_ADDRESS_FILTER = "SET_ADDRESS_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET_ADDRESS_FILTER
    , filter
    , listArgs
  }
}

export const SET_ADDRESS_PAGINATION = "SET_ADDRESS_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET_ADDRESS_PAGINATION
    , pagination
    , listArgs
  }
}

export const INVALIDATE_ADDRESS_LIST = "INVALIDATE_ADDRESS_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: INVALIDATE_ADDRESS_LIST
    , listArgs
  }
}

export function addAddressList(addresses, listArgs) {
  return {
    type: RECEIVE_ADDRESS_LIST
    , listArgs
    , list: addresses
    , success: true
    , error: null
    , receivedAt: Date.now()
  }
}

export const fetchListByClientIdsIfNeeded = (listArgs, clientIds) => (dispatch, getState) => {
  if(shouldFetchList(getState(), listArgs)) {
    dispatch(requestAddressList(listArgs))
    return apiUtils.callAPI('/api/addresses/list-by-client-ids', 'POST', { clientIds })
        .then(json => dispatch(receiveAddressList(json, listArgs)));
  } else {
    return dispatch(returnAddressListPromise(...listArgs));
  }
}

export const fetchListByIdsIfNeeded = (listArgs, ids) => (dispatch, getState) => {
  if(shouldFetchList(getState(), listArgs)) {
    dispatch(requestAddressList(listArgs))
    return apiUtils.callAPI('/api/addresses/list-by-ids', 'POST', { ids })
        .then(json => dispatch(receiveAddressList(json, listArgs)));
  } else {
    return dispatch(returnAddressListPromise(...listArgs));
  }
}
