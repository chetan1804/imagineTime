import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../../../../global/components/Binder.js.jsx';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

class FileListOptions extends Binder {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
    const {
      isOpen
      , match
      , isArchive
      , handleOpenTemplateModal
      , handleOpenFolderModal
      , handleOpenUploadModal
      , handleOpenRequestModal
      , handleOpenShareModal
      , showWarningModal
      , selectedFileIds
      , handleContextMenuSubmit
    } = this.props;

    const preffixCount = selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null;

    console.log("FileListOptions")

    return (
      <span className="file-list-options"style={{position: "absolute"}}>
        <TransitionGroup >
          { isOpen ?
            <CSSTransition
              classNames="dropdown-anim"
              timeout={250}
            >
              {isArchive ? 
                <ul className="dropMenu -options-menu">
                  <li  className="-option">
                    <Link to={match.url.includes("archived-folder") ? match.url.substring(0, match.url.lastIndexOf("/archived/")) : match.url.replace('/archived', '')}>All Files</Link>
                  </li>
                </ul>
              :
              <ul className="dropMenu -options-menu">
                <li  className="-option">
                  <Link to={`${match.url}/archived`}>View Archive</Link>
                </li>
                  {
                    handleOpenTemplateModal ?
                    <li className="-option -folder-template-option">
                        <a onClick={handleOpenTemplateModal}>
                            Folder Template
                        </a>
                    </li> : null
                  }
                  {
                    handleOpenFolderModal ?
                    <li className="-option -folder-option">
                        <a onClick={handleOpenFolderModal}>
                            New Folder
                        </a>
                    </li> : null
                  }
                  {
                    handleOpenUploadModal ?
                    <li className="-option -upload-file-option">
                        <a onClick={handleOpenUploadModal}>
                            Upload New Files
                        </a>
                    </li> : null
                  }
                  {
                    handleOpenRequestModal ?
                    <li className="-option -request-files-option" style={{ borderBottom: "1px solid #ddd" }}>
                        <a onClick={handleOpenRequestModal}>
                            Request files
                        </a>
                    </li> : null
                  }
                  {
                    handleOpenShareModal ?
                    <li className="-option -share-files-option">
                        <a onClick={(e) => handleContextMenuSubmit("share", showWarningModal)}>
                        Share {preffixCount}
                        </a>
                    </li> : null
                  }
                  <li className="-option -archive-option">
                    <a className={selectedFileIds.length ? "" : "-disabled-link"} onClick={selectedFileIds.length ? (e) =>  handleContextMenuSubmit("archive", showWarningModal) : this._handleDisabledButton}>
                        Archive {preffixCount}
                    </a>
                  </li>
                  <li className="-option -download-option">
                    <a className={selectedFileIds.length ? "" : "-disabled-link"} onClick={selectedFileIds.length ? (e) => handleContextMenuSubmit("download", showWarningModal) : this._handleDisabledButton} >
                        Download {preffixCount}
                    </a>
                  </li>
                  <li  className="-option -move-option">
                    <a className={selectedFileIds.length ? "" : "-disabled-link"} onClick={selectedFileIds.length ? (e) =>  handleContextMenuSubmit("move", showWarningModal) : this._handleDisabledButton}>
                        Move {preffixCount}
                    </a>
                  </li>
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

FileListOptions.propTypes = {
  isOpen: PropTypes.bool.isRequired
  , openQuickTaskModal: PropTypes.func
}

FileListOptions.defaultProps = {

}

export default withRouter(FileListOptions);