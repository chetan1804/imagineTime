/**
 * Build the File store
 *
 * Follows best practices from Redux documentation:
 *   - Single source of truth
 *   - State/Store is read-only
 *   - Changes are made with pure functions
 *
 * See http://redux.js.org/docs/recipes/StructuringReducers.html for specific
 * docs on structuring reducers
 *
 * NOTE: In Yote, we try to keep actions and reducers dealing with CRUD payloads
 * in terms of 'item' or 'items'. This keeps the action payloads consistent and
 * aides various scoping issues with list management in the reducers.
 */

// import file actions
import * as Actions from './fileActions';
import apiUtils from '../../global/utils/api';

import * as ClientActions from '../client/clientActions';
import * as FirmActions from '../firm/firmActions';

/**
 * fileList reducer -
 *
 * Accepts arbitrary list arguments and recursively builds nested list as needed
 *
 * NOTE: this is never called directly. Only by parent 'file' reducer (defined
 * below) when dealing with a LIST action
 */
function fileList(state = {
  /**
   * The "items" object defines the default state for a list
   *
   * NOTE: This is for reference only. The list is not actually initialized here.
   * The actual init happens the first time REQUEST_LIST is called.
   */
  didInvalidate: false
  , error: null
  , filter: {}
  , isFetching: false
  , items: [] // array of _id's
  , lastUpdated: null
  , pagination: {}
  , query: ''
}, action) {
  // console.log("DEBUG", state, action.listArgs);
  let nextAction = JSON.parse(JSON.stringify(action)); // Only change copy. NOT the  original object
  nextAction.listArgs.shift();

  /**
   * Check for nested list --
   * If the action is asking for a nested state, like lists[workout][123ABC],
   * then recursively return an _additional_ fileList reducer.
   *
   * Otherwise, return the actual file lists' store
   */
  if(nextAction.listArgs.length > 0) {
    /**
     * The action is asking for a nested state, like lists[workout][123ABC].
     * Let's nest it by returning an additional fileList reducer and trying again.
     */
    return {
      ...state
      , [nextAction.listArgs[0]]: fileList(state[nextAction.listArgs[0]] || {}, nextAction)
    }
  } else {
    /**
     * Stop nesting. Instead listen for the actions and respond accordingly.
     */
    switch(action.type) {
      case Actions.INVALIDATE_FILE_LIST: {
        return {
          ...state
          , didInvalidate: true
        }
      }
      case Actions.REQUEST_TOTAL_BY_CLIENTIDS: {
        return {
          ...state
          , error: null
          , filter: state.filter || {}
          , isFetching: true
          , items: [] // array of _id's
          , lastUpdated: null
          , pagination: state.pagination || {}
        }
      }
      case Actions.REQUEST_FILE_LIST: {
        return {
          ...state
          , error: null
          , filter: state.filter || {}
          , isFetching: true
          , items: [] // array of _id's
          , lastUpdated: null
          , pagination: state.pagination || {}
        }
      }
      case Actions.RECEIVE_TOTAL_BY_CLIENTIDS: {
        if(!action.success) {
          return {
            ...state
            , error: action.error
            , isFetching: false
            , items: [] // array of _id's
            , lastUpdated: action.receivedAt
          }
        } else {
          return {
            ...state
            , didInvalidate: false
            , error: action.error || null
            , isFetching: false
            , items: action.items
            , lastUpdated: action.receivedAt
          }
        }
      }
      case Actions.RECEIVE_FILE_LIST: {
        if(!action.success) {
          return {
            ...state
            , error: action.error
            , isFetching: false
            , items: [] // array of _id's
            , lastUpdated: action.receivedAt
          }
        } else {
          let idArray = [];
          for(const item of action.list) {
            idArray.push(item._id);
          }
          return {
            ...state
            , didInvalidate: false
            , error: action.error || null
            , isFetching: false
            , items: idArray
            , lastUpdated: action.receivedAt
            , totalFiles: action.totalFiles
            , objClientNotes: action.objClientNotes
          }
        }
      }
      case ClientActions.RECEIVE_CLIENT_LIST: {
        if(!action.files) {
          return {
            ...state
          }
        } else if(!action.success) {
          return {
            ...state
            , items: [] // array of _id's
            , isFetching: false
            , error: action.error
            , lastUpdated: action.receivedAt
          }
        } else {
          let idArray = [];
          for(const item of action.files) {
            idArray.push(item._id);
          }
          return {
            ...state
            , items: idArray
            , isFetching: false
            , error: action.error || null
            , didInvalidate: false
            , lastUpdated: action.receivedAt
          }
        }
      }
      case FirmActions.RECEIVE_FIRM_LIST: {
        if(!action.files) {
          return {
            ...state
          }
        } else if(!action.success) {
          return {
            ...state
            , items: [] // array of _id's
            , isFetching: false
            , error: action.error
            , lastUpdated: action.receivedAt
          }
        } else {
          let idArray = [];
          for(const item of action.files) {
            idArray.push(item._id);
          }
          return {
            ...state
            , items: idArray
            , isFetching: false
            , error: action.error || null
            , didInvalidate: false
            , lastUpdated: action.receivedAt
          }
        }
      }
      case Actions.ADD_FILE_TO_LIST: {
        let idArray = [];
        if(state && state.items) {
          idArray = [...state.items];
        }
        idArray.indexOf(action.id) === -1 ? idArray.push(action.id) : console.log("Item is already in list");
        return {
          ...state
          , items: idArray
          , isFetching: false
          , error: action.error || null
          , didInvalidate: false
          , lastUpdated: action.recievedAt
        }
      }

      case Actions.ADD_FILES_TO_LIST: {
        let idArray = [];
        if(state && state.items) {
          idArray = [...state.items];
        }
        // combines unique elements of two arrays 
        let items = [...new Set([...idArray, ...action.ids])]
        return {
          ...state
          , items
          , isFetching: false
          , error: action.error || null
          , didInvalidate: false
          , lastUpdated: action.recievedAt
        }
      }

      case Actions.REMOVE_FILE_FROM_LIST: {
        let idArray = [...state.items]
        let index = idArray.indexOf(action.id);
        if(index != -1) {
          idArray.splice(index, 1);
        } else {
          console.log("item not in list");
        }
        return {
          ...state
          , items: idArray
          , isFetching: false
          , error: action.error || null
          , didInvalidate: false
          , lastUpdated: action.receivedAt
        }
      }

      case Actions.SET_FILE_FILTER: {
        return {
          ...state
          , filter: action.filter
        }
      }
      case Actions.SET_FILE_QUERY: {
        return {
          ...state
          , query: action.query
        }
      }
      case Actions.SET_FILE_PAGINATION: {
        return {
          ...state
          , pagination: action.pagination
        }
      }
      default:
        return state;
    }
  }
}

/**
 * Primary file reducer -
 *
 * This is the single source of truth for all things 'file' related within the
 * application. The primary components of the reducer are defined in detail below.
 *
 * The basic idea is that the reducer listens for actions indicating a desired
 * state change and the reducer returns a new _copy_ of the state accordingly.
 */
function file(state = {

  /**
   * "byId" is an object map of all file items in the store. The map's keys are
   * the Mongo ids of the objects by default
   */
  byId: {}

  /**
   * "defaultItem" defines fields for a _new_ file
   * any component that creates a new file object should store a copy of this
   * in its state
   */
  , defaultItem: {
    error: null
    , getItemFromSchema: () => {
      return null
    }
    , obj: null
    , schema: null
    , lastUpdated: null
  }

  /**
   * "lists" corresponds to individual instances of the fileList reducer as
   * defined above.
   *
   * NOTE: when requesting a list, if args are undefined, the lists defaults to
   * lists['all']
   */
  , lists: {}

  /**
   * "selected" is a single _selected_ entity within the store
   *
   * For example, when changing the name of a file, the single file
   * being edited would be defined by "selected"
   */
  , selected: {
    didInvalidate: false
    , error: null
    , getItem: () => {
      return null
    }
    , id: null
    , isFetching: false
    , lastUpdated: null
  }

  /**
   * utility methods to pull things out of the list dynamically
   *
   * For example, when fetching a nested list of files by type and color you
   * would write something like:
   * let list = fileStore.util.getList('type', 'apparel', 'color', 'black')
   */
  , util: {
    getKeyArrayFromList: () => {
      return null
    }
    , getList: () => {
      return null
    }
    , getSelectedStore: () => {
      return {}
    }
    , getTotalByClientIds: () => {
      return null
    }
  }
}, action) {
  /**
   * Listen for the actions and respond accordingly.
   */
  let nextState;
  switch(action.type) {
    /**
     * DEFAULT FILE ACTIONS
     */
    case Actions.REQUEST_DEFAULT_FILE: {
      nextState = {
        ...state
        , defaultItem: {
          ...state.defaultItem
          , isFetching: true
        }
      }
      break;
    }
    case Actions.RECEIVE_DEFAULT_FILE: {
      if(action.success) {
        nextState = {
          ...state
          , defaultItem: {
            ...state.defaultItem
            , error: null
            , obj: action.defaultObj
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      } else {
        nextState = {
          ...state
          , defaultItem: {
            ...state.defaultItem
            , error: action.error
            , obj: null
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      }
      break;
    }
    case Actions.REQUEST_FILE_SCHEMA: {
      nextState = {
        ...state
        , defaultItem: {
          ...state.defaultItem
          , isFetching: true
        }
      }
      break;
    }
    case Actions.RECEIVE_FILE_SCHEMA: {
      if(action.success) {
        nextState = {
          ...state
          , defaultItem: {
            ...state.defaultItem
            , error: null
            , schema: action.schema
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      } else {
        nextState = {
          ...state
          , defaultItem: {
            ...state.defaultItem
            , error: action.error
            , schema: null
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      }
      break;
    }
    /**
     * SINGLE FILE ACTIONS
     */
    case Actions.REQUEST_SINGLE_FILE: {
      nextState = {
        ...state
        , selected: {
          error: null
          , id: action.id
          , isFetching: true
        }
      }
      break;
    }
    case Actions.RECEIVE_SINGLE_FILE: {
      if(action.success) {
        nextState = {
          ...state
          , byId: {
            ...state.byId
            , [action.id]: action.item
          }
          , selected: {
            didInvalidate: false
            , error: null
            , id: action.id
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      } else {
        nextState = {
          ...state
          , selected: {
            error: action.error
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      }
      break;
    }
    case Actions.ADD_SINGLE_FILE_TO_MAP: {
      // add this file to the map
      nextState = {
        ...state
        , byId: {
          ...state.byId
          , [action.item._id]: action.item
        }
      }
      break;
    }
    case Actions.SET_SELECTED_FILE: {
      // add this file to the map and set it as selected
      nextState = {
        ...state
        , byId: {
          ...state.byId
          , [action.item._id]: action.item
        }
        , selected: {
          id: action.item._id
          , isFetching: false
          , error: null
          , didInvalidate: false
          , lastUpdated: new Date()
        }
      }
      break;
    }
    case Actions.REQUEST_CREATE_FILES: {
      nextState = {
        ...state
        , selected: {
          error: null
          , id: null
          , isFetching: true
        }
      }
      break;
    }
    case Actions.RECEIVE_CREATE_FILES: {
      if(action.success) {
        let newIdMap = {...state.byId}; 
        action.files.forEach(file => newIdMap[file._id] = file)
        nextState = {
          ...state
          , byId: newIdMap
          , selected: {
            didInvalidate: false
            , error: null
            // , id: action.id
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      } else {
        nextState = {
          ...state
          , selected: {
            error: action.error
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      }
      break;
    }
    case Actions.REQUEST_UPDATE_FILE: {
      nextState = {
        ...state
        , selected: {
          error: null
          , id: action.id
          , isFetching: true
        }
      }
      break;
    }
    case Actions.RECEIVE_UPDATE_FILE: {
      if(action.success) {
        nextState = {
          ...state
          , byId: {
            ...state.byId
            , [action.id]: action.item
          }
          , selected: {
            didInvalidate: false
            , error: null
            , id: action.id
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      } else {
        nextState = {
          ...state
          , selected: {
            ...state.selected
            , error: action.error
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      }
      break;
    }
    case Actions.REQUEST_BULK_UPDATE_FILE_STATUS: {
      nextState = {
        ...state
        , selected: {
          error: null
          , isFetching: true
        }
      }
      break;
    }
    case Actions.REQUEST_BULK_DELETE_FILE: {
      nextState = {
        ...state
        , selected: {
          error: null
          , isFetching: true
        }
      }
      break;
    }
    case Actions.RECEIVE_BULK_UPDATE_FILE_STATUS: {

      // add items to "byId" before we forward to individual list reducer
      let newIdMap = { ...state.byId };
      if(action.success) {
        for(const item of action.list) {
          newIdMap[item._id] = item;
        }
      }

      if(action.success) {
        nextState = {
          ...state
          , byId: newIdMap
          , selected: {
            didInvalidate: false
            , error: null
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      } else {
        nextState = {
          ...state
          , selected: {
            error: action.error
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      }
      break;
    }
    case Actions.RECEIVE_BULK_DELETE_FILE: {

      // add items to "byId" before we forward to individual list reducer
      let newIdMap = { ...state.byId };
      if(action.success) {
        for(const item of action.list) {
          newIdMap[item._id] = item;
        }
      }

      if(action.success) {
        nextState = {
          ...state
          , byId: newIdMap
          , selected: {
            didInvalidate: false
            , error: null
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      } else {
        nextState = {
          ...state
          , selected: {
            error: action.error
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      }
      break;
    }
    case Actions.REQUEST_DELETE_FILE: {
      nextState = {
        ...state
        , selected: {
          error: null
          , id: action.id
          , isFetching: true
        }
      }
      break;
    }
    case Actions.RECEIVE_DELETE_FILE: {
      if(action.success) {
        // remove this object from map
        let newIdMap = { ...state.byId };
        delete newIdMap[action.id]; //remove key
        nextState = {
          ...state
          , byId: newIdMap
          , selected: {
            didInvalidate: false
            , error: null
            , id: null
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      } else {
        nextState = {
          ...state
          , selected: {
            error: action.error
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      }
      break;
    }
    case Actions.INVALIDATE_SELECTED_FILE: {
      nextState = {
        ...state
        , selected: {
          didInvalidate: true
        }
      }
      break;
    }

    /**
     * LIST ACTIONS
     */
    case Actions.INVALIDATE_FILE_LIST:
      if (action && action.listArgs && action.listArgs.length === 1 && action.listArgs[0] === 'all') {
        nextState = {
          ...state
          , lists: {}
        }
      } else {
        nextState = {
          ...state
          , lists: {
            ...state.lists
            , [action.listArgs[0]]: fileList(state.lists[action.listArgs[0]] || {}, action)
          }
        }
      }
      break;
    case Actions.REQUEST_TOTAL_BY_CLIENTIDS:
    case Actions.REQUEST_FILE_LIST:
    case Actions.SET_FILE_FILTER:
    case Actions.ADD_FILE_TO_LIST:
    case Actions.ADD_FILES_TO_LIST:
    case Actions.REMOVE_FILE_FROM_LIST:
    case Actions.SET_FILE_QUERY:
    case Actions.SET_FILE_PAGINATION: {
      nextState = {
        ...state
        , lists: {
          ...state.lists
          , [action.listArgs[0]]: fileList(state.lists[action.listArgs[0]] || {}, action)
        }
      }
      break;
    }
    case Actions.RECEIVE_TOTAL_BY_CLIENTIDS: {
      // add items to "byId" before we forward to individual list reducer
      let newIdMap = { ...state.byId };
      nextState = {
        ...state
        , byId: newIdMap
        , lists: {
          ...state.lists
          , [action.listArgs[0]]: fileList(state.lists[action.listArgs[0]], action)
        }
      }
      break;
    }
    case Actions.RECEIVE_FILE_LIST: {
      // add items to "byId" before we forward to individual list reducer
      let newIdMap = { ...state.byId };
      if(action.success) {
        for(const item of action.list) {
          delete item.olderVersions;
          let currentItem = newIdMap[item._id];
          newIdMap[item._id] = item;
          
          if (item && currentItem && currentItem.category != "folder" && !item.fileVersionCount) {
            newIdMap[item._id].fileVersionCount = currentItem.fileVersionCount;
          }

          if (item && currentItem && currentItem.category === "folder" && !item.totalChildFile) {
            newIdMap[item._id].totalChildFile = currentItem.totalChildFile;
          }

          if (item && currentItem && currentItem.category === "folder" && !item.totalChildFolder) {
            newIdMap[item._id].totalChildFolder = currentItem.totalChildFolder;
          }

        }
      }
      nextState = {
        ...state
        , byId: newIdMap
        , lists: {
          ...state.lists
          , [action.listArgs[0]]: fileList(state.lists[action.listArgs[0]], action)
        }
      }
      break;
    }
    case Actions.RECEIVE_FILE_LIST: {
      // add items to "byId" before we forward to individual list reducer
      let newIdMap = { ...state.byId };
      if(action.success) {
        for(const item of action.list) {
          newIdMap[item._id] = item;
        }
      }
      nextState = {
        ...state
        , byId: newIdMap
        , lists: {
          ...state.lists
          , [action.listArgs[0]]: fileList(state.lists[action.listArgs[0]], action)
        }
      }
      break;
    }
    case ClientActions.RECEIVE_CLIENT_LIST: {
      // add items to "byId" before we forward to individual list reducer
      let newIdMap = { ...state.byId };
      if(action.success && action.files) {
        for(const item of action.files) {
          newIdMap[item._id] = item;
        }
      }
      nextState = {
        ...state
        , byId: newIdMap
        , lists: {
          ...state.lists
          , [action.listArgs[0]]: fileList(state.lists[action.listArgs[0]], action)
        }
      }
      break;
    }

    case FirmActions.RECEIVE_FIRM_LIST: {
      // add items to "byId" before we forward to individual list reducer
      let newIdMap = { ...state.byId };
      if(action.success && action.files) {
        for(const item of action.files) {
          newIdMap[item._id] = item;
        }
      }
      nextState = {
        ...state
        , byId: newIdMap
        , lists: {
          ...state.lists
          , [action.listArgs[0]]: fileList(state.lists[action.listArgs[0]], action)
        }
      }
      break;
    }
    
    default: {
      nextState = state
      break;
    }
  }

  //set getter method for returning single selected item
  nextState.selected = {
    ...nextState.selected
    , getItem: () => {
      if(!nextState.selected.id || nextState.selected.didInvalidate) {
        return null
      } else {
        return nextState.byId[nextState.selected.id]
      }
    }
  }
  //set getter method for returning default item
  nextState.defaultItem = {
    ...nextState.defaultItem
    , getItemFromSchema: () => {
      if(!nextState.defaultItem.schema || nextState.selected.didInvalidate) {
        return null
      } else {
        return apiUtils.defaultFromSchema(nextState.defaultItem.schema)
      }
    }
  }
  nextState.util.getSelectedStore = (...listArgs) => {
    /**
     * utility method for a) determining if a list exists and b) getting those list objects
     * this can be used in the render function of a component to avoid having to
     * type: lists.player && lists.player.[id] && lists.player.[id].items
     * if list doesnt exist yet, it returns null, else returns array of objects
     * not meant to replace the map and individual list reducers, but to reduce
     * boiler plate and produce cleaner code in the front end components.
     */
    if(listArgs.length === 0) {
      // If no arguments passed, make the list we want "all"
      listArgs = ["all"];
    }
    let nextList = nextState.lists;
    for(var i = 0; i < listArgs.length; i++) {
      if(nextList[listArgs[i]]) {
        nextList = nextList[listArgs[i]];
      } else {
        nextList = null;
        break;
      }
    }
    if(!nextList || !nextList.items || nextList.didInvalidate) {
      return {}
    } else {
      if (nextList && nextList.hasOwnProperty('filter') && nextList.filter && !nextList.filter.hasOwnProperty('query')) {
        nextList.filter.query = '';
      }
      if (nextList && nextList.hasOwnProperty('filter') && nextList.filter && !nextList.filter.hasOwnProperty('sortBy')) {
        nextList.filter.sortBy = '-date';
      }
      if (nextList && nextList.hasOwnProperty('pagination') && nextList.pagination && !nextList.pagination.hasOwnProperty('per')) {
        nextList.pagination.per = 50;
      }
      if (nextList && nextList.hasOwnProperty('pagination') && nextList.pagination && !nextList.pagination.hasOwnProperty('page')) {
        nextList.pagination.page = 1;
      }
      if (nextList && !nextList.hasOwnProperty('query')) {
        nextList.query = '';
      }
      return nextList;
    }
  }
  nextState.util.getTotalByClientIds = (...listArgs) => {
    if(listArgs.length === 0) {
      // If no arguments passed, make the list we want "all"
      listArgs = ["all"];
    }
    let nextList = nextState.lists;
    for(var i = 0; i < listArgs.length; i++) {
      if(nextList[listArgs[i]]) {
        nextList = nextList[listArgs[i]];
      } else {
        nextList = null;
        break;
      }
    }
    if(!nextList || !nextList.items || nextList.didInvalidate) {
      return null
    } else {
      return nextList.items;
    }
  }
  nextState.util.getList = (...listArgs) => {
    /**
     * utility method for a) determining if a list exists and b) getting those list objects
     * this can be used in the render function of a component to avoid having to
     * type: lists.player && lists.player.[id] && lists.player.[id].items
     * if list doesnt exist yet, it returns null, else returns array of objects
     * not meant to replace the map and individual list reducers, but to reduce
     * boiler plate and produce cleaner code in the front end components.
     */
    if(listArgs.length === 0) {
      // If no arguments passed, make the list we want "all"
      listArgs = ["all"];
    }
    let nextList = nextState.lists;
    for(var i = 0; i < listArgs.length; i++) {
      if(nextList[listArgs[i]]) {
        nextList = nextList[listArgs[i]];
      } else {
        nextList = null;
        break;
      }
    }
    if(!nextList || !nextList.items || nextList.didInvalidate) {
      return null
    } else {
      return nextList.items.map((item) => nextState.byId[item])
    }
  }
  nextState.util.getKeyArrayFromList = (key, ...listArgs) => {
    /**
     * utility method for returning an ARRAY of all of the "key" values
     * for the objects defined in a certain list. for example, if we have
     * a list defined by listArgs ("status", "published"), we can return an
     * array of all that list's author ids by calling:
     * Reducer.getKeyArrayFromList("_author","status","published")
     */
    if(listArgs.length === 0) {
      // If no arguments passed, make the list we want "all"
      listArgs = ["all"];
    }
    let nextList = nextState.lists;
    for(var i = 0; i < listArgs.length; i++) {
      if(nextList[listArgs[i]]) {
        nextList = nextList[listArgs[i]];
      } else {
        nextList = null;
        break;
      }
    }
    if(!nextList || !nextList.items || nextList.didInvalidate) {
      return null
    } else {
      return nextList.items.map((item) => nextState.byId[item][key])
    }
  }
  return nextState;
}

export default file;
