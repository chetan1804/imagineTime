import React from 'react';
import PropTypes from 'prop-types';
import brandingName from '../../enum/brandingName.js.jsx'

const OutlookLayout = (props) => {
  const { viewingAs, children } = props;
  return (
    <div className={`master-layout outlook-layout ${viewingAs}`}>
      <div className="body">
        <div className="yt-container">
          {children}
        </div>
      </div>
      {
        (viewingAs === "custom-template-plugin" || 
        viewingAs === "select-folder-plugin") ? null
        :
        <div className="footer -outlook-footer">
          <img src={brandingName.image.poweredby} />
        </div>
      }
    </div>
  );
}

OutlookLayout.propTypes = {
  // children: PropTypes.node.isRequired,
};

export default OutlookLayout;
