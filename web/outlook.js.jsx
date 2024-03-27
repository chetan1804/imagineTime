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

import configureStore from './config/configureStore';

import OutlookTaskPane from './global/outlook/views/OutlookTaskPane.js.jsx';
import OutlookUserLogin from './global/outlook/views/OutlookUserLogin.js.jsx';

// import scss files.
// NOTE: Webpack does NOT actually import these as js. Instead it will generate the yote.css file.
import './config/yote.scss';

const store = configureStore();

let isOfficeInitialized = false;
let isIframeInitialized = false;

// used outlook entry point for iframe
const { ancestorOrigins } = window.location;
if (ancestorOrigins && ancestorOrigins.length) {
  console.log('---ancestorOrigins---', ancestorOrigins)
  isIframeInitialized = ancestorOrigins[0].includes("outlook") ? false : true;
}

const render = () => {

  /**
   * Look for an action in the query string. The 'action' controls which Outlook command or dialog 
   * to load. The Outlook manifest defines a single endpoint '/outlook'. This allows the plugin to 
   * serve all the functionality from a single entry point. You may add new commands here based on 
   * actions defined in the manifest. Each handler should handle the 'isOfficeInitialized' property.
   * 
   * In outlook for web the action isn't populated. Rather, it's handled by the following query string:
   * ?_host_Info=outlook|web|16.01|en-us|fdc2c1df-c61c-5324-fa1e-071fd97ffeed|isDialog|
   * so adding an additional check here so that it works. 
   */
  const { action, _host_Info, customAction, route } = queryString.parse(window.location.search);


  // console.log('outlook.js.jsx render fired -- isOfficeInitialized: ', isOfficeInitialized)
  ReactDOM.render(
    <Provider store={store}>
      {/* { action === 'displayDialog' || customAction === 'signin' || (_host_Info && _host_Info.includes('isDialog')) ?
        (
          <OutlookUserLogin isOfficeInitialized={isOfficeInitialized} />
        ) : (
          <OutlookTaskPane isOfficeInitialized={isOfficeInitialized} startRoute={route} />
        )} */}
          <OutlookTaskPane isIframeInitialized={isIframeInitialized} isOfficeInitialized={isOfficeInitialized} startRoute={route} />

    </Provider>
    , document.getElementById('outlook-main-yote')
  );
}

if (!isIframeInitialized) {
  Office.initialize = () => {
    isOfficeInitialized = true;
    render();
  }
} else {
  //load google extension
  render();
}