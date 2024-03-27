import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../../../../global/components/Binder.js.jsx';
import { Link, withRouter } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';

// import third-party libraries
import _ from 'lodash';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import permissions from '../../../../global/utils/permissions.js';

class FilesOptions extends Binder {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
    const {
      isOpen
      , selectedFileIds
      , handleContextMenuSubmit
      , handleOpenShareModal
      , isAutoChecked
      , handleOpenQuickTaskModal
      , viewingAs
      , showClientList
      , setStatus
      , isArchived 
      , sendDeleteFile
      , eSigAccess
      , toggleUpdateFilename
      , match
      , file = {}
      , closeAction
      , role
      , selectedFirm
      , parentFolder
    } = this.props;

    console.log("isopen", isOpen);
    const preffixCount = selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null;
    const singleFileSelected = selectedFileIds && file && selectedFileIds.length === 1 && selectedFileIds.includes(file._id);

    const endIndexOf = match && match.url ? match.url.indexOf("file-activity") : -1;
    let fileActivityUrl = endIndexOf > 0 ? match.url.substr(0, endIndexOf) : `${match.url}/`;
    fileActivityUrl += viewingAs === "archived" ? "" : `file-activity/${file._id}`;

    let contentType = file && file.contentType;
    if (file && file.category != 'folder' && file.fileExtension) {
      if (file.fileExtension.toLowerCase().indexOf('.pdf') > -1) {
        contentType = 'application/pdf';
      } else if (file.fileExtension.toLowerCase().indexOf('.doc') > -1) {
        contentType = 'application/doc';
      } else {
        contentType = file.fileExtension;
      }
    }

    console.log('rightclick file', file);
    
    return (
      <span className="single-file-options"style={{position: "absolute"}}>
        <TransitionGroup >
          { isOpen ?
            <CSSTransition
              classNames="dropdown-anim"
              timeout={250}
            >
            {
              viewingAs === "archived" ?
              <ul className="dropMenu -options-menu">
                {
                  permissions.hasPermission(selectedFirm, parentFolder, file, `${role}Delete`) ? 
                  <li>
                    <a onClick={(e) => handleContextMenuSubmit("delete", e)}>
                      Delete {preffixCount}
                    </a>
                  </li>
                  :
                  <li>
                    <a className="-disabled-link" disabled={true} onClick={null}>
                      <i className="fas fa-lock"/> Delete
                    </a>
                    <ReactTooltip id="FO_DisableDelete" place="top" type="warning" effect="solid">
                      <span className="tooltipMessage">You don't have permission to archive/delete files and folders</span>
                    </ReactTooltip>
                  </li>
                }
                <li className="-option">
                  <a onClick={(e) => handleContextMenuSubmit("reinstate", e)}>
                    Reinstate {preffixCount}
                  </a>
                </li>
              </ul>
              :
              < ul className="dropMenu -options-menu">
                {
                  permissions.hasPermission(selectedFirm, parentFolder, file, `${role}Delete`) ?      
                  <li className="-option">
                    <a onClick={(e) => handleContextMenuSubmit("archive", e)}>
                      Archive {preffixCount}
                    </a>
                  </li>
                  :
                  <li className="-option" data-tip data-for="FO_DisableDelete">
                    <a className="-disabled-link" disabled={true} onClick={null}>
                      <i className="fas fa-lock"/> Archive
                    </a>
                    <ReactTooltip id="FO_DisableDelete" place="top" type="warning" effect="solid">
                      <span className="tooltipMessage">You don't have permission to archive/delete files and folders</span>
                    </ReactTooltip>
                  </li>
                }
                {
                  permissions.hasPermission(selectedFirm, parentFolder, file, `${role}Download`) ?
                  <li className="-option">
                    <a onClick={(e) => handleContextMenuSubmit("download", e)}>
                      Download {preffixCount}
                    </a>
                  </li>
                  :
                  <li className="-option" data-tip data-for="FO_DisableDownload">
                    <a className="-disabled-link" data-tip data-for="tooltipDisableDownload" disabled={true} onClick={null}>
                      <i className="fas fa-lock"/> Download
                    </a>
                    <ReactTooltip id="FO_DisableDownload" place="top" type="warning" effect="solid">
                      <span className="tooltipMessage">You don't have permission to download files and folders</span>
                    </ReactTooltip>
                  </li>
                }
                {
                  file.category != "folder" && (isAutoChecked || singleFileSelected) ? 
                  <li>
                    <Link onClick={(e) => handleContextMenuSubmit("activity", e)} to={fileActivityUrl}>File Activity</Link>
                  </li> : null 
                }
                <li className="-option">
                  <a onClick={(e) => handleContextMenuSubmit("move", e)}>
                    Move {preffixCount}
                  </a>
                </li>
                {
                  (isAutoChecked || singleFileSelected) ?
                  permissions.hasPermission(selectedFirm, parentFolder, file, `${role}Update`) ?
                    <li className="-option">
                      <a onClick={(e) => handleContextMenuSubmit("rename", e)}>Rename {file.category == "folder" ? "Folder" : "File" }</a>
                    </li> 
                    :
                    <li className="-option" data-tip data-for="FO_DisableUpdate">
                      <a className="-disabled-link" disabled={true} onClick={null}>
                        <i className="fas fa-lock"/> Rename {file.category == "folder" ? "Folder" : "File" }
                      </a>
                      <ReactTooltip id="FO_DisableUpdate" place="top" type="warning" effect="solid">
                        <span className="tooltipMessage">You don't have permission to update files and folders</span>
                      </ReactTooltip>
                    </li> 
                    
                  : 
                  null
                }
                {
                  file.category != "folder" && (isAutoChecked || singleFileSelected) ?
                  <li  className="-option">
                    {eSigAccess && contentType && (contentType.indexOf('pdf') > -1 || contentType.indexOf('doc') > -1) ? 
                      <a disabled={!handleOpenQuickTaskModal} onClick={(e) => handleContextMenuSubmit("signature", e)}>Request signature</a>
                    : 
                      <a className="-disabled-link" disabled={true} onClick={null}><i className="fas fa-lock"/> Request signature </a>
                    }
                  </li> : null 
                }
                {
                  handleOpenShareModal ?
                  <li className="-option">
                    <a onClick={(e) => handleContextMenuSubmit("share", e)}>
                      Share {preffixCount}
                    </a>
                  </li> : null
                }
              </ul>
            }
            </CSSTransition>
            :
            null
          }
        </TransitionGroup>      
      </span>
    )
  }
}

FilesOptions.propTypes = {
  isOpen: PropTypes.bool.isRequired
  , openQuickTaskModal: PropTypes.func
}

FilesOptions.defaultProps = {

}

export default withRouter(FilesOptions);