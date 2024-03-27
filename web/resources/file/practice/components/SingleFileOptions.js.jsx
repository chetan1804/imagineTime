import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../../../../global/components/Binder.js.jsx';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _, { isNull } from 'lodash';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import ReactTooltip from "react-tooltip";

import permissions from '../../../../global/utils/permissions.js';

class SingleFileOptions extends Binder {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
    const {
      handleOpenQuickTaskModal
      , handleOpenFolderPermissionModal
      , handleContextMenuSubmit
      , isOpen
      , setStatus
      , sendDeleteFile
      , eSigAccess
      , toggleUpdateFilename
      , match
      , file = {}
      , closeAction
      , isFolderFromTemplate
      , viewingAs
      , selectedFirm
      , handleOpenMoveFileModal
      , role
      , parentFolder
    } = this.props;

    console.log('selectedFirm', selectedFirm);

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

    console.log('portal selected file', file);
    return (
      <span className="single-file-options"style={{position: "absolute"}}>
        <TransitionGroup >
          { isOpen ?
            <CSSTransition
              classNames="dropdown-anim"
              timeout={250}
            >
            {
              viewingAs === "recyclebin" ?
              <ul className="dropMenu -options-menu">
                <li className="-option">
                  <a onClick={() => setStatus('visible')}>Restore</a>
                </li>
              </ul>
              : 
              viewingAs === "archived" ? 
              <ul className="dropMenu -options-menu">
                {
                  permissions.hasPermission(selectedFirm, parentFolder, file, `${role}Delete`) ? 
                  <li  className="-option">
                    <a className="-delete-link" onClick={sendDeleteFile}>Delete File</a>
                  </li>
                  :
                  <li className="-option" data-tip data-for="SFO_DisableDelete"> 
                    <a className="-disabled-link" disabled={true} onClick={null}>
                      <i className="fas fa-lock"/> Delete File
                    </a>
                    <ReactTooltip id="SFO_DisableDelete" place="top" type="warning" effect="solid">
                      <span className="tooltipMessage">You don't have permission to <br/> archive/delete files and folders</span>
                    </ReactTooltip>
                  </li>
                }
                <li className="-option">
                  <a onClick={() => setStatus('visible')}>Reinstate File</a>
                </li>
              </ul>
              :
              viewingAs === "portal" ?
              <ul className="dropMenu -options-menu">
                {
                  //selectedFirm && selectedFirm.allowDeleteFiles ? 
                  permissions.hasPermission(selectedFirm, parentFolder, file, `${role}Delete`) ? 
                  <li  className="-option">
                    <a className="-delete-link" onClick={sendDeleteFile}>Delete File</a>
                  </li> 
                  : 
                  <li  className="-option" data-tip data-for="SFO_PortalDisableDelete">
                    <a className="-disabled-link" disabled={true} onClick={null}>
                      <i className="fas fa-lock"/> Delete File
                    </a>
                    <ReactTooltip id="SFO_PortalDisableDelete" place="top" type="warning" effect="solid">
                      <span className="tooltipMessage">You don't have permission to <br/> archive/delete files and folders</span>
                    </ReactTooltip>
                  </li> 
                }
                {
                  selectedFirm && selectedFirm.allowMoveFiles ? 
                  <li className="-option">
                    <a onClick={handleOpenMoveFileModal}>Move {file.category == "folder" ? "Folder" : "File" }</a>
                  </li> : null
                }
                {
                  //selectedFirm && selectedFirm.allowRenameFiles ?
                  permissions.hasPermission(selectedFirm, parentFolder, file, `${role}Update`) ? 
                  <li className="-option">
                    <a onClick={toggleUpdateFilename}>Rename {file.category == "folder" ? "Folder" : "File" }</a>
                  </li> 
                  : 
                  <li className="-option" data-tip data-for="SFO_PortalDisableUpdate">
                    <a className="-disabled-link" disabled={true} onClick={null}>
                      <i className="fas fa-lock"/> Rename {file.category == "folder" ? "Folder" : "File" }
                    </a>
                    <ReactTooltip id="SFO_PortalDisableUpdate" place="top" type="warning" effect="solid">
                      <span className="tooltipMessage">You don't have permission to <br/> update files and folders</span>
                    </ReactTooltip>
                  </li> 
                }
              </ul>
              :
              <ul className="dropMenu -options-menu">
                {
                  permissions.hasPermission(selectedFirm, parentFolder, file, `${role}Delete`) ?
                  <li className="-option">
                    <a onClick={() => setStatus('archived')}>Archive {file.category == "folder" ? "Folder" : "File" }</a>
                  </li>
                  :
                  <li className="-option" data-tip data-for="SFO_WorkspaceDisableDelete">
                    <a className="-disabled-link" disabled={true} onClick={null}>
                      <i className="fas fa-lock"/> Archive {file.category == "folder" ? "Folder" : "File" }
                    </a>
                    <ReactTooltip id="SFO_WorkspaceDisableDelete" place="top" type="warning" effect="solid">
                      <span className="tooltipMessage">You don't have permission to <br/> archive/delete files and folders</span>
                    </ReactTooltip>
                  </li>
                }
                {
                  file.category != "folder"? 
                  <li>
                    <Link onClick={closeAction} to={fileActivityUrl}>File Activity</Link>
                  </li> : null 
                }
                <li className="-option">
                  <a onClick={(e) => handleContextMenuSubmit("move", e)}>Move {file.category == "folder" ? "Folder" : "File" }</a>
                </li>
                {
                  isFolderFromTemplate ? null 
                  :
                  permissions.hasPermission(selectedFirm, parentFolder, file, `${role}Update`) ?
                    <li className="-option">
                      <a onClick={toggleUpdateFilename}>Rename {file.category == "folder" ? "Folder" : "File" }</a>
                    </li>
                  : 
                  <li className="-option" data-tip data-for="SFO_WorkspaceUpdate">
                    <a className="-disabled-link" disabled={true} onClick={null}>
                      <i className="fas fa-lock"/> Rename {file.category == "folder" ? "Folder" : "File" }
                    </a>
                    <ReactTooltip id="SFO_WorkspaceUpdate" place="top" type="warning" effect="solid">
                      <span className="tooltipMessage">You don't have permission to <br/> update files and folders</span>
                    </ReactTooltip>
                  </li>
                }
                {
                  file.category != "folder" ? 
                  <li  className="-option">
                    {eSigAccess && contentType && (contentType.indexOf('pdf') > -1 || contentType.indexOf('doc') > -1) ? 
                      <a disabled={!handleOpenQuickTaskModal} onClick={handleOpenQuickTaskModal}>Request signature</a>
                    : 
                      <a className="-disabled-link" disabled={true} onClick={null}><i className="fas fa-lock"/> Request signature </a>
                    }
                  </li> : null 
                }    
                {/* {
                  isFolderFromTemplate ? null
                  :
                  file.category == "folder" && (file.status != "archived" || file.status == "deleted") ? 
                  <li className="-option">
                    <a onClick={handleOpenFolderPermissionModal}>Permissions</a>
                  </li> : null
                }                 */}
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

SingleFileOptions.propTypes = {
  isOpen: PropTypes.bool.isRequired
  , openQuickTaskModal: PropTypes.func
}

SingleFileOptions.defaultProps = {

}

export default withRouter(SingleFileOptions);