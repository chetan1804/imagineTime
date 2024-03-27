import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../../components/Binder.js.jsx';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

class FileListOptions extends Binder {
    constructor(props) {
        super(props);
        this.state = {
        }
        this._bind(
            '_handleDisabledButton'
        )
    }

    _handleDisabledButton(e) {
        e.preventDefault();
        e.stopPropagation();
    }

  render() {
    const {
        isOpen
        , match
        , viewingAs

        // props for file-list
        , selectedFileIds
        , handleContextMenuSubmit
        , showWarningModal
        , handleOpenShareModal
        , handleOpenRequestModal
        , handleOpenUploadModal
        , handleOpenFolderModal
        , handleOpenTemplateModal

        // props for request list
        , handleRequestListShowModal

        // props for request task list
        , handleRequestTaskShowModal
        , selectedTaskIds
        , handleTaskBulkEdit
        , taskStatusUrl
        , requestStatus
        , isViewing

        // props for files list archived

        // props for client list
        , selectedClientId
        , handleBulkArchive
        , handleAddStaffModalOpen
        , handleNotifModalOpen

        // props for client list archived
        , handleBulkAction
        , handleShowDeleteClientModal

        // props for request task list quick view
        , handleDownLoadAllFiles
        , handleUpdateStatus
        , requestTask
        , submitting
        , isStaff

        // props for recycle bin list
        , handleBulkRestoreFiles

        // props for client contact list
        , archived
        , selectedClientUserId
        , toggleAlertModal
        , handleBulkArchiveClientUser

        // props for client staffclient list
        , handleOpenAddStaffModal

        // props for firm staff member list
        , handleNewStaff

        // props for tag list
        , handleShowNewTagModal

        // props for folder template list

        // props for portal file list
        , handleDownloadFiles
        , handleDeleteFiles
        , selectedFirm

        // props for request folder
        , handleRequestFolderShowModal
    } = this.props;

    const preffixCount = selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null;

    return (
      <span className="file-list-options">
        <TransitionGroup >
          { isOpen ?
            <CSSTransition
              classNames="dropdown-anim"
              timeout={250}
            >
                { viewingAs === "file-list" ? 
                <ul className="dropMenu -options-menu">
                    <li className="-option" style={{ borderBottom: "1px solid #ddd" }}>
                        <Link to={`${match.url}/archived`}>View Archive</Link>
                    </li>
                    {
                        handleOpenUploadModal ?
                        <li className="-option">
                            <a onClick={handleOpenUploadModal}>
                                Upload New Files
                            </a>
                        </li> : null
                    }
                    {
                        handleOpenFolderModal ?
                        <li className="-option">
                            <a onClick={handleOpenFolderModal}>
                                New Folder
                            </a>
                        </li> : null
                    }
                    {
                        handleOpenTemplateModal ?
                        <li className="-option">
                            <a onClick={handleOpenTemplateModal}>
                                Folder Template
                            </a>
                        </li> : null
                    }
                    {
                        handleOpenRequestModal ?
                        <li className="-option" style={{ borderBottom: "1px solid #ddd" }}>
                            <a onClick={handleOpenRequestModal}>
                                Request files
                            </a>
                        </li> : null
                    }
                    <li  className="-option">
                        <a className={selectedFileIds.length ? "" : "-disabled-link"} onClick={selectedFileIds.length ? (e) =>  handleContextMenuSubmit("move", showWarningModal) : this._handleDisabledButton}>
                            Move {preffixCount}
                        </a>
                    </li>
                    <li className="-option">
                        <a className={selectedFileIds.length ? "" : "-disabled-link"} onClick={selectedFileIds.length ? (e) => handleContextMenuSubmit("download", showWarningModal) : this._handleDisabledButton} >
                            Download {selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null}
                        </a>
                    </li>
                    <li className="-option">
                        <a className={selectedFileIds.length ? "" : "-disabled-link"} onClick={selectedFileIds.length ? (e) =>  handleContextMenuSubmit("archive", showWarningModal) : this._handleDisabledButton}>
                            Archive {preffixCount}
                        </a>
                    </li>
                    {
                        handleOpenShareModal ?
                        <li className="-option">
                            <a onClick={(e) => handleContextMenuSubmit("share", showWarningModal)}>
                            Share {preffixCount}
                            </a>
                        </li> : null
                    }
                </ul>
                :
                viewingAs === "file-list-archived" ?
                <ul className="dropMenu -options-menu">
                    <li className="-option" style={{ borderBottom: "1px solid #ddd" }}>
                        <Link to={match.url.includes("archived-folder") ? match.url.substring(0, match.url.lastIndexOf("/archived/")) : match.url.replace('/archived', '')}>All Files</Link>
                    </li>
                    <li  className="-option">
                        <a className={selectedFileIds.length ? "" : "-disabled-link"} onClick={selectedFileIds.length ? (e) =>  handleContextMenuSubmit("delete", showWarningModal) : this._handleDisabledButton}>
                            Delete {preffixCount}
                        </a>
                    </li>
                    <li  className="-option">
                        <a className={selectedFileIds.length ? "" : "-disabled-link"} onClick={selectedFileIds.length ? (e) =>  handleContextMenuSubmit("reinstate", showWarningModal) : this._handleDisabledButton}>
                            Reinstate {preffixCount}
                        </a>
                    </li>
                </ul>
                :
                viewingAs === "request-list" ?
                <ul className="dropMenu -options-menu">
                    <li className="-option">
                        <a onClick={handleRequestListShowModal}>
                            New Request List
                        </a>
                    </li>
                </ul>
                :
                viewingAs === "request-folder" ?
                <ul className="dropMenu -options-menu">
                    <li className="-option">
                        <a onClick={handleRequestFolderShowModal}>
                            New Folder
                        </a>
                    </li>
                </ul>
                :
                viewingAs === "request-task-list" ?
                <ul className="dropMenu -options-menu" style={{ minWidth: "180px" }}>
                    {
                        isViewing === "portal" ? null :
                        <li className="-option">
                            <a onClick={handleRequestTaskShowModal}>
                                New Task
                            </a>
                        </li>
                    }
                    {
                        isViewing === "portal" ? null :
                        <li className="-option" style={{ borderBottom: "1px solid #ddd" }}>
                            <a className={selectedTaskIds.length ? "" : "-disabled-link"} onClick={selectedTaskIds.length ? handleTaskBulkEdit : this._handleDisabledButton}>
                                Bulk Edit
                            </a>
                        </li>
                    }
                    <li className="-option">
                        <Link to={`${taskStatusUrl}/${match.params.requestId}/completed`}>
                            <span>{requestStatus.completed.length}</span> Completed Tasks
                        </Link>
                    </li>
                    <li className="-option">
                        <Link to={`${taskStatusUrl}/${match.params.requestId}/published`}>
                            <span>{requestStatus.published.length}</span> Published Tasks
                        </Link>
                    </li>
                    <li className="-option">
                        <Link to={`${taskStatusUrl}/${match.params.requestId}/unpublished`}>
                            <span>{requestStatus.unpublished.length}</span> Unpublished Tasks
                        </Link>
                    </li>
                </ul>
                :
                viewingAs === "client-list" ?
                <ul className="dropMenu -options-menu" style={{ minWidth: "200px" }}>
                    <li className="-option" style={{ borderBottom: "1px solid #ddd" }}>
                        <Link to={`/firm/${match.params.firmId}/clients/archived`}>View Archive</Link>
                    </li>
                    <li className="-option">
                        <Link to={`/firm/${match.params.firmId}/clients/new`} className="-select">Create new client</Link>
                    </li>
                    <li className="-option" style={{ borderBottom: "1px solid #ddd" }}>
                        <Link to={`/firm/${match.params.firmId}/clients/import`} className="-select">Bulk client upload</Link>
                    </li>
                    <li className="-option">
                        <a className={selectedClientId.length ? "" : "-disabled-link"} onClick={selectedClientId.length ? handleNotifModalOpen : this._handleDisabledButton}>
                            Clients Notification {selectedClientId && selectedClientId.length > 0 ? <span> &mdash; {selectedClientId.length}</span> : ""}
                        </a>
                    </li>
                    <li className="-option">
                        <a className={selectedClientId.length ? "" : "-disabled-link"} onClick={selectedClientId.length ? handleBulkArchive : this._handleDisabledButton}>
                            Archive Clients {selectedClientId && selectedClientId.length > 0 ? <span> &mdash; {selectedClientId.length}</span> : ""}
                        </a>
                    </li>
                    <li className="-option">
                        <a className={selectedClientId.length ? "" : "-disabled-link"} onClick={selectedClientId.length ? handleAddStaffModalOpen : this._handleDisabledButton}>
                            Assign Staff {selectedClientId && selectedClientId.length > 0 ? <span> &mdash; {selectedClientId.length}</span> : ""}
                        </a>
                    </li>
                </ul>
                :
                viewingAs === "client-list-archived" ? 
                <ul className="dropMenu -options-menu" style={{ minWidth: "180px" }}>
                    <li className="-option" style={{ borderBottom: "1px solid #ddd" }}>
                        <Link to={`/firm/${match.params.firmId}/clients`}>View Clients</Link>
                    </li>
                    <li className="-option">
                        <a className={selectedClientId.length ? "" : "-disabled-link"} onClick={selectedClientId.length ? () => handleBulkAction("visible") : this._handleDisabledButton}>
                            Reinstate Clients {selectedClientId && selectedClientId.length > 0 ? <span> &mdash; {selectedClientId.length}</span> : ""}
                        </a>
                    </li>
                    <li className="-option">
                        <a className={selectedClientId.length ? "" : "-disabled-link"} onClick={selectedClientId.length ? handleShowDeleteClientModal : this._handleDisabledButton}>
                            Delete Clients {selectedClientId && selectedClientId.length > 0 ? <span> &mdash; {selectedClientId.length}</span> : ""}
                        </a>
                    </li>
                </ul>
                :
                viewingAs === "request-task-quick-view" ?
                <ul className="dropMenu -options-menu">
                    <li className="-option">
                        <a className={requestTask && requestTask._returnedFiles.length ? "" : "-disabled-link"} onClick={requestTask && requestTask._returnedFiles.length ? handleDownLoadAllFiles : this._handleDisabledButton}>
                            Download All Files
                        </a>
                    </li>
                    {
                        isStaff ?
                        <li className="-option">
                            <a className={!(requestTask.status !== "published" || submitting) ? "" : "-disabled-link"} onClick={!(requestTask.status !== "published" || submitting) ? () => handleUpdateStatus("completed") : this._handleDisabledButton}>
                                Complete
                            </a>
                        </li> : null
                    }
                    {
                        isStaff ?
                        <li className="-option">
                            <a className={!(requestTask.status !== "unpublished" || submitting) ? "" : "-disabled-link"} onClick={!(requestTask.status !== "unpublished" || submitting) ? () => handleUpdateStatus("published") : this._handleDisabledButton}>
                                Publish
                            </a>
                        </li> : null
                    }
                </ul>
                :
                viewingAs === "recycle-bin-list" ?
                <ul className="dropMenu -options-menu">
                    <li className="-option">
                        <a className={selectedFileIds && selectedFileIds.length ? "" : "-disabled-link"} onClick={selectedFileIds && selectedFileIds.length ? handleBulkRestoreFiles : this._handleDisabledButton}>
                            Restore {preffixCount}
                        </a>
                    </li>
                </ul>
                :
                viewingAs === "client-contact-list" ?
                <ul className="dropMenu -options-menu">
                    {
                        archived ?
                        <li className="-option" style={{ borderBottom: "1px solid #ddd" }}>
                            <Link to={`/firm/${match.params.firmId}/clients/${match.params.clientId}/contacts`}>View Contacts</Link>
                        </li> : null
                    }
                    {
                        !archived ?
                        <li className="-option" style={{ borderBottom: "1px solid #ddd" }}>
                            <Link to={`/firm/${match.params.firmId}/clients/${match.params.clientId}/contacts/archived`}>View Archive</Link>
                        </li> : null
                    }
                    {
                        !archived ?
                        <li className="-option">
                            <Link to={`/firm/${match.params.firmId}/clients/${match.params.clientId}/contacts/invite`}>Add Contacts</Link>
                        </li> : null
                    }
                    {
                        !archived ?
                        <li className="-option">
                            <a className={selectedClientUserId.length ? "" : "-disabled-link"} onClick={selectedClientUserId.length ? () => handleBulkArchiveClientUser("archived") : this._handleDisabledButton}>
                                Archive Contacts {selectedClientUserId && selectedClientUserId.length > 0 ? <span> &mdash; {selectedClientUserId.length}</span> : ""}
                            </a>
                        </li> : null
                    }
                    <li className="-option">
                        <a className={selectedClientUserId.length ? "" : "-disabled-link"} onClick={selectedClientUserId.length ? toggleAlertModal : this._handleDisabledButton}>
                            Remove from Client {selectedClientUserId && selectedClientUserId.length > 0 ? <span> &mdash; {selectedClientUserId.length}</span> : ""}
                        </a>
                    </li>
                    {
                        archived ?
                        <li className="-option">
                            <a className={selectedClientUserId.length ? "" : "-disabled-link"} onClick={selectedClientUserId.length ? () => handleBulkArchiveClientUser("active") : this._handleDisabledButton}>
                                Reinstate Contacts {selectedClientUserId && selectedClientUserId.length > 0 ? <span> &mdash; {selectedClientUserId.length}</span> : ""}
                            </a>
                        </li> : null
                    }
                    {
                        archived ?
                        <li className="-option">
                            <a className={selectedClientUserId.length ? "" : "-disabled-link"} onClick={selectedClientUserId.length ? toggleAlertModal : this._handleDisabledButton}>
                                Delete Contacts {selectedClientUserId && selectedClientUserId.length > 0 ? <span> &mdash; {selectedClientUserId.length}</span> : ""}
                            </a>
                        </li> : null
                    }
                </ul>
                :
                viewingAs === "client-staffclient-list" ?
                <ul className="dropMenu -options-menu">
                    <li className="-option">
                        <a onClick={handleOpenAddStaffModal}>
                            Add Staff
                        </a>
                    </li>
                </ul>
                :
                viewingAs === "firm-staff-member-list" ?
                <ul className="dropMenu -options-menu">
                    <li className="-option">
                        <a onClick={handleNewStaff}>
                            Create New Staff
                        </a>
                    </li>
                    <li className="-option">
                        <Link to={`/firm/${match.params.firmId}/settings/staff/import`}>
                            Bulk staff upload
                        </Link>
                    </li>
                </ul>
                :
                viewingAs === "tag-list" ?
                <ul className="dropMenu -options-menu">
                    <li className="-option">
                        <a onClick={handleShowNewTagModal}>
                            Create New Tag
                        </a>
                    </li>
                </ul>
                :
                viewingAs === "folder-template-list" ? 
                <ul className="dropMenu -options-menu">
                    <li className="-option">
                        <Link to={`/firm/${match.params.firmId}/settings/folder-templates/new`}>
                            Create New Template
                        </Link>
                    </li>
                </ul>
                :
                viewingAs === "portal-file-list" ? 
                <ul className="dropMenu -options-menu">
                    <li className="-option" style={ selectedFirm && selectedFirm.allowCreateFolder ? {} : { borderBottom: "1px solid #ddd" }}>
                        <a onClick={handleOpenUploadModal}>
                            Upload New Files
                        </a>
                    </li>
                    {
                        selectedFirm && selectedFirm.allowCreateFolder ?
                        <li className="-option" style={{ borderBottom: "1px solid #ddd" }}>
                            <a onClick={handleOpenFolderModal}>
                                New Folder
                            </a>
                        </li> : null
                    }
                    <li className="-option">
                        <a className={selectedFileIds.length ? "" : "-disabled-link"} onClick={selectedFileIds.length ? handleDownloadFiles : this._handleDisabledButton} >
                            Download {selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null}
                        </a>
                    </li>
                    {
                        selectedFirm && selectedFirm.allowDeleteFiles ? 
                        <li  className="-option">
                            <a className={selectedFileIds.length ? "" : "-disabled-link"} onClick={selectedFileIds.length ? handleDeleteFiles : this._handleDisabledButton}>
                                Delete {preffixCount}
                            </a>
                        </li> : null
                    }
                </ul>
                :
                null
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
  , viewingAs: PropTypes.string
}

FileListOptions.defaultProps = {

}

export default withRouter(FileListOptions);