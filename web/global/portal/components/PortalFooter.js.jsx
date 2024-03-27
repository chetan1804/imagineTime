/**
 * Global application footer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import brandingName from '../../enum/brandingName.js.jsx';

let firmLogo = brandingName.image.logoBlack;

function PortalFooter() {
  return(
    <footer className="footer -portal-footer">
      <div className="yt-container" style={{padding: "20px"}}>
        <div className="yt-row right center-vert">
          <span><em>powered by </em></span><a className="footer-logo" href={brandingName.url} target="_blank"><img src={firmLogo} /></a>
        </div>
      </div>
    </footer>
  )
}

export default PortalFooter;
