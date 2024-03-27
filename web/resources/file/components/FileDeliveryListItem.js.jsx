/**
 * A list item to display files added to a clientTask or clientTaskResponse.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import utils
import { displayUtils } from '../../../global/utils';

const FileDeliveryListItem = ({
  file
  , removeFile
  , allowRemove
}) => {

  let icon = file ? displayUtils.getFileIcon(file.category, file.contentType, file) : 'file-80';
  return (
    <div className="file-delivery-list-item">
      <div className="-icon">
        <img src={`/img/icons/${icon}.png`} />
      </div>
      { file ? 
        <div className="-info">
          <div className="-title">
            {file.filename}
          </div>
        </div>
        :
        <div className="-info">
          <i className="far fa-spinner fa-spin"/>
        </div>
      }
      { allowRemove ?
        <button onClick={() => removeFile(file._id)}className="yt-btn link xx-small u-pullRight">
          <i className="far fa-times"/>
        </button>
        :
        null
      }
    </div>
  )
}

FileDeliveryListItem.propTypes = {
  allowRemove: PropTypes.bool.isRequired
  , file: PropTypes.object.isRequired
  // , removeFile: PropTypes.func.isRequired
}

FileDeliveryListItem.defaultProps = {
  allowRemove: false
  , file: null 
}

export default FileDeliveryListItem;
