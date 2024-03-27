/**
 * View component for /share-links/:shareLinkId
 *
 * Displays a single shareLink from the 'byId' map in the shareLink reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, history, withRouter } from 'react-router-dom';

// import actions
import * as clientActions from '../../client/clientActions';
import * as firmActions from '../../firm/firmActions';
import * as shareLinkActions from '../shareLinkActions';

// import global components
import AlertModal from '../../../global/components/modals/AlertModal.js.jsx';
import Binder from '../../../global/components/Binder.js.jsx';
import DefaultTopNav from '../../../global/components/navigation/DefaultTopNav.js.jsx';
import ProfilePic from '../../../global/components/navigation/ProfilePic.js.jsx';
import ProfileDropdown from '../../../global/components/navigation/ProfileDropdown.js.jsx';
import CheckboxInput from '../../../global/components/forms/CheckboxInput.js.jsx';
import { FileInput, TextInput } from '../../../global/components/forms';
import Modal from '../../../global/components/modals/Modal.js.jsx';
import Breadcrumbs from '../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import ClientNoteItem from '../../clientNote/components/ClientNoteItem.js.jsx';
import PreviewFile from '../../file/components/PreviewFile.js.jsx';
import ShareLinkAuthForm from '../components/ShareLinkAuthForm.js.jsx';
import ShareLinkLayout from '../components/ShareLinkLayout.js.jsx';
import ShareLinkNav from '../components/ShareLinkNav.js.jsx';

import classNames from 'classnames';
import { DateTime } from 'luxon';
import { auth, displayUtils, downloadsUtil, fileUtils } from '../../../global/utils';
import { Helmet } from 'react-helmet';
import _ from 'lodash';
import moment from 'moment';

class ViewShareLinkFiles extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      alertModalOpen: false 
      , password: ''
      , expired: false 
      , selectedFile: null 
      , showSideBar: true  
      , viewing: 'comments'
      , selectedFileIds: []
      , uploadName: ''
      , uploadNameSet: false
      , showTermsAndServices: false
      , tcContents: ''
      , tcCheckboxStatus: false
      , onProcess: false
    }
    this._bind(
      '_handleAuthenticateLink'
      , '_handleDisableLink'
      , '_handleFormChange'
      , '_handleReload'
      , '_handleDownloadAllFiles'
      , '_handleDownloadSelectedFiles'
      , '_downloadSelectedFiles'
      , '_handleConfirmModal'
      , '_handleGuestUser'
      , '_handleDownloadFiles'
      , '_handleFireDownloadAllFiles'
    )
  }

  componentDidMount() {
    console.log('did mount');
    const { dispatch, loggedInUser, match } = this.props;
    if(loggedInUser && loggedInUser._id) {
      dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id)).then(firmRes => {
        console.log("firmRes", firmRes);
      });
    }
    dispatch(shareLinkActions.fetchSingleByHex(match.params.hex)).then((shareLinkRes) => {
      console.log('sharelink res', shareLinkRes);

      if(loggedInUser && loggedInUser._id) {
        if(shareLinkRes.item && shareLinkRes.item.showTermsConditions) {
          const firm = shareLinkRes.item.firm;

          this.setState({
            showTermsAndServices: !!shareLinkRes.item.showTermsConditions, 
            tcContents: firm.tcContents
          });
        }
      }
    })
    dispatch(firmActions.fetchSingleFirmByDomain());
  }

  _handleAuthenticateLink(e) {
    if(e) {
      e.preventDefault();
    }
    console.log('authenticate link')
    const { dispatch, match, shareLinkStore } = this.props;
    const selectedShareLink = _.cloneDeep(shareLinkStore.selectedHex.getItem());
    // If it is 'shared-client-secret' then password needs to be hashed.
    const password = selectedShareLink && (selectedShareLink.authType === 'shared-client-secret' ||  selectedShareLink.authType === 'shared-contact-secret' ) ? auth.getHashFromString(_.snakeCase(this.state.password)) : this.state.password;
    dispatch(shareLinkActions.sendAuthenticateLink(match.params.hex, {password: password})).then(slRes => {
      if(slRes.success) {
        // do nothing. deternmination of link's authentication status is handled on the reducer 
      } else {
        this.setState({
          alertModalOpen: true 
        })
      }
    })
  }

  _handleDisableLink() {
    const { dispatch, history, match, shareLinkStore} = this.props;
    const selectedShareLink = _.cloneDeep(shareLinkStore.selectedHex.getItem());
    const updatedShareLink = {
      _id: selectedShareLink._id 
      , expireDate: new Date()
    }
    dispatch(shareLinkActions.sendUpdateShareLinkWithPermission(updatedShareLink)).then(slRes => {
      console.log('done');
      if(slRes.success) {
        // force refresh 
        window.location.reload();
      } else {
        alert('Something went wrong');
      }
    })
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleReload() {
    const { dispatch, match } = this.props;
    dispatch(shareLinkActions.fetchSingleByHex(match.params.hex));
    this.setState({alertModalOpen: false});
  }

  _handleDownloadAllFiles() {
    this.setState({ onProcess: true });
    const { shareLinkStore, loggedInUser } = this.props; 
    const selectedShareLink = shareLinkStore.selectedHex.getItem();
    const selectedFileIds = _.cloneDeep(selectedShareLink._files);
    const uploadName = _.cloneDeep(this.state.uploadName);
    const shareLinkId = _.cloneDeep(selectedShareLink._id);
    const selectedFirm = _.cloneDeep(selectedShareLink.firm);
    const filesMap = _.keyBy(selectedShareLink.files, '_id');

    const sendData = {
      files: selectedShareLink.files
      , userLevel: 'clientuser'
      , filesMap
      , loggedInUser
      , uploadName
      , shareLinkId
    };

    console.log('selectedFileIds', selectedFileIds);

    if (selectedFirm && selectedFirm.zipFilesDownload) {
      sendData.selectedFileIds = selectedFileIds;
      console.log('sendData', sendData)
      downloadsUtil.bulkZipped(sendData, response => {
        this.setState({ onProcess: false });
      });
    } else {
      let tempFiles = [];
      selectedFileIds.map((fileId) => {
        let file = filesMap[fileId];
        if (file && file.category === "folder") {
          sendData.folder = file;
          sendData.selectedFileIds = [file._id];
          downloadsUtil.singleZipped(sendData, response => {
            console.log(response);
          });
        } else {
          let downloadLink = `/api/share-links/download/${selectedShareLink.hex}/${file._id}/${file.filename}`;
          var a  = document.createElement("a");
          a.setAttribute('href', `${downloadLink}?userLevel=clientuser&type=downloaded&shareLinkId=${shareLinkId}&name=${uploadName}`);
          a.setAttribute('download', '');
          a.setAttribute('target', '_blank');    
          a.setAttribute('id',`${fileId}`);
          tempFiles.push(a);
        }

      });
      console.log('tempFiles', tempFiles);
      this._handleFireDownloadAllFiles(tempFiles, 0)
      this.setState({ onProcess: false });
    }
  }

  _handleFireDownloadAllFiles(tempFiles, index = 0) {
    const intervalId = setInterval(() => {
      if(index < tempFiles.length) {
        console.log('fire', index);
        tempFiles[index].click();
        index++;
      } else {
        console.log('done');
        clearInterval(intervalId);
      }
    }, 700)
  }

  _downloadSelectedFiles(downloadlinks, index, shareLinkId) {

    const uploadName = _.cloneDeep(this.state.uploadName);
    if(index < downloadlinks.length) {
      var a  = document.createElement("a");
      a.setAttribute('href', `${downloadlinks[index]}?userLevel=clientuser&type=downloaded&shareLinkId=${shareLinkId}&name=${uploadName}`);
      a.setAttribute('download', '');
      a.setAttribute('target', '_blank');       
      a.click();
      index++;
      setTimeout(() => {
        this._downloadSelectedFiles(downloadlinks, index, shareLinkId); 
      }, 700);
    }
  }

  _handleDownloadSelectedFiles() {
    this.setState({ onProcess: true });
    const { shareLinkStore, loggedInUser } = this.props; 
    const selectedShareLink = shareLinkStore.selectedHex.getItem();
    const selectedFileIds = _.cloneDeep(this.state.selectedFileIds);
    const uploadName = _.cloneDeep(this.state.uploadName);
    const shareLinkId = _.cloneDeep(selectedShareLink._id);
    const selectedFirm = _.cloneDeep(selectedShareLink.firm);
    const filesMap = _.keyBy(selectedShareLink.files, '_id');

    const sendData = {
      files: selectedShareLink.files
      , userLevel: 'clientuser'
      , filesMap
      , loggedInUser
      , uploadName
      , shareLinkId
    };

    if (selectedFirm && selectedFirm.zipFilesDownload && selectedFileIds && selectedFileIds.length > 1) {
      sendData.selectedFileIds = selectedFileIds;
      downloadsUtil.bulkZipped(sendData, response => {
        this.setState({ onProcess: false });
      });
    } else {
      selectedFileIds.map(fileId => {
        let file = filesMap[fileId];
        if (file && file.category === "folder") {
          sendData.folder = file;
          sendData.selectedFileIds = [file._id];
          downloadsUtil.singleZipped(sendData, response => {
            console.log(response);
          });
        } else {
          let downloadLink = `/api/share-links/download/${selectedShareLink.hex}/${file._id}/${file.filename}`;
          var a  = document.createElement("a");
          a.setAttribute('href', `${downloadLink}?userLevel=clientuser&type=downloaded&shareLinkId=${shareLinkId}&name=${uploadName}`);
          a.setAttribute('download', '');
          a.setAttribute('target', '_blank');       
          a.click();
        }
      });
      this.setState({ onProcess: false });
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

  _handleConfirmModal() {
    this.setState({showTermsAndServices: false});
  }

  _handleGuestUser() {

    const { 
      loggedInUser
      , shareLinkStore 
    } = this.props;

    const selectedShareLink = shareLinkStore.selectedHex.getItem();

    console.log('selectedShareLink', selectedShareLink);

    this.setState({ uploadNameSet: true });

    if(selectedShareLink && selectedShareLink.showTermsConditions) {
      const firm = selectedShareLink.firm;

      this.setState({
        showTermsAndServices: !!selectedShareLink.showTermsConditions, 
        tcContents: firm.tcContents
      });

    }
  }

  _handleDownloadFiles(file) {
    this.setState({ onProcess: true });
    const { shareLinkStore, fileStore, loggedInUser } = this.props; 
    const selectedShareLink = shareLinkStore.selectedHex.getItem();
    const sendData = {
      folder: file
      , files: selectedShareLink.files
      , userLevel: 'clientuser'
      , shareLinkId: _.cloneDeep(selectedShareLink._id)
      , uploadName: _.cloneDeep(this.state.uploadName)
      , selectedFileIds: [file._id]
      , filesMap: _.keyBy(selectedShareLink.files, '_id')
      , loggedInUser
    };

    downloadsUtil.singleZipped(sendData, response => {
      this.setState({ onProcess: false });
    });
  }

  render() {
    const { 
      clientStore 
      , fileStore 
      , firmStore 
      , location 
      , loggedInUser
      , shareLinkStore 
      , disabled
      , checked
      , handleSelectFile
      , match
    } = this.props;
    
    const {
      selectedFile
      , selectedFileIds
      , tcContents
      , tcCheckboxStatus
      , onProcess
    } = this.state;

    /**
     * use the selected.getItem() utility to pull the actual shareLink object from the map
     */
    const selectedShareLink = shareLinkStore.selectedHex.getItem();
    // console.log(selectedShareLink)
    // console.log(shareLinkStore.selectedHex);
    // console.log(shareLinkStore.byHex[match.params.hex])

    // const userFirms = loggedInUser && loggedInUser._id ? firmStore.util.getList(userFirmListArgs);
    const userFirmList = loggedInUser && loggedInUser._id && firmStore.lists && firmStore.lists._user ? firmStore.lists._user[loggedInUser._id] : null;

    const isEmpty = (
      !selectedShareLink
      || !selectedShareLink._id
      || shareLinkStore.selectedHex.didInvalidate
    );

    const isFetching = (
      shareLinkStore.selectedHex.isFetching
    ) 

    const isExpired = (
      !isEmpty 
      && selectedShareLink.expireDate 
      && DateTime.fromISO(selectedShareLink.expireDate) < DateTime.local()
    )

    const isAuthenticated = shareLinkStore.selectedHex.isAuthenticated

    const previewClass = classNames(
      'file-preview-container'
      , { '-with-sidebar': this.state.showSideBar }
    )

    const sideBarClass = classNames(
      'file-preview-sidebar'
      , { '-hidden': !this.state.showSideBar }
    )


    const sideMenuClass = classNames(
      "-sidebar-menu"
      , { '-open': this.state.showSideBar }
    )

    let fileListItems = selectedShareLink && selectedShareLink.files;
    let breadcrumbs = [];
    if (fileListItems && fileListItems.length && !isEmpty && !isFetching && !isExpired && isAuthenticated && !selectedFile && ((loggedInUser && loggedInUser._id || this.state.uploadNameSet ))) {
      if (match.params.folderId) {
        const fileMap = _.keyBy(fileListItems, '_id');
        if (fileMap) {
          let fileId = match.params.folderId;
          do {

            let file = fileMap[fileId]
            if (file && file.root) {
              breadcrumbs.unshift({
                display: '..'
                , path: `/share/${selectedShareLink.hex}`
              }, {
                display: file.filename
                , path: `/share/${selectedShareLink.hex}/folder/${file._id}`
              });
              fileId = null;
            } else if (file && file.filename) {
              breadcrumbs.unshift({
                display: file.filename
                , path: `/share/${selectedShareLink.hex}/folder/${file._id}`
              });
              fileId = file._folder
            }
          } while (fileMap[fileId] && fileMap[fileId]._id);
        }
        fileListItems = fileListItems.filter(file => file._folder == match.params.folderId);
      } else {
        fileListItems = fileListItems.filter(file => file.root);
      }
      if (fileListItems && fileListItems.length) {
        if (fileListItems) {
          fileListItems = fileListItems.sort((a,b) => {
            let aIndex = a.category === "folder" ? 0 : 1;
            let bIndex = b.category === "folder" ? 0 : 1;
            return aIndex - bIndex;
          });
        }
      } else {
        fileListItems = selectedShareLink && selectedShareLink.files;
      }
    }

    return (
      <div>
        <Helmet><title>Sharing Files</title></Helmet>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <div className="flex column">
              <section className="section white-bg the-404">
                <div className="hero flex three-quarter ">
                  <div className="yt-container slim">
                    <h1> Whoops! <span className="light-weight">Something wrong here</span></h1>
                    <hr/>
                    <h4>Either this link no longer exists, or your credentials are invalid.</h4>
                  </div>
                </div>
              </section>
            </div>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
 
            { isExpired ? 
              <div className="flex column">
                <section className="section white-bg the-404">
                  <div className="hero flex three-quarter ">
                    <div className="yt-container slim">
                      <h1> Whoops! <span className="light-weight">This link is expired</span></h1>
                      <hr/>
                      <h4>You can <Link to="/user/login">sign in</Link> to view your account, or request a new link.</h4>
                    </div>
                  </div>
                </section>
              </div>
              : !isAuthenticated ? 
              <div className="share-link-layout">
                <DefaultTopNav />
                <div className="yt-row center-horiz" style={{marginTop: '128px'}}>
                  <ShareLinkAuthForm
                    handleFormChange={this._handleFormChange}
                    handleFormSubmit={this._handleAuthenticateLink}
                    password={this.state.password}
                    prompt={selectedShareLink.prompt }
                    shareLink={selectedShareLink}
                  />
                </div>
              </div>
              : selectedFile ? 
                <div className="share-link-layout">

                  <div className={previewClass}>
                    <header className="-header fixed">
                      <div className="-header-content">
                        <a className="-exit-preview" onClick={() => this.setState({selectedFile: null})}>
                          <i className="fas fa-arrow-left"></i>
                        </a>
                        <div className="-file-preview-action">
                          <div className="-preview-title">
                          {/* <img className="-icon" src={} /> */}
                          { selectedFile.filename }
                          </div>
                          <div className="-file-actions u-pullRight">
                          
                            {/* <UserClickEvent
                              description="Download File from preview sidebar"
                              eventAction="download"
                              eventType="file"
                              listArgs={['_file', selectedFile._id]}
                              refKey="_file"
                              refId={selectedFile._id}
                            > */}
                              <a className="yt-btn x-small link bordered" href={`/api/share-links/download/${selectedShareLink.hex}/${selectedFile._id}/${encodeURIComponent(selectedFile.filename)}?userLevel=clientuser&type=downloaded&shareLinkId=${selectedShareLink._id}&name=${this.state.uploadName}`} download target="_blank">
                                <span> Download</span>
                              </a>
                            {/* </UserClickEvent> */}
                            |
                            { loggedInUser && loggedInUser._id ?
                
                              <Link to="/" className="action-link" >
                                <ProfilePic user={loggedInUser}/>
                                <div className="-profile-info">
                                  <small>{loggedInUser.firstname} {loggedInUser.lastname}  </small>
                                </div>
                              </Link>

                              :
                              <Link className="yt-btn x-small link info" to="/user/login">Sign in </Link>
                            }

                          </div>
                        </div>
                      </div>
                    </header>
                    <div className="-preview-content">
                      <div className={sideMenuClass} onClick={() => this.setState({showSideBar: !this.state.showSideBar, viewing: 'comments'})}>
                        <div className="-icon">
                          { this.state.showSideBar ?
                            <i className="far fa-arrow-to-right fa-lg"/>
                            :
                            <i className="far fa-arrow-from-right fa-lg"/>
                          }
                        </div>
                        { !this.state.showSideBar ?
                          <div className="-icon">
                            <i className="far fa-comment-lines fa-lg"/>
                          </div>
                          :
                          null
                        }
                      </div>
                      <PreviewFile
                        contentType={selectedFile.contentType}
                        filePath={`/api/share-links/download/${selectedShareLink.hex}/${selectedFile._id}/${encodeURIComponent(selectedFile.filename)}?userLevel=clientuser&type=viewed&shareLinkId=${selectedShareLink._id}&name=${this.state.uploadName}`}
                        isIE={false}
                        file={selectedFile}
                      />
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
                      </ul>
                    </div>
                    { this.state.viewing === 'comments' ? 
                      <div className="-content">
                        { selectedFile && selectedFile.clientNotes ? 
                          selectedFile.clientNotes.map((clientNote, i) =>
                            <ClientNoteItem 
                              key={`clientNote_${i}_${clientNote._id}`}
                              clientNote={clientNote}
                              user={clientNote.user}
                            />
                          )
                          :
                          null
                        }
                      </div> 
                      : 
                      <div className="-content">
                        <h4>File details</h4>
                        <p>
                          <small className="u-muted">FileName: </small><br/>
                          { selectedFile.filename }
                        </p>
                        <br/>
                        <p>
                          <small className="u-muted">Date Uploaded: </small><br/>
                          {DateTime.fromISO(selectedFile.created_at).toLocaleString(DateTime.DATE_SHORT)}
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
                      </div>
                    }
                  </div>
                </div>
                :
                <div className="share-link-layout">
                  <ShareLinkNav/>
                  <div className="body with-header">
                    <div className="yt-container slim">
                      <div className="u-pullRight" style={{ padding: "15px 0px 20px" }}>
                        {
                          !loggedInUser._id && !this.state.uploadNameSet ? null
                          : <button 
                            className="yt-btn x-small link" 
                            disabled={(selectedFileIds ? selectedFileIds.length > 0 ? false : true : true) || onProcess}
                            onClick={this._handleDownloadSelectedFiles}
                          > Download { selectedFileIds && selectedFileIds.length > 0 ? <span> &mdash; {selectedFileIds.length}</span> : null} 
                          </button>
                        }
                        {
                          !loggedInUser._id && !this.state.uploadNameSet ? null
                          : <button className="yt-btn x-small" disabled={onProcess} onClick={this._handleDownloadAllFiles}
                            style={{ margin: "0 10px" }}
                            >Download All</button>
                        }
                        { userFirmList && userFirmList.items.includes(selectedShareLink._firm) ? 
                          <button className="yt-btn danger x-small" disabled={onProcess} onClick={this._handleDisableLink}>Disable this link</button>
                          :
                          null
                        }
                      </div>
                      {
                        !loggedInUser._id && !this.state.uploadNameSet ?
                        <h3>
                          { selectedShareLink.firm ?
                            <span> {selectedShareLink.firm.name} </span>
                            :
                            <span> Your accountant </span>
                          }
                          is sharing files
                        </h3> : null
                      }
                      {
                        !loggedInUser._id && !this.state.uploadNameSet ?
                        <div className=" yt-col full m_50 l_40 xl_33">
                          <TextInput
                            autoFocus
                            name='uploadName'
                            placeholder='Enter your name'
                            change={this._handleFormChange}
                            value={this.state.uploadName}
                          />
                          <div className="input-group">
                            <button className="yt-btn x-small info u-pullRight" disabled={!this.state.uploadName} 
                              onClick={this._handleGuestUser}>
                              Done
                            </button>
                          </div>
                        </div>
                        :
                        <div>
                          <h3>Shared files for {selectedShareLink.client ? selectedShareLink.client.name : 'you' }</h3>
                          <p className="u-muted">
                            from
                            { selectedShareLink.createdBy ? 
                              <span> {selectedShareLink.createdBy.firstname} {selectedShareLink.createdBy.lastname} at </span>
                              :
                              null 
                            }
                            { selectedShareLink.firm ?
                              <span> {selectedShareLink.firm.name}</span>
                              :
                              <span> your accountant</span>
                            }
                          </p>
                          {
                            selectedShareLink.expireDate ? 
                              <p><span style={{fontStyle: "italic"}} className="u-muted">Link expires on </span><span style={{fontWeight: "500"}}>{moment(selectedShareLink.expireDate).utc().format('MM/DD/YYYY')}</span></p>
                            : ""
                          }
                          <div className="-file-list">
                            <small><strong>Sorted by name</strong></small>
                            <br/>
                            <Breadcrumbs links={breadcrumbs} connector="slash" />
                            <hr/>
                            <div className="yt-row with-gutters">
                              { selectedShareLink.files && fileListItems && fileListItems.length ? 
                                fileListItems.map((file, i) => 
                                <div key={`file_${file._id}_${i}`} className="yt-col full xs_50 s_33 m_25 l_20 xl_20 file-list-item">
                                  <div className="card -grid">
                                    <div className="card-header -file-card">
                                      <CheckboxInput
                                        disabled={(disabled && !checked)}
                                        name="file"
                                        value={checked}
                                        change={() => this._handleSelectFile(file._id)}
                                        checked={checked}
                                      />
                                    </div>
                                    <div className="-icon">
                                      {
                                        file.category === "folder" ? 
                                        <Link to={`/share/${selectedShareLink.hex}/folder/${file._id}`}>
                                          <img src={`/img/icons/${displayUtils.getFileIcon(file.category, file.contentType, file)}.png`} style={{ cursor: 'pointer' }} />
                                        </Link>
                                        :
                                        <img onClick={() => this.setState({selectedFile: file})} src={`/img/icons/${displayUtils.getFileIcon(file.category, file.contentType, file)}.png`} style={{ cursor: 'pointer' }} />
                                      }
                                    </div>
                                    <div className="card-body">
                                      <div className="-info">
                                        <div className="-title">
                                          {file.filename}
                                        </div>
                                        <small className="u-muted">{file.fileExtension}</small>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="-buttons">
                                    {
                                      file.category === "folder" ? 
                                      <Link to={`/share/${selectedShareLink.hex}/folder/${file._id}`} className="yt-btn x-small info block">View</Link>
                                      :
                                      <button className="yt-btn x-small info block" onClick={() => this.setState({selectedFile: file})}>Preview</button>
                                    }
                                    {
                                      file.category === "folder" ? 
                                      <button className="yt-btn x-small info block link" onClick={this._handleDownloadFiles.bind(this, file)}>Download</button>
                                      :
                                      <a className="yt-btn x-small info block link" href={`/api/share-links/download/${selectedShareLink.hex}/${file._id}/${encodeURIComponent(file.filename)}?userLevel=clientuser&type=downloaded&shareLinkId=${selectedShareLink._id}&name=${this.state.uploadName}`} download target="_blank">Download</a>                                    }
                                  </div>
                                </div>
                                )
                                :
                                <div><em>Empty.</em></div>
                              }
                            </div>
                            <br/>
                            <small className='u-muted'>
                              <em><strong>Data secured by 256-bit encryption</strong></em>
                            </small>
                          </div> 
                        </div>

                      }
                    </div>
                  </div>
                </div>
              }
          </div>
        }
        <AlertModal
          alertMessage={<div><p>You did not enter the correct information to access this link.</p></div> }
          alertTitle="Invalid credentials"
          closeAction={this._handleReload}
          confirmAction={this._handleReload}
          confirmText="Try again"
          isOpen={this.state.alertModalOpen }
          type="danger"
        />
        <Modal
          isOpen={this.state.showTermsAndServices}
          cardSize="standard"
          modalHeader="Terms and Conditions"
          confirmAction={this._handleConfirmModal}
          closeAction={() => {}}
          showClose={false}
          showConfirm={true}
          confirmText={'Agree'}
          showExit={false}
          disableConfirm={!tcCheckboxStatus}
          showTermsConditionsCB={true}
          tcCheckboxStatus={tcCheckboxStatus}
          tcCheckboxAction={() => {this.setState({tcCheckboxStatus: !tcCheckboxStatus})}}
        >
          <div dangerouslySetInnerHTML={{__html: tcContents || ""}}></div>
        </Modal>
      </div>
    )
  }
}

ViewShareLinkFiles.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    clientStore: store.client 
    , fileStore: store.file
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , shareLinkStore: store.shareLink
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ViewShareLinkFiles)
);
