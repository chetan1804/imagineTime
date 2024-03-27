// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import third-party libraries
import moment from 'moment';
import { DateTime } from 'luxon';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import { displayUtils } from '../../../global/utils';

// import event tracking
// import UserClickEvent from '../../userEvent/components/UserClickEvent.js.jsx';

const FileMicroListItem = ({
  file 
  , filePath
  , match = {}
  , viewingAs = ""
}) => {

  // viewingAs="quickView"

  let icon = file ? displayUtils.getFileIcon(file.category, file.contentType, file) : 'file-80';
  // let icon = 'icon' // for testing.

  let newFilePath = {
    pathname: filePath
  };

  if (viewingAs === "quickView") {
    newFilePath["state"] = {
      prevPath: match.url
      , viewingAs
    }
  }
  
  return (
    <div>
      {file && file.status != 'deleted' ? 
        <Link to={newFilePath} className="file-micro-list-item">
          <div className="-icon">
            <img src={`/img/icons/${icon}.png`} />
          </div>
          { file ? 
            <div className="-info">
              <div className="-title">
                {file.filename}
              </div>
              <div className="-date">{DateTime.fromISO(file.updated_at).toLocaleString(DateTime.DATETIME_MED)}</div>
            </div>
            :
            <div className="-info">
              <i className="far fa-spinner fa-spin"/>
            </div>
          }
          <div className="-view-arrow">
            <i className="far fa-angle-right"/>
          </div>
        </Link>
      :
        <div>
          <div className="-icon">
            <img src={`/img/icons/${icon}.png`} />
          </div> 
          <div className="-info">
            <div className="-title">
              Oops! This file has been deleted.
            </div>
          </div>
        </div>
      }

    </div>
  )
}

FileMicroListItem.propTypes = {
  file: PropTypes.object
  , filePath: PropTypes.string.isRequired 
}

FileMicroListItem.defaultProps = {
  file: null 
}


export default withRouter(FileMicroListItem);
