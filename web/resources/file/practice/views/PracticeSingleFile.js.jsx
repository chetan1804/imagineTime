/**
 * View component for /files/:fileId
 *
 * Displays a single file from the 'byId' map in the file reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third party libraries
import classNames from 'classnames';
import Select from 'react-select'; 
import { DateTime } from 'luxon';
import { Helmet } from 'react-helmet';
import print from 'print-js'
import ReactTooltip from 'react-tooltip';

// import actions
import * as clientActions from '../../../client/clientActions';
import * as clientNoteActions from '../../../clientNote/clientNoteActions';
import * as fileActions from '../../fileActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';
import * as tagActions from '../../../tag/tagActions';
import * as noteActions from '../../../note/noteActions';
import * as userActions from '../../../user/userActions';
import * as fileActivityActions from '../../../fileActivity/fileActivityActions';
import * as folderActions from '../../../folder/folderActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import ProfilePic from '../../../../global/components/navigation/ProfilePic.js.jsx';
import { SelectFromArray, SelectFromObject, TextInput } from '../../../../global/components/forms';
import DeletedRecords from '../../../../global/components/helpers/DeletedRecords.js.jsx';
import Pdftron from '../../../../global/components/helpers/Pdftron.js.jsx';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';

// import resource components
import PreviewFile from '../../components/PreviewFile.js.jsx';
import FileActivityListItem  from '../../../activity/components/fileActivityListItem.js.jsx';
import FileVersionListModal from '../../components/FileVersionListModal.js.jsx';

// import note things 
import NewClientNoteInput from '../../../clientNote/components/NewClientNoteInput.js.jsx';
import ClientNoteItem from '../../../clientNote/components/ClientNoteItem.js.jsx';
import NewNoteInput from '../../../note/components/NewNoteInput.js.jsx';
import NoteItem from '../../../note/components/NoteItem.js.jsx';

// import modals
import ShareMultipleFilesModal from '../../../shareLink/practice/components/ShareMultipleFilesModal.js.jsx';
import CreateQuickTaskModal from '../../../quickTask/practice/components/CreateQuickTaskModal.js.jsx';
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';

// import utilities
import { fileUtils, permissions, routeUtils, validationUtils, displayUtils } from '../../../../global/utils';

class PracticeSingleFile extends Binder {
  constructor(props) {
    super(props);
    // console.log(this.props.match);
    this.state = {
      changeFilename: false
      , changeFileStatus: false
      , clientId: null
      , createQuickTaskModalOpen:  false
      , fileListArgsObj: null
      , isAddingComment: false
      , newFilename: ''
      , selectedFileIds: [this.props.match.params.fileId]
      , showSideBar: true
      , shareFilesModalOpen: false 
      , status: null
      , viewing: this.props.match.params.clientId ? 'comments' : 'notes'
      , showAlertModal: false 
      , url: this.props.match.url
      , isFilenameValid: true
      , tmp: null
      , selectedAssociatedClient: ''
      , showFileVersionList: false
      , page: ''
      , per: ''
      , triggerRefresh: false
      , iframeKey: 0
      , editPdf: false
      , selectedFileData: null
      , isPrintLoading: false
      , tab: ''
      , parentFolder: {}
    }
    this._bind(
      '_handleFormChange'
      , '_handleNewClientNote'
      , '_handleNewNote'
      , '_handleSelectedTagsChange'
      , '_handleSelectFile'
      , '_handleUpdateFilename'
      , '_saveStatusChange'
      , '_toggleAlertModal'
      , '_toggleUpdateFilename'
      , '_sendDeleteFile'
      , '_handleMoveFile'
      , '_handlePrintFile'
      , '_handleRefreshIframe'
      , '_handleEditPdf'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match, socket, location } = this.props;
    const query = new URLSearchParams(location.search);
    this.setState({ page: query.get('page'), per: query.get('per'), tab: query.get('tab') })

    socket.on('connect', () => {
      // console.log('socket connected!!!');
      if(loggedInUser && loggedInUser._id) {
        // console.log('subscribing to userid');
        socket.emit('subscribe', loggedInUser._id);
      }
    })

    socket.on('disconnect', reason => {
      // console.log('socket disconnected!!!');
      // console.log(reason);
      socket.open();
    })

    socket.on('receive_file_activity', fileActivity => {
      if (fileActivity) {
        const fileActivityArgs = {
          _firm:  match.params.firmId
          , _client: match.params.clientId || 'null'
          , _user: loggedInUser._id
          , action: "get-viewed-log"
        }
        dispatch(fileActivityActions.addFileActivityToList(fileActivity, ...routeUtils.listArgsFromObject(fileActivityArgs)));

        if (match.params.clientId) {
          dispatch(fileActivityActions.fetchNewFileActivityList({ fileActivity, success: true }, ['_firm', match.params.firmId, '_client', match.params.clientId, '_file', match.params.fileId]));
          dispatch(fileActivityActions.fetchNewFileActivityList({ fileActivity, success: true }, ['_client', match.params.clientId]));
          dispatch(fileActivityActions.fetchListIfNeeded('_firm', match.params.firmId, '_client', match.params.clientId, '_file', match.params.fileId)).then(json => {
            this.setState({ tmp: fileActivity });
          });
        } else {
          dispatch(fileActivityActions.fetchNewFileActivityList({ fileActivity, success: true }, ['_firm', match.params.firmId, '_file', match.params.fileId]));
          dispatch(fileActivityActions.fetchListIfNeeded('_firm', match.params.firmId, '_file', match.params.fileId)).then(json => {
            this.setState({ tmp: fileActivity });
          });
        }
      }
   });
   
   socket.on('upload_finished', (file) => {
    console.log("WTF---->", file)
    this.setState({ selectedFileData: file[0] });
   })

   dispatch(fileActivityActions.fetchListIfNeeded('_firm', match.params.firmId, '_file', match.params.fileId));
   dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
   dispatch(fileActions.fetchSingleFileById(match.params.fileId));
   dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal
   dispatch(clientNoteActions.fetchListIfNeeded('_file', match.params.fileId));
   dispatch(noteActions.fetchListIfNeeded('_file', match.params.fileId));
   dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
   dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
   dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
   dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches contacts 
   dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
   dispatch(tagActions.fetchListIfNeeded('~firm', match.params.firmId));
   dispatch(tagActions.fetchDefaultTag()); 
   dispatch(tagActions.setQuery('', '~firm', match.params.firmId));

   dispatch(clientActions.fetchListIfNeeded('_firm', match.params.firmId, 'status', 'visible'));
   if (match.params.clientId) {
     dispatch(clientActions.fetchSingleClientById(match.params.clientId));
   }
   if(match.params.folderId) {
    //get the parent folder details;
    dispatch(folderActions.fetchSingleFolderById(match.params.folderId)).then(json => {
      console.log("json json", json);
      if(json && json.success && json.item) {
        console.log('json.item', json);
        this.setState({
          parentFolder: json.item
        })
      }
    })
   } 
  }

  componentWillReceiveProps(nextProps) {
    console.log('componentWillReceiveProps', nextProps, this.props)
    const { dispatch, match } = this.props;

    if (nextProps && nextProps.match && nextProps.match.params && nextProps.match.params.fileId && match && match.params && match.params.fileId && nextProps.match.params.fileId != match.params.fileId) {
      dispatch(fileActivityActions.fetchListIfNeeded('_firm', match.params.firmId, '_file', nextProps.match.params.fileId));
      dispatch(fileActions.fetchSingleFileById(nextProps.match.params.fileId));
      dispatch(clientNoteActions.fetchListIfNeeded('_file', nextProps.match.params.fileId));
      dispatch(noteActions.fetchListIfNeeded('_file', nextProps.match.params.fileId));
    }
  }

  _handleSelectFile(fileId) {
    let newFileIds = _.cloneDeep(this.state.selectedFileIds);
    if(newFileIds.indexOf(fileId) === -1) {
      newFileIds.push(fileId)
    } else {
      newFileIds.splice(newFileIds.indexOf(fileId), 1);
    }
    this.setState({
      selectedFileIds: newFileIds
    })
  }

  _handleNewClientNote(clientNoteId) {
    const { dispatch, match } = this.props;
    if(clientNoteId) {
      dispatch(clientNoteActions.addClientNoteToList(clientNoteId, '_file', match.params.fileId))
    }
    this.setState({
      isAddingComment: false
    });
  }

  _handleNewNote(noteId) {
    const { dispatch, match } = this.props;
    if(noteId) {
      dispatch(noteActions.addNoteToList(noteId, '_file', match.params.fileId))
    }
    this.setState({
      isAddingComment: false
    });
  }

  _handleSelectedTagsChange(e) {
    const newFile = _.cloneDeep(this.props.fileStore.selected.getItem()); 
    newFile._tags = e.map((tag => tag.value)); 
    // console.log(newFile); 
    this.props.dispatch(fileActions.sendUpdateFile(newFile));
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState)

    if(e.target.name === "newFilename") {
      if(!validationUtils.checkFilenameIsValid(e.target.value)) {
        this.setState({ isFilenameValid: false });
        console.log("filename is invalid");
      } else {
        this.setState({ isFilenameValid: true });
        console.log("filename is valid");
      }
    }
  }

  _saveStatusChange() {
    if(!this.state.status) {
      alert("You must select a status");
    } else {
      const { dispatch, fileStore } = this.props;
      let file = _.cloneDeep(fileStore.selected.getItem());
      file.status = this.state.status;
      dispatch(fileActions.sendUpdateFile(file)).then((action) => {
        if(action.success) {
          this.setState({
            changeFileStatus: false
            , status: null
          });
        } else {
          // console.log("Response Error:");
          // console.log(action);
          alert(`ERROR: ${action.error}`);
        }
      });
    }
  }

  _toggleUpdateFilename() {
    const file = this.props.fileStore.selected.getItem();
    // preserve the fileExtension by removing it from the filename here. We'll add it back when they save.
    const baseFilename = file.filename.slice(0, file.filename.indexOf(file.fileExtension))
    
    this.setState({
      changeFilename: !this.state.changeFilename
      , newFilename: baseFilename
      , isFilenameValid: true
    })
  }

  _handleUpdateFilename() {
    if(!this.state.isFilenameValid) return;

    const { newFilename } = this.state;
    const { dispatch, fileStore } = this.props;
    let file = _.cloneDeep(fileStore.selected.getItem());
    // Add the fileExtension back to the filename.
    file.filename = newFilename + file.fileExtension;

    dispatch(fileActions.sendUpdateFile(file)).then((action) => {
      if(action.success) {
        this.setState({
          changeFilename: false
          , newFilename: ''
        });
      } else {
        alert(`ERROR: ${action.error}`);
      }
    });
  }

  _toggleAlertModal() {
    this.setState({showAlertModal: !this.state.showAlertModal}); 
  }

  _sendDeleteFile() {
    const { dispatch, fileStore, history, match, fileListArgs } = this.props; 
    const selectedFile = fileStore.selected.getItem();
    dispatch(fileActions.sendDelete(selectedFile._id)).then(fileRes => {
      if(fileRes.success) {
        // Redirect them back to the file list that they came from by removing the fileId from the url.
        history.push(`${match.url.substring(0, match.url.indexOf(`/${fileRes.id}`))}`)
      } else {
        alert('An error occured. Unable to delete file. Please refresh the page and try again.')
      }
    });
  }

  _handleMoveFile(e) {
    const { fileStore, dispatch, match, history  } = this.props; 
    const newFile = _.cloneDeep(fileStore.selected.getItem()); 
    newFile._client = e.value; 
    if (newFile._personal) {
      newFile._personal = null;
    }
    dispatch(fileActions.sendUpdateFile(newFile)).then(fileRes => {
      if (fileRes.success) {
        history.push(`${match.url.substring(0, match.url.indexOf(`/${fileRes.id}`))}`)
      }
    })
    this.setState({ selectedAssociatedClient: e.value })
  }

  _groupActivitiesByDate(activityListItems) {
    const dates = activityListItems.map(activity => DateTime.fromISO(activity.created_at).toISODate())
    let activitiesGroupedByDate = {};
    // Create an array for each date.
    dates.forEach(date => activitiesGroupedByDate[date] = [])
    // push all activities to their respective date arrays.
    activityListItems.forEach(activity => activitiesGroupedByDate[DateTime.fromISO(activity.created_at).toISODate()].push(activity))
    return activitiesGroupedByDate;
  }

  _filterListByDate(activityList) {
    const { selectedDate } = this.state;
    let newActivityList;
    if(selectedDate) {
      // Filter out activities newer than the selected date. Ignore the time and only compare dates.
      // We were not zeroing milliseconds which was excluding activites with a date equal to selectedDate. It works correctly now.
      newActivityList = activityList.filter(activity => new Date(activity.created_at).setHours(0, 0, 0, 0) <= selectedDate.setHours(0, 0, 0, 0));
    } else {
      newActivityList = _.cloneDeep(activityList);
    }
    return newActivityList;
  }

  _handlePrintFile() {
    const { fileStore } = this.props;

    const selectedFile = fileStore.selected.getItem();
    const tmpThis = this;

    if(selectedFile && 
      selectedFile.fileExtension && 
      (selectedFile.fileExtension.toLowerCase() == '.pdf' || 
      ['.jpg', '.png', '.jpeg'].includes(selectedFile.fileExtension.toLowerCase()) )) {

        const url = fileUtils.getDownloadLink(selectedFile);
        print({
          printable: url,
          type: selectedFile.fileExtension.toLowerCase() == '.pdf' ? 'pdf' : 'image',
          onLoadingStart() {
            tmpThis.setState({ isPrintLoading: true });
          },
          onLoadingEnd() {
            tmpThis.setState({ isPrintLoading: false });
          }
        })
      } else if (selectedFile && selectedFile.fileExtension.indexOf('doc') > -1) {
        const url = `${fileUtils.getDownloadLink(selectedFile)}?userLevel=staffclient&type=viewed&viewingas=PDFFormat`
        print({
          printable: url,
          type: 'pdf',
          onLoadingStart() {
            tmpThis.setState({ isPrintLoading: true });
          },
          onLoadingEnd() {
            tmpThis.setState({ isPrintLoading: false });
          }
        })
      }
  }

  _handleRefreshIframe() {
    this.setState({iframeKey: this.state.iframeKey + 1});
  }

  _handleEditPdf(status) {
    this.setState({ editPdf: status })
  }

  render() {
    const { 
      clientStore 
      , clientNoteStore
      , fileStore
      , firmStore 
      , loggedInUser
      , match
      , noteStore
      , staffClientListItems
      , userMap
      , tagStore 
      , staffStore
      , location
      , fileActivityStore
      , clientUserStore
      , dispatch
      , folderStore
    } = this.props;
    const { page, per, showSideBar, showAlertModal, isFilenameValid, url, selectedAssociatedClient, showFileVersionList, editPdf, selectedFileData
      , isPrintLoading, parentFolder } = this.state;

    /**
     * use the selected.getItem() utility to pull the actual file object from the map
     */
    const selectedFile = selectedFileData ? selectedFileData : fileStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();
    const selectedClient = clientStore.selected.getItem();
    let textErrorDisplay = null;

    if (selectedFile && selectedFile._client && clientStore.byId[selectedFile._client] && clientStore.byId[selectedFile._client].status === 'deleted') {
      textErrorDisplay = 'The client has been deleted.';
    } else if (selectedFile && selectedFile._client && match.params.clientId && selectedFile._client != match.params.clientId) {
      textErrorDisplay = 'The file is not associated with this client.';
    } else if (selectedFile && selectedFile._client && !clientStore.byId[selectedFile._client]) {
      textErrorDisplay = "Hmm.  Something's wrong here.";
    } else if (selectedFile && selectedFile.status === 'deleted') {
      textErrorDisplay = 'The file has been deleted.';
    }
    
    const fileTags = selectedFile && selectedFile._tags ? selectedFile._tags.map(tagId => tagStore.byId[tagId] || '') : []
    const loggedInStaff = staffStore.loggedInByFirm[selectedFirm && selectedFirm._id] ? staffStore.loggedInByFirm[selectedFirm._id].staff : {};

    const clientNoteList = clientNoteStore.lists && clientNoteStore.lists._file ? clientNoteStore.lists._file[match.params.fileId] : null;
    const clientNoteListItems = clientNoteStore.util.getList('_file', match.params.fileId);  

    const noteList = noteStore.lists && noteStore.lists._file ? noteStore.lists._file[match.params.fileId] : null;
    const noteListItems = noteStore.util.getList('_file', match.params.fileId);  

    const clients = clientStore.util.getList('_firm', match.params.firmId, 'status', 'visible'); 
    const utilClientStore = clientStore.util.getSelectedStore('_firm', match.params.firmId, 'status', 'visible');
    const isFirmStaff = permissions.isStaff(staffStore, loggedInUser, match.params.firmId);
    const filenameErrorMessage = `A filename can't containt any of the following characters: \ / : * ? " < > |`;
    
    // file activity
    const activityListItems = selectedFile && fileActivityStore ? fileActivityStore.util.getList('_firm', match.params.firmId, '_file', selectedFile._id) : null;
    const filteredActivityListItems = activityListItems ? this._filterListByDate(activityListItems) : [];
    const filesActivitiesGroupedByDate = filteredActivityListItems ? this._groupActivitiesByDate(filteredActivityListItems) : [];
    const icon = selectedFile ? displayUtils.getFileIcon(selectedFile.category, selectedFile.contentType, selectedFile) : null;

    let options = []; 
    let clientOptions = []; 
    if (clients) {
      for (const client of clients) {
        if(client && client._id) {
          if (client.status === "visible") {
            let newObj = {
              value: client._id
              , label: client.name
            }
            options.push(newObj);
          }
        }
      }  
    }

    const allTags = tagStore.util.getList('~firm', match.params.firmId) || []

    for (const tag of allTags) {
      let newObj = {
        value: tag._id
        , label: tag.name
      }
      clientOptions.push(newObj); 
    }

    let selectedTags = []; 
    for (const tag of fileTags) {
      let newTag = {
        value: tag._id
        , label: tag.name
      }
      selectedTags.push(newTag); 
    }

    const isEmpty = (
      fileStore.selected.didInvalidate
      || !selectedFirm
      || !selectedFirm._id
      || firmStore.selected.didInvalidate
      || !utilClientStore
      || utilClientStore.didInvalidate
      || utilClientStore.isFetching
    );

    const isFetching = (
      fileStore.selected.isFetching
      || firmStore.selected.isFetching
      || !noteList
      || noteList.isFetching
      || !clientNoteList 
      || clientNoteList.isFetching
      || !utilClientStore
      || utilClientStore.isFetching
    )

    const sideBarClass = classNames(
      'file-preview-sidebar'
      , { '-hidden': !showSideBar }
    )

    const previewClass = classNames(
      'file-preview-container'
      , { '-with-sidebar': showSideBar }
    )

    const sideMenuClass = classNames(
      "-sidebar-menu"
      , { '-open': showSideBar }
    )

    let fileStatus = classNames(
      'status-pill -file'
      , selectedFile ? selectedFile.status : null 
    )

    const defaultTargetLink = url.substring(0, url.lastIndexOf("/"));
    const prevPath = location ? location.state ? location.state.viewingAs === "quickView" ? location.state.prevPath : null : null : null;
    const exitTargetLink = prevPath ? prevPath : page && per ? url.replace(`/${match.params.fileId}`, `?page=${page}&per=${per}`) : url.substring(0, url.lastIndexOf("/"));
    let goBackActivity;
    if (this.state.tab === 'activity') {
      const fileUrl = url.substring(0, url.lastIndexOf('file'))
      goBackActivity = `${fileUrl}activity`
    }
    
    if(selectedFile && selectedFile.category == 'folder') {
      return (
        <div className="file-preview-layout">
          <div className="-loading-hero hero">
            <div className="u-centerText">
              <div className="loading"></div>
            </div>
          </div>  
        </div>
      );
    }
    
    // let contentType = selectedFile && selectedFile.category != 'folder' && selectedFile.fileExtension && ?
    // selectedFile.fileExtension.toLowerCase().includes('.pdf') ? 'application/pdf' 
    // : selectedFile.fileExtension.toLowerCase().includes('.doc') ? 'doc'
    // : selectedFile ? selectedFile.contentType : ''; 

    let contentType = selectedFile && selectedFile.contentType;
    if (selectedFile && selectedFile.category != 'folder' && selectedFile.fileExtension) {
      if (selectedFile.fileExtension.toLowerCase().indexOf('.pdf') > -1) {
        contentType = 'application/pdf';
      } else if (selectedFile.fileExtension.toLowerCase().indexOf('.doc') > -1) {
        contentType = 'application/doc';
      } else {
        contentType = selectedFile.fileExtension;
      }
    }

    const fileExtension = selectedFile && selectedFile.fileExtension ? selectedFile.fileExtension : "";
    const enablePdftron = selectedFirm && selectedFirm.enable_pdftron;

    const role = permissions.getUserRole(loggedInUser, match.params.firmId, match.params.clientId, staffStore, clientUserStore);
    
    console.log('workspace selected firm', selectedFirm);
    console.log('workspace selected file', selectedFile);
    console.log('workspace parent folder', parentFolder);
    console.log('match params', match.params);
    console.log('this is my role', role);

    return (
      <div className="file-preview-layout">
        <CloseWrapper
          isOpen={isPrintLoading}
          closeAction={() => console.log("isPrintLoading")}
        />
        <Helmet><title>File Preview</title></Helmet>
        {isEmpty || textErrorDisplay ?
            (isFetching ? 
              <div className="-loading-hero hero">
                <div className="u-centerText">
                  <div className="loading"></div>
                </div>
              </div>  
              : 
              textErrorDisplay && <DeletedRecords textErrorDisplay={textErrorDisplay} /> || <DeletedRecords textErrorDisplay='The file has been deleted.' />
            )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className={previewClass}>
              <header className="-header fixed">
                <div className="-header-content">
                  <Link to={goBackActivity ? goBackActivity : exitTargetLink} className="-exit-preview" >
                    <i className="fas fa-arrow-left"></i>
                  </Link>
                  <div className="-file-preview-action">
                    <div className="-preview-title">
                      {/* <img className="-icon" src={} /> */}
                      { selectedFile && selectedFile.filename }
                    </div>
                    <div className="-file-actions u-pullRight">
                      <button 
                        className="yt-btn x-small link info bordered" 
                        onClick={this._handlePrintFile}
                      >
                        <span> Print {isPrintLoading && 'loading...' || ''}</span>
                      </button>
                      <button disabled={selectedFile && selectedFile.status == 'deleted' || selectedFile && selectedFile.status == 'archived'} className="yt-btn x-small info" onClick={() => this.setState({shareFilesModalOpen: true})}>Share </button>
                      {/* <UserClickEvent
                        description="Download File from preview sidebar"
                        eventAction="download"
                        eventType="file"
                        listArgs={['_file', selectedFile._id]}
                        refKey="_file"
                        refId={selectedFile._id}
                      > */}
                      { selectedFirm && loggedInStaff && selectedFirm.eSigAccess && loggedInStaff.eSigAccess && contentType && (contentType.indexOf('pdf') > -1  || contentType.indexOf('doc') > -1 ) ? 
                        <button disabled={selectedFile && selectedFile.status == 'deleted' || selectedFile && selectedFile.status == 'archived'} className="yt-btn x-small" onClick={() => this.setState({createQuickTaskModalOpen: true})}>Request Signature</button>
                        :
                        <button disabled={true} className="yt-btn x-small" onClick={null}><i className="fas fa-lock"/> Request Signature</button>
                      }
                      {
                        permissions.hasPermission(selectedFirm, parentFolder, selectedFile, `${role}Download`) ?
                        <a className="yt-btn x-small link bordered" href={fileUtils.getDownloadLink(selectedFile)+"?userLevel=staffclient&type=downloaded"} download target="_blank">
                          <span> Download</span>
                        </a>
                        :
                        <div className="display-inline-block" data-tip data-for="PSF_DisableDownload">
                          <button disabled={true} className="yt-btn x-small" onClick={null}>
                            <span><i className="fas fa-lock"/>  Download</span>
                          </button>
                          <ReactTooltip id="PSF_DisableDownload" place="left" type="warning" effect="solid">
                            <span className="tooltipMessage">You don't have permission to <br/> download file</span>
                          </ReactTooltip>
                        </div>
                      }

                  </div>
                    {/* </UserClickEvent> */}
                  </div>
                </div>
              </header>
              <div className="-preview-content">
                <div className={sideMenuClass}>
                  {
                    permissions.hasPermission(selectedFirm, parentFolder, selectedFile, `${role}Update`) ?
                    enablePdftron && <div className='-icon' onClick={() => !editPdf ? this._handleEditPdf(true) : this._handleEditPdf(false)}>
                      {editPdf ? <i className="far fa-times-circle fa-lg" /> : <i className="far fa-edit fa-lg" />}
                    </div> : null
                  }
                  <div className="-icon" onClick={() => this.setState({showSideBar: !this.state.showSideBar, viewing: 'comments'})}>
                    { this.state.showSideBar ?
                      <i className="far fa-arrow-to-right fa-lg"/>
                      :
                      <i className="far fa-arrow-from-right fa-lg"/>
                    }
                  </div>
                  {
                    selectedFirm && selectedFirm.fileVersionType === "enable" && selectedFile && selectedFile._id ?
                    <div className="-icon" onClick={() => this.setState({ showFileVersionList: !showFileVersionList })}>
                      <i className="fas fa-copy -active"/>
                    </div>
                    : null
                  }
                  { !this.state.showSideBar ?
                    <div className="-icon" onClick={() => this.setState({showSideBar: !this.state.showSideBar, viewing: 'comments'})}>
                      <i className="far fa-comment-lines fa-lg"/>
                    </div>
                    :
                    null
                  }
                  {
                    (['.doc', '.docx', '.dotx', '.xlsx', '.csv', '.xls'].includes(fileExtension)) ? 
                    <div className="-icon" onClick={this._handleRefreshIframe}>
                      <i className="far fa-redo-alt fa-lg"/>
                    </div> 
                    : 
                    null
                  }
                </div>
                {
                  loggedInStaff && loggedInStaff._id ?
                  editPdf ? 
                  <Pdftron
                    socket={this.props.socket}
                    handleEditPdf={this._handleEditPdf}
                    firmId={match.params.firmId}
                    clientId={match.params.clientId}
                    selectedFile={selectedFile}
                    match={match}
                    dispatch={dispatch}
                    filePath={`${fileUtils.getDownloadLink(selectedFile)}?userLevel=staffclient&type=viewed`} 
                  /> : 
                  <PreviewFile
                    contentType={contentType}
                    filePath={`${fileUtils.getDownloadLink(selectedFile)}?userLevel=staffclient&type=viewed`}
                    isIE={false}
                    file={selectedFile}
                    iframeKey={this.state.iframeKey}
                  />
                  : null
                }
              </div>
            </div>
            <div className={sideBarClass}>
              <div className="tab-bar-nav">
                <ul className="navigation">
                  { selectedClient ?
                    <li>
                      <span className={`action-link ${this.state.viewing === 'comments' ? 'active' : null}`} onClick={() => this.setState({viewing: 'comments'})}>Public Comments</span>
                    </li>
                    :
                    null 
                  }
                  <li>
                    <span className={`action-link ${this.state.viewing === 'notes' ? 'active' : null}`} onClick={() => this.setState({viewing: 'notes'})}>Private Notes</span>
                  </li>
                  <li>
                    <span className={`action-link ${this.state.viewing === 'details' ? 'active' : null}`} onClick={() => this.setState({viewing: 'details'})}>Details</span>
                  </li>
                  {
                    isFirmStaff ?
                    <li>
                      <span className={`action-link ${this.state.viewing === 'activity' ? 'active' : null}`} onClick={() => this.setState({viewing: 'activity'})}>Activity</span>
                    </li> : null
                  }
                {/*                 
                  <li>
                    <span className={`action-link ${this.state.viewing === 'activity' ? 'active' : null}`} onClick={() => this.setState({viewing: 'activity'})}>Activity</span>
                  </li>
                 */}
                </ul>
              </div>
              { this.state.viewing === 'comments' && selectedClient ? 
                <div className="-content">
                  <NewClientNoteInput
                    clientNote={this.props.defaultNote}
                    pointers={{
                      '_file': match.params.fileId
                      , '_firm': match.params.firmId
                      , '_client': match.params.clientId
                    }}
                    onSubmit={this._handleNewClientNote}
                  />
                  <div className="alert-message warning -left -small">
                    <p>
                      <small>
                        <em>NOTE: <strong>Everyone associated with {selectedClient.name}</strong> can see anything posted to this thread. For private notes, click on <span className={`action-link ${this.state.viewing === 'notes' ? 'active' : null}`} onClick={() => this.setState({viewing: 'notes'})}>Private Notes</span></em>
                      </small>
                    </p>
                  </div>
                  <div className="file-preview-note-list">
                    { clientNoteListItems ? 
                      clientNoteListItems.map((clientNote, i) =>
                        <ClientNoteItem 
                          key={`clientNote_${i}_${clientNote._id}`}
                          clientNote={clientNote}
                          user={userMap[clientNote._user]}
                        />
                      )
                      :
                      null
                    }
                  </div>
                </div> 
                : this.state.viewing === 'notes' ? 
                <div className="-content">
                  <NewNoteInput
                    note={this.props.defaultNote}
                    pointers={{
                      '_file': match.params.fileId
                      , '_firm': match.params.firmId
                      , '_client': match.params.clientId
                    }}
                    onSubmit={this._handleNewNote}
                    submitOnEnter={true}
                  />
                  <p>
                    <small>
                    {selectedFile && selectedFile._client ?
                      <em>These notes are private to your firm. If you wish to send a message to your client, please click on <span className={`action-link ${this.state.viewing === 'comments' ? 'active' : null}`} onClick={() => this.setState({viewing: 'comments'})}>Public Comments</span></em>
                      :
                      <em>These notes are private to your firm.</em>
                    }
                      </small>
                  </p>
                  <div className="file-preview-note-list">
                    { noteListItems ?
                      noteListItems.map((note, i) =>
                        <NoteItem 
                          key={`note_${i}_${note._id}`}
                          note={note}
                          user={userMap[note._user]}
                        />
                        
                      )
                      :
                      null
                    }
                  </div>
                </div>
                : this.state.viewing === 'activity' ? 
                <div className="-content">
                    <div style={{ opacity: isFetching ? 0.5 : 1 }}>
                        <div className="-body" >
                            <div className="-user-info" style={{ margin: "1em 0" }}>
                                <span className="-icon">
                                    <img src={`/img/icons/${icon}.png`} style={{ width: "60px" }} />
                                </span>                        
                                <div className="-text" style={{ lineHeight: "1.2" }}>
                                    <Link className="-filename" to={`/firm/${match.params.firmId}/files/${selectedFile && selectedFile._id}`}>
                                        {selectedFile && selectedFile.filename}
                                    </Link>
                                    <br/>
                                    <small>
                                    { userMap[selectedFile && selectedFile._user] ?
                                        <span>by {userMap[selectedFile && selectedFile._user].firstname} {userMap[selectedFile && selectedFile._user].lastname}</span>
                                        :
                                        selectedFile && selectedFile.uploadName ?
                                        <span>by <em>{selectedFile && selectedFile.uploadName} (not logged in)</em></span>
                                        :
                                        null
                                    }
                                    </small>
                                </div>
                            </div>
                            <div className="file-preview-activity-list">
                              { Object.keys(filesActivitiesGroupedByDate).map(key =>
                                  <div key={key} className="activity-day-group">
                                  <div className="-day">
                                      {DateTime.fromISO(key).toFormat('D') == DateTime.local().toFormat('D') ? 
                                      "Today"
                                      :
                                      DateTime.fromISO(key).toFormat('D')
                                      }
                                  </div>
                                  { filesActivitiesGroupedByDate[key].map((activity, i) => 
                                      <FileActivityListItem
                                          key={activity._id + '_' + i}
                                          activity={activity}
                                          loggedInUser={loggedInUser}
                                          user={userMap[activity._user] || {}}
                                          client={clientStore.byId[activity._client] || {}}
                                      />
                                      )
                                  }
                                  </div>
                              )}
                            </div>
                        </div>
                    </div>
                </div>
                :
                <div className="-content">
                  <h4>File details</h4>
                  { this.state.changeFilename ? 
                    <div>
                      <TextInput
                        change={this._handleFormChange}
                        name={'newFilename'}
                        suffix={selectedFile && selectedFile.fileExtension}
                        value={this.state.newFilename}
                      />
                      {
                        !isFilenameValid ? <p style={{margin: "0.3em 0", color: "#FF2900", marginBottom: "16px"}}>{filenameErrorMessage}</p> : ""
                      }
                      <button className="yt-btn x-small link" onClick={this._toggleUpdateFilename}>cancel</button>
                      <button disabled={!isFilenameValid} className="yt-btn x-small success" onClick={this._handleUpdateFilename}>save</button>
                    </div>
                    :
                    <div>
                      <div style={{display: 'inline-block'}}>{selectedFile ? selectedFile && selectedFile.filename : <span className="loading"/>}</div>
                      {
                        permissions.hasPermission(selectedFirm, parentFolder, selectedFile, `${role}Update`) ?
                        <button className="yt-btn x-small link danger" onClick={this._toggleUpdateFilename}>change</button>
                        :
                        null
                      }
                    </div>
                  }
                  <br/>
                  <p>
                    <small className="u-muted">Date Uploaded: </small><br/>
                    {DateTime.fromISO(selectedFile && selectedFile.created_at).toLocaleString(DateTime.DATE_SHORT)}
                  </p>
                  <br/>
                  <p>
                    <small className="u-muted">Uploaded By: </small><br/>
                    { userMap[selectedFile && selectedFile._user] ?
                      `${userMap[selectedFile && selectedFile._user].firstname} ${userMap[selectedFile && selectedFile._user].lastname}`
                      :
                      selectedFile && selectedFile.uploadName ?
                      <em>{selectedFile && selectedFile.uploadName} (not logged in)</em>
                      :
                      'Unknown'
                    }
                  </p>
                  <br/>
                  <p>
                    <small className="u-muted">Type: </small><br/>
                    { selectedFile && selectedFile.category }
                  </p>
                  <br/>
                  <p>
                    <small className="u-muted">Content Type: </small><br/>
                    { selectedFile && selectedFile.contentType }
                  </p>
                  <br/>
                  <p>
                    <small className="u-muted">Tags: </small><br/>
                  </p>
                  <Select 
                    options={clientOptions}
                    isMulti={true}
                    onChange={(e) => this._handleSelectedTagsChange(e)}
                    // onInputChange={(e) => console.log(e)}
                    value={selectedTags}
                    // onCreateOptions={(e) => console.log(e)}
                  />
                  <br/>
                  <div>
                    <small className="u-muted">Associated Client: </small><br/>
                    <Select 
                      // isMulti={true}
                      options={options.sort((a, b) => (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0))}
                      onChange={(e) => this._handleMoveFile(e)}
                      value={selectedAssociatedClient ? options.find(o => o.value == selectedAssociatedClient.value) : options.find(o => o.value == selectedFile && selectedFile._client)}
                      placeholder={selectedClient && selectedClient.name}
                    />
                  </div>
                  <br/>
                  <p><small className="u-muted">Status:</small></p>
                  { this.state.changeFileStatus ?
                    <div>
                      <SelectFromArray
                        items={[
                          'hidden'
                          , 'visible'
                          , 'archived'
                        ]}
                        change={this._handleFormChange}
                        name="status"
                        value={selectedFile && selectedFile.status}
                      />
                      <div>
                        <button className="yt-btn x-small danger link" onClick={()=> this.setState({changeFileStatus: false})}>cancel</button>
                        <button className="yt-btn x-small info" onClick={()=> this._saveStatusChange()}>save</button>
                      </div>
                    </div>
                    :
                    <div>
                      <div className={fileStatus}>{_.startCase(selectedFile && selectedFile.status).toUpperCase()}</div>
                      {
                        permissions.hasPermission(selectedFirm, parentFolder, selectedFile, `${role}Update`) ?
                        <button className="yt-btn x-small link danger" onClick={()=> this.setState({changeFileStatus: true})}>change</button>
                        :
                        null
                      }
                    </div>
                  }
                  <br/>
                  {selectedFile && selectedFile.status == 'archived' ? 
                    <button className="yt-btn x-small danger" onClick={this._toggleAlertModal}>Delete file</button>
                  : null 
                  }
                </div>
              }
            </div>
            <ShareMultipleFilesModal
            /**
             * Allowing multiple files from the single file page doesn't make much sense.
             * Also, if a user is on PracitceSingleFile and they click a filename in the attach files list
             * they are taken to a route that doesn't exist. This fixes that issue.
             */
              allowMultiple={false}
              client={selectedClient ? selectedClient : null}
              close={() => this.setState({shareFilesModalOpen: false})}
              fileListArgsObj={this.state.fileListArgsObj}
              firm={selectedFirm}
              handleSelectFile={this._handleSelectFile}
              isOpen={this.state.shareFilesModalOpen}
              selectedFileIds={this.state.selectedFileIds}
            />
            <CreateQuickTaskModal
              clientId={match.params.clientId || null}
              close={() => this.setState({createQuickTaskModalOpen: false})}
              file={selectedFile}
              firmId={match.params.firmId}
              isOpen={this.state.createQuickTaskModalOpen}
              type={'signature'}
              firm={selectedFirm}
              clientUserStore={clientUserStore}
            />
            <FileVersionListModal
              isOpen={showFileVersionList}
              file={selectedFile}
              close={() => this.setState({ showFileVersionList: !showFileVersionList })}
              allFilesFromListArgs={selectedFile && selectedFile.olderVersions}
              firm={selectedFirm}
            />
            <AlertModal
              alertMessage={"Are you sure? This cannot be undone."}
              alertTitle={"Delete this file?"}
              closeAction={this._toggleAlertModal}
              confirmAction={this._sendDeleteFile}
              confirmText={"Delete"}
              declineAction={this._toggleAlertModal}
              declineText={"Cancel"}
              isOpen={showAlertModal}
              type={'danger'}
            ></AlertModal>
          </div>
        }
      </div>
    )
  }
}

PracticeSingleFile.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {
  const loggedInUser = store.user.loggedIn.user;
  const staffClientStore = store.staffClient;

  const isStaffOwner = permissions.isStaffOwner(store.staff, loggedInUser, props.match.firmId);

  const staffClientListItems = staffClientStore.util.getList('_firm', props.match.params.firmId, '_user', loggedInUser._id, '~staff.status', 'active')

  console.log('store', store);
  return {
    clientStore: store.client
    , clientNoteStore: store.clientNote
    , defaultNote: store.note.defaultItem.obj
    , fileStore: store.file
    , firmStore: store.firm 
    , isStaffOwner
    , loggedInUser
    , noteStore: store.note
    , staffClientListItems
    , staffStore: store.staff 
    , tagStore: store.tag
    , userMap: store.user.byId
    , fileActivityStore: store.fileActivity
    , socket: store.user.socket
    , clientUserStore: store.clientUser
    , folderStore: store.folder
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeSingleFile)
);
