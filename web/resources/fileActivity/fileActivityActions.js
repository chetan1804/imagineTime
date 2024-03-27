/**
 * All filActivity CRUD actions
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
  const { byId, selected } = state.fileActivity;
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

export const INVALIDATE_SELECTED_FILE_ACTIVITY = "INVALIDATE_SELECTED_FILE_ACTIVITY"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_FILE_ACTIVITY
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleFileActivityById(id))
  } else {
    return dispatch(returnSingleFileActivityPromise(id)); // return promise that contains fileActivity
  }
}


export const returnSingleFileActivityPromise = (id) => (dispatch, getState) => {
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
      , item: getState().fileActivity.byId[id]
      , success: true
      , type: "RETURN_SINGLE_FILE_ACTIVITY_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SINGLE_FILE_ACTIVITY = "REQUEST_SINGLE_FILE_ACTIVITY";
function requestSingleFileActivity(id) {
  return {
    id
    , type: REQUEST_SINGLE_FILE_ACTIVITY
  }
}

export const RECEIVE_SINGLE_FILE_ACTIVITY = "RECEIVE_SINGLE_FILE_ACTIVITY";
function receiveSingleFileActivity(json) {
  return {
    error: json.message
    , id: json.fileActivity ? json.fileActivity._id : null
    , item: json.fileActivity
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_FILE_ACTIVITY
  }
}

export function fetchSingleFileActivityById(id) {
  return dispatch => {
    dispatch(requestSingleFileActivity(id))
    return apiUtils.callAPI(`/api/file-activity/${id}`)
      .then(json => dispatch(receiveSingleFileActivity(json)))
  }
}

export const ADD_SINGLE_FILE_ACTIVITY_TO_MAP = "ADD_SINGLE_FILE_ACTIVITY_TO_MAP";
export function addSingleFileActivityToMap(item) {
  return {
    item
    , type: ADD_SINGLE_FILE_ACTIVITY_TO_MAP
  }
}

export const SET_SELECTED_FILE_ACTIVITY = "SET_SELECTED_FILE_ACTIVITY";
export function setSelectedFileActivity(item) {
  return {
    type: SET_SELECTED_FILE_ACTIVITY
    , item
  }
}

export const REQUEST_DEFAULT_FILE_ACTIVITY = "REQUEST_DEFAULT_FILE_ACTIVITY";
function requestDefaultFileActivity(id) {
  return {
    type: REQUEST_DEFAULT_FILE_ACTIVITY
  }
}

export const RECEIVE_DEFAULT_FILE_ACTIVITY = "RECEIVE_DEFAULT_FILE_ACTIVITY";
function receiveDefaultFileActivity(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_FILE_ACTIVITY
  }
}

export function fetchDefaultFileActivity() {
  return dispatch => {
    dispatch(requestDefaultFileActivity())
    return apiUtils.callAPI(`/api/file-activity/default`)
      .then(json => dispatch(receiveDefaultFileActivity(json)))
  }
}

export const REQUEST_FILE_ACTIVITY_SCHEMA = "REQUEST_FILE_ACTIVITY_SCHEMA";
function requestFileActivitySchema(id) {
  return {
    type: REQUEST_FILE_ACTIVITY_SCHEMA
  }
}
 export const RECEIVE_FILE_ACTIVITY_SCHEMA = "RECEIVE_FILE_ACTIVITY_SCHEMA";
function receiveFileActivitySchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_FILE_ACTIVITY_SCHEMA
  }
}
 export function fetchFileActivitySchema() {
  return dispatch => {
    dispatch(requestFileActivitySchema())
    return apiUtils.callAPI(`/api/file-activity/schema`)
      .then(json => dispatch(receiveFileActivitySchema(json)))
  }
}

export const REQUEST_CREATE_FILE_ACTIVITY = "REQUEST_CREATE_FILE_ACTIVITY";
function requestCreateFileActivity(fileActivity) {
  return {
    fileActivity
    , type: REQUEST_CREATE_FILE_ACTIVITY
  }
}

export const RECEIVE_CREATE_FILE_ACTIVITY = "RECEIVE_CREATE_FILE_ACTIVITY";
function receiveCreateFileActivity(json) {
  return {
    error: json.message
    , id: json.fileActivity ? json.fileActivity._id : null
    , item: json.fileActivity
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_FILE_ACTIVITY
  }
}

export function sendCreateFileActivity(data) {
  return dispatch => {
    dispatch(requestCreateFileActivity(data))
    return apiUtils.callAPI('/api/file-activity', 'POST', data)
      .then(json => dispatch(receiveCreateFileActivity(json)))
  }
}

export const REQUEST_UPDATE_FILE_ACTIVITY = "REQUEST_UPDATE_FILE_ACTIVITY";
function requestUpdateFileActivity(fileActivity) {
  return {
    id: fileActivity ? fileActivity._id: null
    , fileActivity
    , type: REQUEST_UPDATE_FILE_ACTIVITY
  }
}

export const RECEIVE_UPDATE_FILE_ACTIVITY = "RECEIVE_UPDATE_FILE_ACTIVITY";
function receiveUpdateFileActivity(json) {
  return {
    error: json.message
    , id: json.fileActivity ? json.fileActivity._id : null
    , item: json.fileActivity
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_FILE_ACTIVITY
  }
}

export function sendUpdateFileActivity(data) {
  return dispatch => {
    dispatch(requestUpdateFileActivity(data))
    return apiUtils.callAPI(`/api/file-activity/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateFileActivity(json)))
  }
}

export const REQUEST_DELETE_FILE_ACTIVITY = "REQUEST_DELETE_FILE_ACTIVITY";
function requestDeleteFileActivity(id) {
  return {
    id
    , type: REQUEST_DELETE_FILE_ACTIVITY
  }
}

export const RECEIVE_DELETE_FILE_ACTIVITY = "RECEIVE_DELETE_FILE_ACTIVITY";
function receiveDeleteFileActivity(id, json) {
  return {
    error: json.message
    , id
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_FILE_ACTIVITY
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteFileActivity(id))
    return apiUtils.callAPI(`/api/file-activity/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteFileActivity(id, json)))
  }
}


/**
 * LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest fileActivityLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.fileActivity.lists, {});
  let list = { ...state.fileActivity.lists }
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
  console.log("shouldFetchList with these args ", state, "?");
  console.log("shouldFetchList with these args ", listArgs, "?");
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
    return dispatch(returnFileActivityListPromise(...listArgs));
  }
}

export const returnFileActivityListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItems = listItemIds.map(id => state.fileActivity.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_FILE_ACTIVITY_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_FILE_ACTIVITY_LIST = "REQUEST_FILE_ACTIVITY_LIST"
function requestFileActivityList(listArgs) {
  return {
    listArgs
    , type: REQUEST_FILE_ACTIVITY_LIST
  }
}

export const RECEIVE_FILE_ACTIVITY_LIST = "RECEIVE_FILE_ACTIVITY_LIST"
function receiveFileActivityList(json, listArgs) {
  return {
    error: json.message
    , list: json.data
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_FILE_ACTIVITY_LIST
  }
}

export const ADD_FILE_ACTIVITY_TO_LIST = "ADD_FILE_ACTIVITY_TO_LIST";
export function addFileActivityToList(item, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  // allow user to either send the entire object or just the _id
  if(typeof(item) === 'string' || typeof(item) === 'number') {
    return {
      type: ADD_FILE_ACTIVITY_TO_LIST
      , id: item
      , listArgs
    }
  } else {
    return {
      type: ADD_FILE_ACTIVITY_TO_LIST
      , id: item._id
      , listArgs
    }
  }
}

export const REMOVE_FILE_ACTIVITY_FROM_LIST = "REMOVE_FILE_ACTIVITY_FROM_LIST"
export function removeFileActivityFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_FILE_ACTIVITY_FROM_LIST
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
    dispatch(requestFileActivityList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/file-activity/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/file-activity/by-[ARG1]/[ARG2]".
     *    ex: /api/file-activity/by-category/:category
     *  if 2nd arg is an array, though, return "/api/file-activity/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/file-activity";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of fileActivitys given an array of fileActivity id's, among other things
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
      json => dispatch(receiveFileActivityList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_FILE_ACTIVITY_FILTER = "SET_FILE_ACTIVITY_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_FILE_ACTIVITY_FILTER
  }
}

export const SET_FILE_ACTIVITY_PAGINATION = "SET_FILE_ACTIVITY_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_FILE_ACTIVITY_PAGINATION
  }
}

export const INVALIDATE_FILE_ACTIVITY_LIST = "INVALIDATE_FILE_ACTIVITY_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , type: INVALIDATE_FILE_ACTIVITY_LIST
  }
}


export const fetchNewFileActivityList = (json, listArgs) => (dispatch, getState) => {
  const state = getState();
  const listItemIds = findListFromArgs(state, listArgs).items;
  let listItems = listItemIds ? listItemIds.map(id => state.fileActivity.byId[id]) : [];
  
  if (listItems && json.fileActivity) {
    listItems.unshift(json.fileActivity);
    const data = {
      data: listItems
      , success: json.success
    }
    dispatch(receiveFileActivityList(data, listArgs));
  }
}


/**
 * FileActivityList screen related actions that are dispatched for reducers to
 * store information in application-level (redux) store.
 *
 * For FileActivityList screen, the only things we want to persist in the
 * application store are last filter and its pagination information i.e. rows
 * per page and current pag number.
 */

 export const SET_FILEACTIVITY_FILTER = "SET_FILEACTIVITY_FILTER"
 export function setFileActivityFilter(filterNames, filter, filterData) {
   return {
     filterNames
     , filter
     , filterData
     , type: SET_FILEACTIVITY_FILTER
   }
 }

export const SET_FILEACTIVITY_DISPLAY_COLUMNS = "SET_FILEACTIVITY_DISPLAY_COLUMNS"
export function setFileActivityDisplayolumns(displayColumns) {
  return {
    displayColumns
    , type: SET_FILEACTIVITY_DISPLAY_COLUMNS
  }
}
