import * as Actions from "./TransactionAction";

function transactionList(
  state = {
    didInvalidate: false,
    error: null,
    filter: {},
    isFetching: false,
    items: [],
    lastUpdated: null,
    pagination: {},
  },
  action
) {
  let nextAction = JSON.parse(JSON.stringify(action));
  nextAction.listArgs.shift();

  if (nextAction.listArgs.length > 0) {
    return {
      ...state,
      [nextAction.listArgs[0]]: transactionList(
        state[nextAction.listArgs[0]] || {},
        nextAction
      ),
    };
  } else {
    switch (action.type) {
      case Actions.INVALIDATE_TRANSACTION_LIST: {
        return {
          ...state,
          didInvalidate: true,
        };
      }
      case Actions.REQUEST_TRANSACTION_LIST: {
        return {
          ...state,
          error: null,
          filter: state.filter || {},
          isFetching: true,
          items: [],
          lastUpdated: null,
          pagination: state.pagination || {},
        };
      }
      case Actions.RECEIVE_TRANSACTION_LIST: {
        if (!action.success) {
          return {
            ...state,
            error: action.error,
            isFetching: false,
            items: [],
            lastUpdated: action.receivedAt,
          };
        } else {
          let idArray = [];
          for (const item of action.list) {
            idArray.push(item.id);
          }
          return {
            ...state,
            didInvalidate: false,
            error: action.error || null,
            isFetching: false,
            items: idArray,
            lastUpdated: action.receivedAt,
          };
        }
      }
      case Actions.SET_TRANSACTION_FILTER: {
        return {
          ...state
          , filter: action.filter
        }
      }
      case Actions.SET_TRANSACTION_PAGINATION: {
        return {
          ...state,
          pagination: action.pagination,
        };
      }
      default:
        return state;
    }
  }
}

function transaction(
  state = {
    transaction: {},

    defaultItem: {
      error: null,
      getItemFromSchema: () => {
        return null;
      },
      obj: null,
      schema: null,
      lastUpdated: null,
    },

    lists: {},

    selected: {
      didInvalidate: false,
      error: null,
      getItem: () => {
        return null;
      },
      id: null,
      isFetching: false,
      lastUpdated: null,
    },

    util: {
      getKeyArrayFromList: () => {
        return null;
      },
      getList: () => {
        return null;
      },
      getSelectedStore: () => {
        return null;
      },
    },
  },
  action
) {
  let nextState;
  switch (action.type) {
    case Actions.INVALIDATE_TRANSACTION_LIST:
    case Actions.REQUEST_TRANSACTION_LIST:
    case Actions.SET_TRANSACTION_FILTER:
    case Actions.SET_TRANSACTION_PAGINATION: {
      nextState = {
        ...state,
        lists: {
          ...state.lists,
          [action.listArgs[0]]: transactionList(
            state.lists[action.listArgs[0]] || {},
            action
          ),
        },
      };
      break;
    }
    case Actions.RECEIVE_TRANSACTION_LIST: {
      let newIdMap = {};
      if (action.success) {
        for (const item of action.list) {
          newIdMap[item.id] = item;
        }
      }
      nextState = {
        ...state,
        transaction: newIdMap,
        lists: {
          ...state.lists,
          [action.listArgs[0]]: transactionList(
            state.lists[action.listArgs[0]],
            action
          ),
        },
        selected: {
          error: null,
          id: null,
          isFetching: false,
        },
      };
      break;
    }

    case Actions.REQUEST_CREATE_CHARGE: {
      nextState = {
        ...state,
        selected: {
          error: null,
          id: null,
          isFetching: true,
        },
      };
      break;
    }
    case Actions.RECEIVE_CREATE_CHARGE: {
      if (action.item) {
        nextState = {
          ...state,
          charge: {
            ...state.charge,
            data: action.item,
          },
          selected: {
            didInvalidate: false,
            error: null,
            id: action.id,
            isFetching: false,
            lastUpdated: action.receivedAt,
          },
        };
      } else {
        nextState = {
          ...state,
          selected: {
            error: action.error,
            isFetching: false,
            lastUpdated: action.receivedAt,
          },
        };
      }
      break;
    }

    case Actions.REQUEST_VOID_OR_REFUND: {
      nextState = {
        ...state,
        selected: {
          error: null,
          id: null,
          isFetching: true,
        },
      };
      break;
    }
    case Actions.RECEIVE_VOID_OR_REFUND: {
      if (action.item) {
        nextState = {
          ...state,
          voidOrRefund: {
            ...state.voidOrRefund,
            data: action.item,
          },
          selected: {
            didInvalidate: false,
            error: null,
            id: action.id,
            isFetching: false,
            lastUpdated: action.receivedAt,
          },
        };
      } else {
        nextState = {
          ...state,
          selected: {
            error: action.error,
            isFetching: false,
            lastUpdated: action.receivedAt,
          },
        };
      }
      break;
    }

    default: {
      nextState = state;
      break;
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
      return nextList;
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
      return nextList.items.map((item) => nextState.transaction[item])
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
      return nextList.items.map((item) => nextState.transaction[item][key])
    }
  }

  return nextState;
}

export default transaction;
