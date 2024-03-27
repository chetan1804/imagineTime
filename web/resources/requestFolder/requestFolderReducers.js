/**
 * Build the Note store
 *
 * Follows best practices from Redux documentation:
 *   - Single source of truth
 *   - State/Store is read-only
 *   - Changes are made with pure functions
 *
 * See http://redux.js.org/docs/recipes/StructuringReducers.html for specific
 * docs on structuring reducers
 *
 * REQUEST_FOLDER: In Yote, we try to keep actions and reducers dealing with CRUD payloads
 * in terms of 'item' or 'items'. This keeps the action payloads consistent and
 * aides various scoping issues with list management in the reducers.
 */

// import requestFolder actions
import * as Actions from './requestFolderActions';
import apiUtils from '../../global/utils/api'

/**
 * requestFolderList reducer -
 *
 * Accepts arbitrary list arguments and recursively builds nested list as needed
 *
 * REQUEST_FOLDER: this is never called directly. Only by parent 'requestFolder' reducer (defined
 * below) when dealing with a LIST action
 */
function requestFolderList(state = {
  /**
   * The "items" object defines the default state for a list
   *
   * REQUEST_FOLDER: This is for reference only. The list is not actually initialized here.
   * The actual init happens the first time REQUEST_LIST is called.
   */
  didInvalidate: false
  , error: null
  , filter: {}
  , isFetching: false
  , items: [] // array of _id's
  , lastUpdated: null
  , pagination: {}

}, action) {
  // console.log("DEBUG", state, action.listArgs);
  let nextAction = JSON.parse(JSON.stringify(action)); // Only change copy. NOT the  original object
  nextAction.listArgs.shift();

  /**
   * Check for nested list --
   * If the action is asking for a nested state, like lists[workout][123ABC],
   * then recursively return an _additional_ requestFolderList reducer.
   *
   * Otherwise, return the actual requestFolder lists' store
   */
  if(nextAction.listArgs.length > 0) {
    /**
     * The action is asking for a nested state, like lists[workout][123ABC].
     * Let's nest it by returning an additional requestFolderList reducer and trying again.
     */
    return {
      ...state
      , [nextAction.listArgs[0]]: requestFolderList(state[nextAction.listArgs[0]] || {}, nextAction)
    }
  } else {
    /**
     * Stop nesting. Instead listen for the actions and respond accordingly.
     */
    switch(action.type) {
      case Actions.INVALIDATE_REQUEST_FOLDER_LIST: {
        return {
          ...state
          , didInvalidate: true
        }
      }
      case Actions.REQUEST_REQUEST_FOLDER_LIST: {
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
      case Actions.RECEIVE_REQUEST_FOLDER_LIST: {
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
          }
        }
      }
      case Actions.ADD_REQUEST_FOLDER_TO_LIST: {
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

      case Actions.REMOVE_REQUEST_FOLDER_FROM_LIST: {
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

      case Actions.SET_REQUEST_FOLDER_FILTER: {
        return {
          ...state
          , filter: action.filter
        }
      }
      case Actions.SET_REQUEST_FOLDER_PAGINATION: {
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
 * Primary requestFolder reducer -
 *
 * This is the single source of truth for all things 'requestFolder' related within the
 * application. The primary components of the reducer are defined in detail below.
 *
 * The basic idea is that the reducer listens for actions indicating a desired
 * state change and the reducer returns a new _copy_ of the state accordingly.
 */
function requestFolder(state = {

  /**
   * "byId" is an object map of all requestFolder items in the store. The map's keys are
   * the Mongo ids of the objects by default
   */
  byId: {}

  /**
   * "defaultItem" defines fields for a _new_ requestFolder
   * any component that creates a new requestFolder object should store a copy of this
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
   * "lists" corresponds to individual instances of the requestFolderList reducer as
   * defined above.
   *
   * REQUEST_FOLDER: when requesting a list, if args are undefined, the lists defaults to
   * lists['all']
   */
  , lists: {}

  /**
   * "selected" is a single _selected_ entity within the store
   *
   * For example, when changing the name of a requestFolder, the single requestFolder
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
   * For example, when fetching a nested list of notes by type and color you
   * would write something like:
   * let list = noteStore.util.getList('type', 'apparel', 'color', 'black')
   */
  , util: {
    getKeyArrayFromList: () => {
      return null
    }
    , getList: () => {
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
     * DEFAULT REQUEST_FOLDER ACTIONS
     */
    case Actions.REQUEST_DEFAULT_REQUEST_FOLDER: {
      nextState = {
        ...state
        , defaultItem: {
          ...state.defaultItem
          , isFetching: true
        }
      }
      break;
    }
    case Actions.RECEIVE_DEFAULT_REQUEST_FOLDER: {
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
    case Actions.REQUEST_REQUEST_FOLDER_SCHEMA: {
      nextState = {
        ...state
        , defaultItem: {
          ...state.defaultItem
          , isFetching: true
        }
      }
      break;
    }
    case Actions.RECEIVE_REQUEST_FOLDER_SCHEMA: {
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
     * SINGLE REQUEST_FOLDER ACTIONS
     */
    case Actions.REQUEST_SINGLE_REQUEST_FOLDER: {
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
    case Actions.RECEIVE_SINGLE_REQUEST_FOLDER: {
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
    case Actions.ADD_SINGLE_REQUEST_FOLDER_TO_MAP: {
      // add this requestFolder to the map
      nextState = {
        ...state
        , byId: {
          ...state.byId
          , [action.item._id]: action.item
        }
      }
      break;
    }
    case Actions.SET_SELECTED_REQUEST_FOLDER: {
      // add this requestFolder to the map and set it as selected
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
    case Actions.REQUEST_CREATE_REQUEST_FOLDER: {
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
    case Actions.RECEIVE_CREATE_REQUEST_FOLDER: {
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
    case Actions.REQUEST_UPDATE_REQUEST_FOLDER: {
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
    case Actions.RECEIVE_UPDATE_REQUEST_FOLDER: {
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
    case Actions.REQUEST_DELETE_REQUEST_FOLDER: {
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
    case Actions.RECEIVE_DELETE_REQUEST_FOLDER: {
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
    case Actions.INVALIDATE_SELECTED_REQUEST_FOLDER: {
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
    case Actions.INVALIDATE_REQUEST_FOLDER_LIST:
    case Actions.REQUEST_REQUEST_FOLDER_LIST:
    case Actions.SET_REQUEST_FOLDER_FILTER:
    case Actions.ADD_REQUEST_FOLDER_TO_LIST:
    case Actions.REMOVE_REQUEST_FOLDER_FROM_LIST:
    case Actions.SET_REQUEST_FOLDER_PAGINATION: {
      nextState = {
        ...state
        , lists: {
          ...state.lists
          , [action.listArgs[0]]: requestFolderList(state.lists[action.listArgs[0]] || {}, action)
        }
      }
      break;
    }
    case Actions.RECEIVE_REQUEST_FOLDER_LIST: {
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
          , [action.listArgs[0]]: requestFolderList(state.lists[action.listArgs[0]], action)
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

export default requestFolder;
