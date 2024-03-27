/**
 * A list item to display files added to a clientTask or clientTaskResponse.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import utils
import { displayUtils } from '../../../../global/utils';

const FolderTemplateDeliveryListItem = ({
  folder
  , removeFolder
  , allowRemove
}) => {

  let icon = folder ? displayUtils.getFileIcon("folder", "template") : 'file-80';
  return (
    <div className="file-delivery-list-item">
      <div className="-icon">
        <img src={`/img/icons/${icon}.png`} />
      </div>
      { folder ? 
        <div className="-info">
          <div className="-title">
            {folder.name}
          </div>
        </div>
        :
        <div className="-info">
          <i className="far fa-spinner fa-spin"/>
        </div>
      }
      { allowRemove ?
        <button onClick={() => removeFolder(folder._id)}className="yt-btn link xx-small u-pullRight">
          <i className="far fa-times"/>
        </button>
        :
        null
      }
    </div>
  )
}

FolderTemplateDeliveryListItem.propTypes = {
  allowRemove: PropTypes.bool.isRequired
  , folder: PropTypes.object.isRequired
  // , removeFile: PropTypes.func.isRequired
}

FolderTemplateDeliveryListItem.defaultProps = {
  allowRemove: false
  , folder: null 
}

export default FolderTemplateDeliveryListItem;
