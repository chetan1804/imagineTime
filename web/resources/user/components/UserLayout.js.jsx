/**
 * Wraps all non-admin User components in a default view wrapper
 * is a class in case you want some extra special logic...
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import axios from 'axios';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import Auth from '../../../global/utils/auth';

// import components
import UserAutoLogoutForm from './UserAutoLogoutForm.js.jsx';
import UserTokenChecker from "./UserTokenChecker.js.jsx";

class UserLayout extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { forwardURI } = queryString.parse(decodeURIComponent(window.location.search));

    console.log('window.location.search', window.location.search);

    if(forwardURI) {
      const urls = forwardURI.split('?');

      console.log('urls', urls);
      if(urls.length > 0) {
        const hostname = urls[0];
        const qfolderpath = `?${urls[1]}`;

        const { folderpath } = queryString.parse(decodeURIComponent(qfolderpath));

        console.log('new folderpath', folderpath);

        if(folderpath && !Auth.notLoggedIn()) {
          const paths = folderpath.split('/');
          
          let clientname = '';
          let foldername = '';

          if(paths.length > 0) {
            clientname = paths[0];
            foldername = paths[1];
          } else {
            clientname = paths;
          }

          axios({
            method: 'GET',
            url: `/api/com/getClientFolder?clientname=${clientname}&foldername=${foldername}`
          })
          .then(({ data }) => {
            if(data.success) {
              const c = data.client;
              const f = data.file;

              let clientUrl = hostname.charAt(hostname.length - 1) == '/' ? '' : '/';

              clientUrl += !c ? '' : `firm/${c._firm}/workspaces/${c._id}/files`;
              const folderUrl = !f ? '' : `/${f._id}/folder`;

              if(hostname) {
                if(hostname.includes('localhost')) {
                  window.location = `http://${hostname}${clientUrl}${folderUrl}`;
                } else {
                  window.location = `https://${hostname}${clientUrl}${folderUrl}`;
                }

              } else {
                if(window.appUrl.includes('localhost')) {
                  window.location = `http://${window.appUrl}${clientUrl}${folderUrl}`;
                } else {
                  window.location = `https://${window.appUrl}${clientUrl}${folderUrl}`;
                }
              }

            } else {
              //do not redirect
            }
          })
          console.log('paths', paths);
        }
      } else {
        window.location = `https://${window.appUrl}`;
      }
    }
  }

  render() {
    return (
      <div className="master-layout">
        {/* <UserAutoLogoutForm /> */}
        <UserTokenChecker 
          isUserLayout={true}
        />
        <div className="body">
          {this.props.children}
        </div>
      </div>
    )
  }
}

export default UserLayout;
