import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../../../../global/components/Binder.js.jsx';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import utilities
import { routeUtils } from '../../../../global/utils';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

// import action
import * as fileActions from '../../fileActions';

class WorkspacesGeneralListItem extends Binder {
  constructor(props) {
    super(props);
    this.state = {

    }
  }

  componentDidMount() {
    console.log("load WorkspacesGeneralListItem")
  }

  render() {
    const {
      item
      , match
    } = this.props;

    let totalByClientIds = _.cloneDeep(this.props.totalByClientIds);
    let totalFiles = [];
    let totalFolders = [];
    if (item && item._id === "personal" && !match.params.personal) {
      if (item.root && !item._user) {
        totalByClientIds = {
          totalFiles: totalByClientIds && totalByClientIds.totalFiles && totalByClientIds.totalFiles.length ? totalByClientIds.totalFiles.length : 0
          , totalFolders: totalByClientIds && totalByClientIds.totalFolders && totalByClientIds.totalFolders.length ? totalByClientIds.totalFolders.length : 0
        }  
      } else if (!item.root && item._user) {
        totalFiles = totalByClientIds && totalByClientIds.totalFiles ? totalByClientIds.totalFiles.filter(file => file._personal == item._user) : [];
        totalFolders = totalByClientIds && totalByClientIds.totalFolders ? totalByClientIds.totalFolders.filter(file => file._personal == item._user) : [];
        totalByClientIds = {
          totalFiles: totalFiles.length
          , totalFolders: totalFolders.length
        }
      } else {
        totalByClientIds = {
          totalFiles: totalFiles.length
          , totalFolders: totalFolders.length
        }
      }
    } else if (item && item._id === "personal" && match.params.personal && match.params.personal === "personal") {
      totalFiles = totalByClientIds && totalByClientIds.totalFiles ? totalByClientIds.totalFiles.filter(file => file._personal == item._user) : [];
      totalFolders = totalByClientIds && totalByClientIds.totalFolders ? totalByClientIds.totalFolders.filter(file => file._personal == item._user) : [];
      totalByClientIds = {
        totalFiles: totalFiles.length
        , totalFolders: totalFolders.length
      }
    }

    return (
      <div className="table-row -file-item">
        <div className="table-cell -title -without-description">
            <div className="yt-row center-vert">
                <span className="-icon">
                  <img src={brandingName.image["folder-empty"] || "/img/icons/folder-empty.png"} /> 
                </span>
                <div className="-file-info">
                    {/** client._id stand for folder id for this view */}
                    <Link to={
                      item._id === "public" ? `/firm/${item._firm}/files/${item._id}` 
                      : item._id === "personal" ? item.root ? `/firm/${item._firm}/files/personal` : `/firm/${item._firm}/files/${item._user}/personal` 
                      : `/firm/${item._firm}/files/${item._id}/workspace`}>{item.name}
                    </Link>
                    <br/>
                    <small>
                        <span>
                            {/* {
                              client._isOwner || client._id === "public" || client._id === "personal" ? null
                              : "  - Workspace files" // DateTime.fromISO(client.created_at).toLocaleString(DateTime.DATE_SHORT)
                            } */}
                        </span>
                    </small>
                </div>
            </div>
        </div>
        <div className="table-cell">
          {totalByClientIds && totalByClientIds.totalFolders ? totalByClientIds.totalFolders : 0}
        </div>
        <div className="table-cell">
          {totalByClientIds && totalByClientIds.totalFiles ? totalByClientIds.totalFiles : 0}
        </div>
    </div>
    )
  }
}

WorkspacesGeneralListItem.propTypes = {}

WorkspacesGeneralListItem.defaultProps = {}

const mapStoreToProps = (store) => {

  // const files = store.file && store.file.lists

  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    fileStore: store.file
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(WorkspacesGeneralListItem)
);
