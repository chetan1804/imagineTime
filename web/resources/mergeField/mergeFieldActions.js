/**
 * All mergeField CRUD actions
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
  const { byId, selected } = state.mergeField;
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

export const INVALIDATE_SELECTED_MERGE_FIELD = "INVALIDATE_SELECTED_MERGE_FIELD"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_MERGE_FIELD
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleMergeFieldById(id))
  } else {
    return dispatch(returnSingleMergeFieldPromise(id)); // return promise that contains mergeField
  }
}


export const returnSingleMergeFieldPromise = (id) => (dispatch, getState) => {
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
      , item: getState().mergeField.byId[id]
      , success: true
      , type: "RETURN_SINGLE_MERGE_FIELD_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SINGLE_MERGE_FIELD = "REQUEST_SINGLE_MERGE_FIELD";
function requestSingleMergeField(id) {
  return {
    id
    , type: REQUEST_SINGLE_MERGE_FIELD
  }
}

export const RECEIVE_SINGLE_MERGE_FIELD = "RECEIVE_SINGLE_MERGE_FIELD";
function receiveSingleMergeField(json) {
  return {
    error: json.message
    , id: json.mergeField ? json.mergeField._id : null
    , item: json.mergeField
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_MERGE_FIELD
  }
}

export function fetchSingleMergeFieldById(id) {
  return dispatch => {
    dispatch(requestSingleMergeField(id))
    return apiUtils.callAPI(`/api/merge-fields/${id}`)
      .then(json => dispatch(receiveSingleMergeField(json)))
  }
}

export const ADD_SINGLE_MERGE_FIELD_TO_MAP = "ADD_SINGLE_MERGE_FIELD_TO_MAP";
export function addSingleMergeFieldToMap(item) {
  return {
    item
    , type: ADD_SINGLE_MERGE_FIELD_TO_MAP
  }
}

export const SET_SELECTED_MERGE_FIELD = "SET_SELECTED_MERGE_FIELD";
export function setSelectedMergeField(item) {
  return {
    type: SET_SELECTED_MERGE_FIELD
    , item
  }
}

export const REQUEST_DEFAULT_MERGE_FIELD = "REQUEST_DEFAULT_MERGE_FIELD";
function requestDefaultMergeField(id) {
  return {
    type: REQUEST_DEFAULT_MERGE_FIELD
  }
}

export const RECEIVE_DEFAULT_MERGE_FIELD = "RECEIVE_DEFAULT_MERGE_FIELD";
function receiveDefaultMergeField(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_MERGE_FIELD
  }
}

export function fetchDefaultMergeField() {
  return dispatch => {
    dispatch(requestDefaultMergeField())
    return apiUtils.callAPI(`/api/merge-fields/default`)
      .then(json => dispatch(receiveDefaultMergeField(json)))
  }
}

export const REQUEST_MERGE_FIELD_SCHEMA = "REQUEST_MERGE_FIELD_SCHEMA";
function requestMergeFieldSchema(id) {
  return {
    type: REQUEST_MERGE_FIELD_SCHEMA
  }
}
 export const RECEIVE_MERGE_FIELD_SCHEMA = "RECEIVE_MERGE_FIELD_SCHEMA";
function receiveMergeFieldSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_MERGE_FIELD_SCHEMA
  }
}
 export function fetchMergeFieldSchema() {
  return dispatch => {
    dispatch(requestMergeFieldSchema())
    return apiUtils.callAPI(`/api/merge-fields/schema`)
      .then(json => dispatch(receiveMergeFieldSchema(json)))
  }
}

export const REQUEST_CREATE_MERGE_FIELD = "REQUEST_CREATE_MERGE_FIELD";
function requestCreateMergeField(mergeField) {
  return {
    mergeField
    , type: REQUEST_CREATE_MERGE_FIELD
  }
}

export const RECEIVE_CREATE_MERGE_FIELD = "RECEIVE_CREATE_MERGE_FIELD";
function receiveCreateMergeField(json) {
  return {
    error: json.message
    , id: json.mergeField ? json.mergeField._id : null
    , item: json.mergeField
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_MERGE_FIELD
  }
}

export function sendCreateMergeField(data) {
  return dispatch => {
    dispatch(requestCreateMergeField(data))
    return apiUtils.callAPI('/api/merge-fields', 'POST', data)
      .then(json => dispatch(receiveCreateMergeField(json)))
  }
}

export const REQUEST_UPDATE_MERGE_FIELD = "REQUEST_UPDATE_MERGE_FIELD";
function requestUpdateMergeField(mergeField) {
  return {
    id: mergeField ? mergeField._id: null
    , mergeField
    , type: REQUEST_UPDATE_MERGE_FIELD
  }
}

export const RECEIVE_UPDATE_MERGE_FIELD = "RECEIVE_UPDATE_MERGE_FIELD";
function receiveUpdateMergeField(json) {
  return {
    error: json.message
    , id: json.mergeField ? json.mergeField._id : null
    , item: json.mergeField
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_MERGE_FIELD
  }
}

export function sendUpdateMergeField(data) {
  return dispatch => {
    dispatch(requestUpdateMergeField(data))
    return apiUtils.callAPI(`/api/merge-fields/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateMergeField(json)))
  }
}

export const REQUEST_DELETE_MERGE_FIELD = "REQUEST_DELETE_MERGE_FIELD";
function requestDeleteMergeField(id) {
  return {
    id
    , type: REQUEST_DELETE_MERGE_FIELD
  }
}

export const RECEIVE_DELETE_MERGE_FIELD = "RECEIVE_DELETE_MERGE_FIELD";
function receiveDeleteMergeField(id, json) {
  return {
    error: json.message
    , id
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_MERGE_FIELD
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteMergeField(id))
    return apiUtils.callAPI(`/api/merge-fields/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteMergeField(id, json)))
  }
}


/**
 * LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest mergeFieldLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.mergeField.lists, {});
  let list = { ...state.mergeField.lists }
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
    return dispatch(returnMergeFieldListPromise(...listArgs));
  }
}

export const returnMergeFieldListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItems = listItemIds.map(id => state.mergeField.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_MERGE_FIELD_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_MERGE_FIELD_LIST = "REQUEST_MERGE_FIELD_LIST"
function requestMergeFieldList(listArgs) {
  return {
    listArgs
    , type: REQUEST_MERGE_FIELD_LIST
  }
}

export const RECEIVE_MERGE_FIELD_LIST = "RECEIVE_MERGE_FIELD_LIST"
function receiveMergeFieldList(json, listArgs) {
  return {
    error: json.message
    , list: json.mergeFields
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_MERGE_FIELD_LIST
  }
}

export const ADD_MERGE_FIELD_TO_LIST = "ADD_MERGE_FIELD_TO_LIST";
export function addMergeFieldToList(item, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  // allow user to either send the entire object or just the _id
  if(typeof(item) === 'string' || typeof(item) === 'number') {
    return {
      type: ADD_MERGE_FIELD_TO_LIST
      , id: item
      , listArgs
    }
  } else {
    return {
      type: ADD_MERGE_FIELD_TO_LIST
      , id: item._id
      , listArgs
    }
  }
}

export const REMOVE_MERGE_FIELD_FROM_LIST = "REMOVE_MERGE_FIELD_FROM_LIST"
export function removeMergeFieldFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_MERGE_FIELD_FROM_LIST
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
    dispatch(requestMergeFieldList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/merge-fields/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/merge-fields/by-[ARG1]/[ARG2]".
     *    ex: /api/merge-fields/by-category/:category
     *  if 2nd arg is an array, though, return "/api/merge-fields/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/merge-fields";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of mergeFields given an array of mergeField id's, among other things
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
      json => dispatch(receiveMergeFieldList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_MERGE_FIELD_FILTER = "SET_MERGE_FIELD_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_MERGE_FIELD_FILTER
  }
}

export const SET_MERGE_FIELD_PAGINATION = "SET_MERGE_FIELD_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_MERGE_FIELD_PAGINATION
  }
}

export const INVALIDATE_MERGE_FIELD_LIST = "INVALIDATE_MERGE_FIELD_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , type: INVALIDATE_MERGE_FIELD_LIST
  }
}

export const SET_MERGE_FIELD_QUERY = "SET_MERGE_FIELD_QUERY"
export function setQuery(query, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET_MERGE_FIELD_QUERY
    , query
    , listArgs
  }
}