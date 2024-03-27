/**
 * All folderPermission CRUD actions
 *
 * Actions are payloads of information that send data from the application
 * (i.e. Yote server) to the store. They are the _only_ source of information
 * for the store.
 *
 * FOLDER_PERMISSION: In Yote, we try to keep actions and reducers dealing with CRUD payloads
 * in terms of 'item' or 'items'. This keeps the action payloads consistent and
 * aides various scoping issues with list management in the reducers.
 */

// import api utility
import apiUtils from '../../global/utils/api';

const shouldFetchSingle = (state, id) => {
  /**
   * This is helper method to determine whether we should fetch a new single
   * user object from the server, or if a valid one already exists in the store
   *
   * FOLDER_TEMPLATE: Uncomment console logs to help debugging
   */
  // console.log("shouldFetch single");
  const { byId, selected } = state.folderPermission;
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

export const INVALIDATE_SELECTED_FOLDER_PERMISSION = "INVALIDATE_SELECTED_FOLDER_PERMISSION"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_FOLDER_PERMISSION
  }
}

export const REQUEST_SINGLE_FOLDER_PERMISSION = "REQUEST_SINGLE_FOLDER_PERMISSION";
function requestSingleFolderPermission(id) {
  return {
    id
    , type: REQUEST_SINGLE_FOLDER_PERMISSION
  }
}

export const RECEIVE_SINGLE_FOLDER_PERMISSION = "RECEIVE_SINGLE_FOLDER_PERMISSION";
function receiveSingleFolderPermission(json) {
  return {
    error: json.message
    , id: json.permission ? json.permission._id : null
    , item: json.permission
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_FOLDER_PERMISSION
  }
}

export const REQUEST_FOLDER_PERMISSION_LIST = "REQUEST_FOLDER_PERMISSION_LIST"
function requestFolderPermissionList(listArgs) {
  return {
    listArgs
    , type: REQUEST_FOLDER_PERMISSION_LIST
  }
}

export const RECEIVE_FOLDER_PERMISSION_LIST = "RECEIVE_FOLDER_PERMISSION_LIST"
function receiveFolderPermissionList(json, listArgs) {
  return {
    error: json.message
    , list: json.folderPermissions
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_FOLDER_PERMISSION_LIST
  }
}

export function fetchList(...listArgs) {
  return dispatch => {
    if(listArgs.length === 0) {
      // default to "all" list if we don't pass any listArgs
      listArgs = ["all"];
    }
    dispatch(requestFolderPermissionList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * FOLDER_TEMPLATE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/folder-template/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/folder-template/by-[ARG1]/[ARG2]".
     *    ex: /api/folder-template/by-category/:category
     *  if 2nd arg is an array, though, return "/api/folder-template/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/folder-permission";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of folderTemplates given an array of folderTemplate id's, among other things
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
      json => dispatch(receiveFolderPermissionList(json, listArgs))
    )
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(requestSingleFolderPermission(id))
  } else {
    return dispatch(returnSingleFolderPermissionPromise(id)); // return promise that contains folderPermission
  }
}

export function fetchSingleFolderPermissionById(id) {
  return dispatch => {
    dispatch(requestSingleFolderPermission(id))
    return apiUtils.callAPI(`/api/permission/${id}`)
      .then(json => dispatch(receiveSingleFolderPermission(json)))
  }
}

export const returnSingleFolderPermissionPromise = (id) => (dispatch, getState) => {
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
      , item: getState().folderPermission.byId[id]
      , success: true
      , type: "RETURN_SINGLE_FOLDER_PERMISSION_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_CREATE_FOLDER_PERMISSION = "REQUEST_CREATE_PERMISSION";
function requestCreateFolderPermission(permission) {
  return {
    type: REQUEST_CREATE_FOLDER_PERMISSION
    , permission
  }
}

export const RECEIVE_CREATE_FOLDER_PERMISSION = "RECEIVE_CREATE_FOLDER_PERMISSION";
function receiveCreateFolderPermission(json) {
  return {
    error: json.message
    , id: json.permission ? json.permission._id : null
    , item: json.permission
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_FOLDER_PERMISSION
    , activity: json.activity
  }
}

export function sendCreateFolderPermission(data) {
  return dispatch => {
    dispatch(requestCreateFolderPermission(data))
    return apiUtils.callAPI('/api/folder-permission/create', 'POST', data)
      .then(json => dispatch(receiveCreateFolderPermission(json)))
  }
}

/**
 * LIST ACTIONS
 */

 const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest folderPermissionLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.folderPermission.lists, {});
  let list = { ...state.folderPermission.lists }
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
   * FOLDER_PERMISSION: Uncomment console logs to help debugging
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
  console.log('fetch folder permission list', listArgs);

  if(listArgs.length === 0) {
    // If no arguments passed, make the list we want "all"
    listArgs = ["all"];
  }
  if(shouldFetchList(getState(), listArgs)) {
    return dispatch(fetchList(...listArgs));
  } else {
    return dispatch(returnFolderPermissionListPromise(...listArgs));
  }
}

export const returnFolderPermissionListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItems = listItemIds.map(id => state.folderPermission.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_FOLDER_PERMISSION_LIST_WITHOUT_FETCHING"
    })
  });
}

