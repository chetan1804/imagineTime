import React from 'react';
import PropTypes from 'prop-types';

// import components
import UploadboxLoading from './UploadboxLoading.js.jsx';
import UploadboxAccount from './UploadboxAccount.js.jsx';

// import global 
import Auth from '../../utils/auth';
import brandingName from '../../enum/brandingName.js.jsx';

const notLoggedIn = Auth.notLoggedIn();

const UploadboxLayout = ({ children }) => (
  <div className="master-layout uploadbox-layout">
    <div className="body">
      <div className="-row">
          <div>
            <h1>Client Portal</h1>
          </div>
      </div>
      <div className="yt-container -uploadbox">
        {children}
      </div>
    </div>
    <div className="footer -uploadbox-footer">
      <img src={brandingName.image.poweredby} />
    </div>
  </div>
);

UploadboxLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default UploadboxLayout;