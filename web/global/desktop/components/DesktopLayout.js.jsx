import React from 'react';
import PropTypes from 'prop-types';
import brandingName from '../../enum/brandingName.js.jsx';

const DesktopLayout = ({ children }) => (
  <div className="master-layout desktop-layout">
    <div className="body">
      <div className="yt-container">
        {children}
      </div>
    </div>
    <div className="footer -desktop-footer">
      <div className="yt-container">
        <div className="yt-row space-between">
          {
            window.appUrl !== 'app.imaginetime.com' || window.appUrl !== 'app.lexshare.io' ?
            <div style={{color:"#000"}}>Pointing to: {window.appUrl}</div>
            : 
            <div/>
          }
          <img src={brandingName.image.poweredby} />
        </div>
      </div>
    </div>
  </div>
);

DesktopLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DesktopLayout;
