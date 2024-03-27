import { createContext, useEffect, useReducer } from 'react';
import './App.css';
import { Router } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import Routes from './routers/index';
import { getLocalStorageItem, setLocalStorageItem } from './utility/helper';

const browserHistory = createBrowserHistory();

const initialState = {
  user        : getLocalStorageItem('user'),
  isSignedIn  : getLocalStorageItem('user'),
  // token  : '' || token,
};

const AuthReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user        : action.payload,
        isSignedIn  : true
        // token: action.payload.auth_token,
      };
    case 'LOGOUT':
      return {
        ...state,
        user        : null,
        isSignedIn  : false
        // token: ""
      };

    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

export const AuthContext = createContext();

const App = () => {
  const [state, dispatch] = useReducer(AuthReducer, initialState);

  useEffect(() => {
    if (state.isSignedIn) {
      setLocalStorageItem('user', state.user);
      setLocalStorageItem('isSignedIn', state.isSignedIn);
    } else {
      localStorage.clear();
    }
  }, [state.isSignedIn, state.user])

  return (
    <AuthContext.Provider value={{state, dispatch}}>
      <Router history={browserHistory}>
        <Routes {...state}/>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;

