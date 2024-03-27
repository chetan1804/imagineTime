/**
 * Setup application for use with Redux & React-Router
 *
 *
 * NOTE: 'react-router-apply-middleware' is not the same as
 * react-router/applyRouterMiddleware. Using that breaks relative links
 * TODO: in future, check to see if react-router one starts working and remove this dependency
 */

/* global Office:false */

require('es5-shim');
require('es5-shim/es5-sham');

import React from 'react';
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux';
import queryString from 'query-string';

import DesktopTaskPane from './global/desktop/views/DesktopTaskPane.js.jsx';

import configureStore from './config/configureStore';

// import scss files.
// NOTE: Webpack does NOT actually import these as js. Instead it will generate the yote.css file.
import './config/yote.scss';

const store = configureStore();

const render = () => {
  const { filename } = queryString.parse(window.location.search);

  ReactDOM.render(
    <Provider store={store}>
      <DesktopTaskPane filename={filename}/>
    </Provider>
    , document.getElementById('desktop-main-yote')
  );
}

render();
