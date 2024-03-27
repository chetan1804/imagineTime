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
import { DateTime } from 'luxon';
import { Helmet } from 'react-helmet';
import print from 'print-js'
import ReactTooltip from 'react-tooltip';

// import actions
import * as clientNoteActions from '../../../clientNote/clientNoteActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as fileActions from '../../fileActions';
import * as tagActions from '../../../tag/tagActions';
import * as userActions from '../../../user/userActions';
import * as fileActivityActions from '../../../fileActivity/fileActivityActions'; 
import * as clientActions from '../../../client/clientActions';
import * as firmActions from '../../../firm/firmActions';
import * as folderActions from '../../../folder/folderActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import ProfilePic from '../../../../global/components/navigation/ProfilePic.js.jsx';
import { TextInput } from '../../../../global/components/forms';
import DeletedRecords from '../../../../global/components/helpers/DeletedRecords.js.jsx';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';

// import utils
import { fileUtils, permissions } from '../../../../global/utils'

// import resource components
import PreviewFile from '../../components/PreviewFile.js.jsx';
import FileVersionListModal from '../../components/FileVersionListModal.js.jsx';

// import NewNoteInput
import NewNoteInput from '../../../note/components/NewNoteInput.js.jsx';
// import note things 
import NewClientNoteInput from '../../../clientNote/components/NewClientNoteInput.js.jsx';
import ClientNoteItem from '../../../clientNote/components/ClientNoteItem.js.jsx';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

class ClientSingleFile extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      changeFilename: true
      , showSideBar: true
      , viewing: 'comments'
      , showFileVersionList: false
      , isPrintLoading: false
      , parentFolder: {}
    }
    this._bind(
      '_handleFormChange'
      , '_handleNewClientNote'
      // , '_handleUpdateFilename'
      // , '_toggleUpdateFilename'
      , '_handlePrintFile'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match, socket } = this.props;

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
        console.log('receive_file_activity', fileActivity)
        dispatch(fileActivityActions.addSingleFileActivityToMap(fileActivity));
        dispatch(fileActivityActions.addFileActivityToList(fileActivity, ...['_client', match.params.clientId, '_user', loggedInUser._id, '_new', true]));
        dispatch(fileActivityActions.fetchListIfNeeded('_client', match.params.clientId, '_user', loggedInUser._id, '_new', true));
      }
    });

    /**
     * add this to each portal view 
     */
    dispatch(clientUserActions.fetchClientUserLoggedInByClientIfNeeded(match.params.clientId));
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
    dispatch(fileActions.fetchSingleIfNeeded(match.params.fileId)).then(fileRes => {
      if(fileRes.success) {
        const file = fileRes.item;
        dispatch(firmActions.fetchSingleIfNeeded(file._firm));
        if(file.status === 'hidden' || file.status === 'deleted' || file.status === 'archived') {
          // The client isn't allowed to view files with these statuses. Invalidate it and they'll just get the "No file found..." message.
          dispatch(fileActions.invalidateSelected());
        } else {
          // Fetch all users by dedicated api route so we can populate the comments with userMap.
          // This should work from the portal side and the firm side.
          dispatch(userActions.fetchListIfNeeded('_firmStaff', file._firm))
          dispatch(userActions.fetchListIfNeeded('_client', file._client))
        }

        //get file's parent folder permission
        if(!!file._folder) {
          dispatch(folderActions.fetchSingleFolderById(file._folder)).then(json => {
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
    });
    dispatch(clientNoteActions.fetchListIfNeeded('_file', match.params.fileId));
    //dispatch(tagActions.fetchListIfNeeded('all'))
  }

  componentWillReceiveProps(nextProps) {
    console.log('componentWillReceiveProps', nextProps, this.props)
    const { dispatch, match } = this.props;

    if (nextProps && nextProps.match && nextProps.match.params && nextProps.match.params.fileId && match && match.params && match.params.fileId && nextProps.match.params.fileId != match.params.fileId) {
      dispatch(fileActions.fetchSingleIfNeeded(nextProps.match.params.fileId)).then(fileRes => {
        if(fileRes.success) {
          const file = fileRes.item;
          if(file.status === 'hidden' || file.status === 'deleted' || file.status === 'archived') {
            // The client isn't allowed to view files with these statuses. Invalidate it and they'll just get the "No file found..." message.
            dispatch(fileActions.invalidateSelected());
          }
        }
      });
      dispatch(clientNoteActions.fetchListIfNeeded('_file', nextProps.match.params.fileId));
    }
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState)
  }

  _handleNewClientNote(clientNoteId) {
    const { dispatch, match } = this.props;
    if(clientNoteId) {
      dispatch(clientNoteActions.addClientNoteToList(clientNoteId, '_file', match.params.fileId))
    }
  }

  // Uncomment below to allow client file renaming.

  // _toggleUpdateFilename() {
  //   const file = this.props.fileStore.selected.getItem();
  //   // preserve the fileExtension by removing it from the filename here. We'll add it back when they save.
  //   const baseFilename = file.filename.slice(0, file.filename.indexOf(file.fileExtension))
    
  //   this.setState({
  //     changeFilename: !this.state.changeFilename
  //     , newFilename: baseFilename
  //   })
  // }

  // _handleUpdateFilename() {
  //   const { newFilename } = this.state;
  //   const { dispatch, fileStore } = this.props;
  //   let file = _.cloneDeep(fileStore.selected.getItem());
  //   // Add the fileExtension back to the filename.
  //   file.filename = newFilename + file.fileExtension;

  //   dispatch(fileActions.sendUpdateFile(file)).then((action) => {
  //     if(action.success) {
  //       this.setState({
  //         changeFilename: false
  //         , newFilename: ''
  //       });
  //     } else {
  //       alert(`ERROR: ${action.error}`);
  //     }
  //   });
  // }
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
        const url = `${fileUtils.getDownloadLink(selectedFile)}?userLevel=clientuser&type=viewed&viewingas=PDFFormat`
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

  render() {
    const {  
      clientNoteStore
      , fileStore
      , match
      , userMap
      , tagStore 
      , clientStore
      , firmStore
      , staffStore
      , clientUserStore
      , loggedInUser
    } = this.props;
    const { showSideBar, showFileVersionList, isPrintLoading, parentFolder } = this.state;
    /**
     * use the selected.getItem() utility to pull the actual file object from the map
     */
    const selectedFile = fileStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();
    const fileTags = selectedFile && selectedFile._tags ? selectedFile._tags.map(tagId => tagStore.byId[tagId] || '') : []
    const clientNoteList = clientNoteStore.lists && clientNoteStore.lists._file ? clientNoteStore.lists._file[match.params.fileId] : null;
    const clientNoteListItems = clientNoteStore.util.getList('_file', match.params.fileId);   
    
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

    // console.log(clientNoteListItems);
    // console.log(clientNoteList);
    const isEmpty = (
      !selectedFile
      || !selectedFile._id
      || fileStore.selected.didInvalidate
      || clientStore.selected.didInvalidate
      || !selectedFirm
      || !selectedFirm._id
      || firmStore.selected.didInvalidate
    );

    const isFetching = (
      fileStore.selected.isFetching
      || !clientNoteList
      || clientNoteList.isFetching
      || clientStore.selected.isFetching
      || firmStore.selected.isFetching
    )
    
    console.log('isFetchingisFetchingisFetching', fileStore.selected.isFetching
      , !clientNoteList
      , clientNoteList && clientNoteList.isFetching
      , clientStore.selected.isFetching)

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

    const targetExitLocation = !selectedFile || !selectedFile._folder ? match.url.substring(0, match.url.lastIndexOf('/'))
      : `/portal/${match.params.clientId}/files/folder/${selectedFile._folder}`; 


    const role = (selectedFile && selectedFile._id) ? permissions.getUserRole(loggedInUser, selectedFile._firm, selectedFile._client, staffStore, clientUserStore) : '';

    console.log('role', role);
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
                  <Link className="-exit-preview" to={targetExitLocation} >
                    <i className="fas fa-arrow-left"></i>
                  </Link>
                  <div className="-preview-title">
                    {/* <img className="-icon" src={} /> */}
                    { selectedFile.filename }
                  </div>
                  <div className="-file-actions">
                    { selectedFile.status == 'locked' ?
                    <div>
                      <button 
                        disabled={true}
                        className="yt-btn x-small link info bordered" 
                        // onClick={this._handlePrintFile}
                      >
                        <span> Print {isPrintLoading && 'loading...' || ''}</span>
                      </button>
                      {
                        permissions.hasPermission(selectedFirm, parentFolder, selectedFile, `${role}Download`) ?
                        <button className="yt-btn  x-small link bordered" disabled={true}>
                          <span> Download</span>
                        </button>
                        :
                        <div className="display-inline-block" data-tip data-for="CSF_DisableDownload">
                          <button disabled={true} className="yt-btn x-small" onClick={null}>
                            <span><i className="fas fa-lock"/> Download</span>
                          </button>
                          <ReactTooltip id="CSF_DisableDownload" place="left" type="warning" effect="solid">
                            <span className="tooltipMessage">You don't have permission to <br/> download file</span>
                          </ReactTooltip>                        
                        </div>
                      }
                    </div>  
                    : 
                    <div>
                      <button 
                        className="yt-btn x-small link info bordered" 
                        onClick={this._handlePrintFile}
                      >
                        <span> Print {isPrintLoading && 'loading...' || ''}</span>
                      </button>
                      {
                        permissions.hasPermission(selectedFirm, parentFolder, selectedFile, `${role}Download`) ?
                        <a className="yt-btn x-small link bordered" href={fileUtils.getDownloadLink(selectedFile)+"?userLevel=clientuser&type=downloaded"} download target="_blank">
                          <span> Download</span>
                        </a>
                        :
                        <div className="display-inline-block" data-tip data-for="CSF_DisableDownload">
                          <button disabled={true} className="yt-btn x-small" onClick={null}>
                            <span><i className="fas fa-lock"/> Download</span>
                          </button>
                          <ReactTooltip id="CSF_DisableDownload" place="left" type="warning" effect="solid">
                            <span className="tooltipMessage">You don't have permission to <br/> download file</span>
                          </ReactTooltip>                        
                        </div>
                      }
                    </div> 
                    }
                  </div>
                </div>
              </header>
              <div className="-preview-content">
                <div className={sideMenuClass}>
                  <div className="-icon" onClick={() => this.setState({showSideBar: !this.state.showSideBar, viewing: 'comments'})}>
                    { this.state.showSideBar ?
                      <i className="far fa-arrow-to-right fa-lg"/>
                      :
                      <i className="far fa-arrow-from-right fa-lg"/>
                    }
                  </div>
                  {
                    selectedFirm && selectedFirm.fileVersionType === "enable" && selectedFile && selectedFile.olderVersions && selectedFile.olderVersions.length > 1 ?
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
                </div>
                { selectedFile.status == 'locked' ? 
                  <div className="-icon">
                    <img src={brandingName.image.locked_file} />
                  </div>
                  :
                  <PreviewFile
                    contentType={selectedFile.contentType}
                    filePath={`${fileUtils.getDownloadLink(selectedFile)}?userLevel=clientuser&type=viewed`}
                    isIE={false}
                    file={selectedFile}
                  />
                }
              </div>
            </div>
            <div className={sideBarClass}>
              <div className="tab-bar-nav">
                <ul className="navigation">
                  <li>
                    <span className={`action-link ${this.state.viewing === 'comments' ? 'active' : null}`} onClick={() => this.setState({viewing: 'comments'})}>Comments</span>
                  </li>
                  <li>
                    <span className={`action-link ${this.state.viewing === 'details' ? 'active' : null}`} onClick={() => this.setState({viewing: 'details'})}>Details</span>
                  </li>
                {/*                 
                  <li>
                    <span className={`action-link ${this.state.viewing === 'activity' ? 'active' : null}`} onClick={() => this.setState({viewing: 'activity'})}>Activity</span>
                  </li>
                 */}
                </ul>
              </div>
              { this.state.viewing === 'comments'  ? 
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
                :
                <div className="-content">

                  <h4>File details</h4>
                  {/* If we want to allow clients to change file names we'll use the commented block below. */}
                  {/* { this.state.changeFilename ? 
                    <div>
                      <TextInput
                        change={this._handleFormChange}
                        name={'newFilename'}
                        suffix={selectedFile.fileExtension}
                        value={this.state.newFilename}
                      />
                      <button className="yt-btn x-small link" onClick={this._toggleUpdateFilename}>cancel</button>
                      <button className="yt-btn x-small success" onClick={this._handleUpdateFilename}>save</button>
                    </div>
                    :
                    <div>
                      <div style={{display: 'inline-block'}}>{selectedFile ? selectedFile.filename : <span className="loading"/>}</div>
                      <button className="yt-btn x-small link danger" onClick={this._toggleUpdateFilename}>change</button>
                    </div>
                  } */}
                  <p>
                    <small className="u-muted">File Name: </small><br/>
                    { selectedFile.filename }
                  </p>
                  <br/>
                  <p>
                    <small className="u-muted">Date Uploaded: </small><br/>
                    {DateTime.fromISO(selectedFile.created_at).toLocaleString(DateTime.DATE_SHORT)}
                  </p>
                  <br/>
                  <p>
                    <small className="u-muted">Uploaded By: </small><br/>
                    { userMap[selectedFile._user] ?
                      `${userMap[selectedFile._user].firstname} ${userMap[selectedFile._user].lastname}`
                      :
                      selectedFile.uploadName ?
                      <em>{selectedFile.uploadName} (not logged in)</em>
                      :
                      'Unknown'
                    }
                  </p>
                  <br/>
                  <p>
                    <small className="u-muted">Type: </small><br/>
                    { selectedFile.category }
                  </p>
                  <br/>
                  <p>
                    <small className="u-muted">Content Type: </small><br/>
                    { selectedFile.contentType }
                  </p>
                  <br/>
                  <p>
                    <small className="u-muted">Tags: </small><br/>
                  </p>
                  { fileTags.map((tag, i) => 
                    <span key={tag._id + i}>{i > 0 ? " | " : ""}{tag.name}</span>
                  )}
                  <br/>
                  
                </div>
              }
            </div>
            <FileVersionListModal
              isOpen={showFileVersionList}
              file={selectedFile}
              close={() => this.setState({ showFileVersionList: !showFileVersionList })}
              allFilesFromListArgs={selectedFile.olderVersions}
              firm={selectedFirm}
            />
          </div>
        }
      </div>
    )
  }
}

ClientSingleFile.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    clientNoteStore: store.clientNote
    , fileStore: store.file
    , userMap: store.user.byId
    , tagStore: store.tag
    , socket: store.user.socket
    , loggedInUser: store.user.loggedIn.user
    , clientStore: store.client
    , firmStore: store.firm 
    , staffStore: store.staff
    , clientUserStore: store.clientUser
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientSingleFile)
);

