/**
 * All activity CRUD actions
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
  const { byId, selected } = state.activity;
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

export const INVALIDATE_SELECTED_ACTIVITY = "INVALIDATE_SELECTED_ACTIVITY"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_ACTIVITY
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleActivityById(id))
  } else {
    return dispatch(returnSingleActivityPromise(id)); // return promise that contains activity
  }
}


export const returnSingleActivityPromise = (id) => (dispatch, getState) => {
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
      , item: getState().activity.byId[id]
      , success: true
      , type: "RETURN_SINGLE_ACTIVITY_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SINGLE_ACTIVITY = "REQUEST_SINGLE_ACTIVITY";
function requestSingleActivity(id) {
  return {
    id
    , type: REQUEST_SINGLE_ACTIVITY
  }
}

export const RECEIVE_SINGLE_ACTIVITY = "RECEIVE_SINGLE_ACTIVITY";
function receiveSingleActivity(json) {
  return {
    error: json.message
    , id: json.activity ? json.activity._id : null
    , item: json.activity
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_ACTIVITY
  }
}

export function fetchSingleActivityById(id) {
  return dispatch => {
    dispatch(requestSingleActivity(id))
    return apiUtils.callAPI(`/api/activities/${id}`)
      .then(json => dispatch(receiveSingleActivity(json)))
  }
}

export const ADD_SINGLE_ACTIVITY_TO_MAP = "ADD_SINGLE_ACTIVITY_TO_MAP";
export function addSingleActivityToMap(item) {
  return {
    item
    , type: ADD_SINGLE_ACTIVITY_TO_MAP
  }
}

export const SET_SELECTED_ACTIVITY = "SET_SELECTED_ACTIVITY";
export function setSelectedActivity(item) {
  return {
    type: SET_SELECTED_ACTIVITY
    , item
  }
}

export const REQUEST_DEFAULT_ACTIVITY = "REQUEST_DEFAULT_ACTIVITY";
function requestDefaultActivity(id) {
  return {
    type: REQUEST_DEFAULT_ACTIVITY
  }
}

export const RECEIVE_DEFAULT_ACTIVITY = "RECEIVE_DEFAULT_ACTIVITY";
function receiveDefaultActivity(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_ACTIVITY
  }
}

export function fetchDefaultActivity() {
  return dispatch => {
    dispatch(requestDefaultActivity())
    return apiUtils.callAPI(`/api/activities/default`)
      .then(json => dispatch(receiveDefaultActivity(json)))
  }
}

export const REQUEST_ACTIVITY_SCHEMA = "REQUEST_ACTIVITY_SCHEMA";
function requestActivitySchema(id) {
  return {
    type: REQUEST_ACTIVITY_SCHEMA
  }
}
 export const RECEIVE_ACTIVITY_SCHEMA = "RECEIVE_ACTIVITY_SCHEMA";
function receiveActivitySchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_ACTIVITY_SCHEMA
  }
}
 export function fetchActivitySchema() {
  return dispatch => {
    dispatch(requestActivitySchema())
    return apiUtils.callAPI(`/api/activities/schema`)
      .then(json => dispatch(receiveActivitySchema(json)))
  }
}

export const REQUEST_CREATE_ACTIVITY = "REQUEST_CREATE_ACTIVITY";
function requestCreateActivity(activity) {
  return {
    activity
    , type: REQUEST_CREATE_ACTIVITY
  }
}

export const RECEIVE_CREATE_ACTIVITY = "RECEIVE_CREATE_ACTIVITY";
function receiveCreateActivity(json) {
  return {
    error: json.message
    , id: json.activity ? json.activity._id : null
    , item: json.activity
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_ACTIVITY
  }
}

export function sendCreateActivity(data) {
  return dispatch => {
    dispatch(requestCreateActivity(data))
    return apiUtils.callAPI('/api/activities', 'POST', data)
      .then(json => dispatch(receiveCreateActivity(json)))
  }
}

export function sendCreateActivityOnClientFileUpload(data) {
  return dispatch => {
    dispatch(requestCreateActivity(data))
    return apiUtils.callAPI('/api/activities/client-file-upload', 'POST', data)
      .then(json => dispatch(receiveCreateActivity(json)))
  }
}

export function sendCreateActivityOnStaffFileUpload(data) {
  return dispatch => {
    dispatch(requestCreateActivity(data))
    return apiUtils.callAPI('/api/activities/staff-file-upload', 'POST', data)
      .then(json => dispatch(receiveCreateActivity(json)))
  }
}

export const REQUEST_UPDATE_ACTIVITY = "REQUEST_UPDATE_ACTIVITY";
function requestUpdateActivity(activity) {
  return {
    id: activity ? activity._id: null
    , activity
    , type: REQUEST_UPDATE_ACTIVITY
  }
}

export const RECEIVE_UPDATE_ACTIVITY = "RECEIVE_UPDATE_ACTIVITY";
function receiveUpdateActivity(json) {
  return {
    error: json.message
    , id: json.activity ? json.activity._id : null
    , item: json.activity
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_ACTIVITY
  }
}

export function sendUpdateActivity(data) {
  return dispatch => {
    dispatch(requestUpdateActivity(data))
    return apiUtils.callAPI(`/api/activities/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateActivity(json)))
  }
}

export const REQUEST_DELETE_ACTIVITY = "REQUEST_DELETE_ACTIVITY";
function requestDeleteActivity(id) {
  return {
    id
    , type: REQUEST_DELETE_ACTIVITY
  }
}

export const RECEIVE_DELETE_ACTIVITY = "RECEIVE_DELETE_ACTIVITY";
function receiveDeleteActivity(id, json) {
  return {
    error: json.message
    , id
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_ACTIVITY
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteActivity(id))
    return apiUtils.callAPI(`/api/activities/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteActivity(id, json)))
  }
}


/**
 * LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest activityLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.activity.lists, {});
  let list = { ...state.activity.lists }
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
    return dispatch(returnActivityListPromise(...listArgs));
  }
}

export const returnActivityListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItems = listItemIds.map(id => state.activity.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_ACTIVITY_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_ACTIVITY_LIST = "REQUEST_ACTIVITY_LIST"
function requestActivityList(listArgs) {
  return {
    listArgs
    , type: REQUEST_ACTIVITY_LIST
  }
}

export const RECEIVE_ACTIVITY_LIST = "RECEIVE_ACTIVITY_LIST"
function receiveActivityList(json, listArgs) {
  return {
    error: json.message
    , list: json.activities
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_ACTIVITY_LIST
  }
}

export const ADD_ACTIVITY_TO_LIST = "ADD_ACTIVITY_TO_LIST";
export function addActivityToList(item, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  // allow user to either send the entire object or just the _id
  if(typeof(item) === 'string' || typeof(item) === 'number') {
    return {
      type: ADD_ACTIVITY_TO_LIST
      , id: item
      , listArgs
    }
  } else {
    return {
      type: ADD_ACTIVITY_TO_LIST
      , id: item._id
      , listArgs
    }
  }
}

export const REMOVE_ACTIVITY_FROM_LIST = "REMOVE_ACTIVITY_FROM_LIST"
export function removeActivityFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_ACTIVITY_FROM_LIST
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
    dispatch(requestActivityList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/activities/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/activities/by-[ARG1]/[ARG2]".
     *    ex: /api/activities/by-category/:category
     *  if 2nd arg is an array, though, return "/api/activities/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/activities";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of activities given an array of activity id's, among other things
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
      json => dispatch(receiveActivityList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_ACTIVITY_FILTER = "SET_ACTIVITY_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_ACTIVITY_FILTER
  }
}

export const SET_ACTIVITY_PAGINATION = "SET_ACTIVITY_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_ACTIVITY_PAGINATION
  }
}

export const INVALIDATE_ACTIVITY_LIST = "INVALIDATE_ACTIVITY_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , type: INVALIDATE_ACTIVITY_LIST
  }
}

export function sendViewRequestSignature(data) {
  return dispatch => {
    // dispatch(requestCreateActivity(data))
    return apiUtils.callAPI(`/api/activities/viewed-request-signature/${data.quickTaskId}`, 'POST', data)
      .then(json => console.log("json", json))
  }
}
