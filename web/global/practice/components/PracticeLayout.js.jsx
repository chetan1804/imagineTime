/**
 * Wrap all admin children in this special admin layout
 */

// import primary libraries
import React from 'react';

import queryString from 'query-string';
import axios from 'axios';

// import global components
import Binder from '../../components/Binder.js.jsx';
import Auth from '../../../global/utils/auth';

// import firm components
import PracticeSideNav from './PracticeSideNav.js.jsx';
import PracticeTopNav from './PracticeTopNav.js.jsx';
import UserAutoLogoutForm from '../../../resources/user/components/UserAutoLogoutForm.js.jsx';
import UserTokenChecker from '../../../resources/user/components/UserTokenChecker.js.jsx';

class PracticeLayout extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      isSidebarOpen: true
    }
    this._bind(
      '_toggleSideBar'
    )
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

  /**
   * NOTE: By setting the class on the body, we can preserve the sidebar
   * state even when this component remounts.
   * By default the sidebar is open.
   */
  _toggleSideBar() {
    if(document.body.classList.contains('sidebar-closed')) {
      console.log('opening sidebar');
      document.body.classList.toggle('sidebar-closed', false);
    } else {
      console.log('closing sidebar');
      document.body.classList.toggle('sidebar-closed', true);
    }
  }

  render() {
    return (
      <div className="master-layout">
        {/* <UserAutoLogoutForm /> */}
        <UserTokenChecker />
        <div className="practice-layout">
          <PracticeSideNav
            isSidebarOpen={this.state.isSidebarOpen}
          />
          <div className="practice-main-content">
            <PracticeTopNav
              isSidebarOpen={this.state.isSidebarOpen}
              toggleSidebar={this._toggleSideBar}
            />
            <div className="body with-header -firm-body">
              {this.props.children}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

PracticeLayout.propTypes = {
  // isSidebarOpen: PropTypes.bool 
}

PracticeLayout.defaultProps = {
  // isSidebarOpen: true 
}

export default PracticeLayout;
