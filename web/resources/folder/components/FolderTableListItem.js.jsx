/**
 * TODO: @ffugly
 * open file preview instead of download link
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import third-party libraries
import classNames from 'classnames';
import Select from 'react-select'; 

// import moment from 'moment';
import { DateTime } from 'luxon';

import * as fileActions from '../../file/fileActions'; 

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import { displayUtils, permissions } from '../../../global/utils';
import { CheckboxInput, SelectFromObject, TextInput } from '../../../global/components/forms'
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';
import Modal from '../../../global/components/modals/Modal.js.jsx';

import SingleFileOptions from '../../file/practice/components/SingleFileOptions.js.jsx';
import SingleFileTagsDropdown from '../../file/practice/components/SingleFileTagsDropdown.js.jsx';

// import event tracking
// import UserClickEvent from '../../userEvent/components/UserClickEvent.js.jsx';

class FolderTableListItem extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      singleFileOptionsOpen: false
      , showClientList: false 
      , clientId: this.props.file._client || null 
      , changeFilename: false
      , newFilename: ''
      , tagsDropDownOpen: false
    }
    this._bind(
      '_handleCloseQuickTaskModal'
      , '_handleOpenQuickTaskModal'
      , '_handleChangeClient'
      , '_handleUpdateFilename'
      , '_handleFormChange'
      , '_toggleUpdateFilename'
      , '_setStatus'
      , '_saveClientMove'
      , '_closeClientList'
      , '_openClientList'
      , '_handleOpenTagsDropdown'
      , '_handleCloseTagsDropdown'
    )
  }

  _handleCloseQuickTaskModal(e) {
    e.stopPropagation();
    this.setState({
      singleFileOptionsOpen: false
    })
  }

  _handleOpenQuickTaskModal(e) {
    e.stopPropagation();
    this.setState({
      singleFileOptionsOpen: false
    }, () => this.props.handleOpenQuickTaskModal())
  }
  // shouldComponentUpdate(nextProps, nextState) {
  //   if(this.props.file && this.props.file._id && nextProps.file && nextProps.file._id) {
  //     return true;
  //   }
  //   return false;
  // }

  _handleOpenTagsDropdown(e) {
    e.stopPropagation();
    this.setState({tagsDropDownOpen: true})
  }

  _handleCloseTagsDropdown(e) {
    e.stopPropagation();
    this.setState({tagsDropDownOpen: false}); 
  }

  _setStatus(status) {
    const { dispatch, file } = this.props; 
    let newFile = _.cloneDeep(file); 
    newFile.status = status; 
    dispatch(fileActions.sendUpdateFile(newFile)); 
  }

  _closeClientList() {
    this.setState({showClientList: false, clientId: this.props.file._client}); 
  }

  _openClientList() {
    this.setState({showClientList: true});
  }

  _handleChangeClient(e) {
    this.setState({clientId: e.value}); 
  }

  _saveClientMove() {
    const { dispatch, file, fileListArgs } = this.props; 
    let newFile = _.cloneDeep(file);
    newFile._client = this.state.clientId; 
    dispatch(fileActions.sendUpdateFile(newFile)).then((json) => {
      if(fileListArgs.includes('~client') || fileListArgs.includes('_client')) {
        dispatch(fileActions.removeFileFromList(file._id, ...fileListArgs)); 
      } else {
        this._closeClientList(); 
      }
    })
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState)
  }

  _toggleUpdateFilename() {
    const { file } = this.props;
    // preserve the fileExtension by removing it from the filename here. We'll add it back when they save.
    const baseFilename = file.filename.slice(0, file.filename.indexOf(file.fileExtension));
    
    this.setState({
      changeFilename: !this.state.changeFilename
      , newFilename: baseFilename
      , singleFileOptionsOpen: false
    })
  }

  _handleUpdateFilename() {
    const { newFilename } = this.state;
    const { dispatch, file } = this.props;
    let newFile = _.cloneDeep(file);
    // Add the fileExtension back to the filename.
    newFile.filename = newFilename + file.fileExtension;

    if(newFilename.length > 0) {
      dispatch(fileActions.sendUpdateFile(newFile)).then((action) => {
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
  }

  render() {
    const { 
      checked
      , client
      , clientStore
      , disabled
      , file
      , firmStore
      , loggedInUser
      , match
      , showOptions
      , staffStore
      , staffClientStore
      , tagStore
      , userStore 
      , viewingAs
      , sortedTagListItems
      , tagNameList
    } = this.props;

    const { showClientList, changeFilename, newFilename, singleFileOptionsOpen, tagsDropDownOpen } = this.state; 

    const selectedFirm = firmStore.selected.getItem();
    const loggedInStaff = staffStore.loggedInByFirm[selectedFirm && selectedFirm._id] ? staffStore.loggedInByFirm[selectedFirm._id].staff : null;

    // let foundComment = _.find(commentMap, { '_file': file._id });
    let foundComment = true;
    const fileTags = file._tags ? file._tags.map(tagId => tagStore.byId[tagId] || '' ) : []

    console.log("file.contentType", file.contentType)
    const icon = file.contentType ? displayUtils.getFileIcon(file.category, file.contentType, file) : displayUtils.getFileIcon("folder", null);

    const staffClientList = staffClientStore.util.getList('_firm', match.params.firmId, '_user', loggedInUser._id + "", '~staff.status', 'active'); 
    const clientList = staffClientList && staffClientList.map(sf => clientStore.byId[sf._client]); 
 
    const ownerClientList = clientStore.util.getList('_firm', match.params.firmId); 
    const isFirmOwner = permissions.isStaffOwner(staffStore, loggedInUser, match.params.firmId); 

    const clients = isFirmOwner ? ownerClientList : clientList; 
    
    let options = [
      { value: null, label: "(General Files)" } // General Location
    ];
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

    return (
      <div className="table-row -file-item">
        <div className="table-cell">
          <CheckboxInput
            disabled={(disabled && !checked)}
            name="file"
            value={checked}
            change={() => this.props.handleSelectFile(file._id)}
            checked={checked}
          />
        </div>
        { showOptions ?
          <div className="table-cell">
            <div className="-options" onClick={() => this.setState({singleFileOptionsOpen: true})}>
              <div style={{position: "relative", height: "100%", width: "100%"}}>
              <CloseWrapper
                isOpen={singleFileOptionsOpen}
                closeAction={this._handleCloseQuickTaskModal}
              />
              <i className="far fa-ellipsis-v"></i>
              <SingleFileOptions
                isOpen={singleFileOptionsOpen}
                handleOpenQuickTaskModal={this._handleOpenQuickTaskModal}
                showClientList={this._openClientList}
                closeAction={this._handleCloseQuickTaskModal}
                setStatus={this._setStatus}
                eSigAccess={selectedFirm && selectedFirm.eSigAccess && loggedInStaff && loggedInStaff.eSigAccess}
                toggleUpdateFilename={this._toggleUpdateFilename}
                file={file}
              />
            </div>
            </div>
         </div>
         :
         null
        }
        <div className="table-cell -title">
          <div className="yt-row center-vert">
            <span className="-icon">
              <img src={`/img/icons/${icon}.png`} />
            </span>
            { changeFilename ? 
              <div className="-file-info">
                <div className="yt-row center-vert">
                  <div style={{paddingBottom: 10}}> 
                  <TextInput
                    change={this._handleFormChange}
                    name={'newFilename'}
                    suffix={file.fileExtension}
                    value={newFilename}
                    onSubmit={this._handleUpdateFilename}
                  />
                  </div>
                  <div className="center-vert">
                    <button className="yt-btn x-small link" onClick={this._toggleUpdateFilename}>cancel</button>
                    <button className="yt-btn x-small success" onClick={this._handleUpdateFilename}>save</button>
                  </div>
                </div>
              </div>
            :
              <div className="-file-info">
              { this.props.handleFilesChange ?
                file.filename
                : 
                // TODO: this link goes nowhere when selecting from existing files        
                <Link className="-filename" to={file.category === "folder" ? `${match.url}/folder/${file._id}` : `${match.url}/files/${file._id}` }>
                  {file.filename}
                </Link>
              }
                <br/>
                <small>
                { userStore.byId[file._user] ?
                  <span>by {userStore.byId[file._user].firstname} {userStore.byId[file._user].lastname}</span>
                  :
                  file.uploadName ?
                  <span>by <em>{file.uploadName} (not verified)</em></span>
                  :
                  null
                }
                </small>
              </div>
            }
            {/* { foundComment ?
              <i style={{marginLeft: '8px'}} className="fal fa-comment-lines" />
              :
              null
            } */}
          </div>
        </div>
        <div className="table-cell -tags" onClick={() => this.setState({tagsDropDownOpen: true})}>
          <CloseWrapper
            isOpen={tagsDropDownOpen}
            closeAction={this._handleCloseTagsDropdown}
          />
          <SingleFileTagsDropdown
            isOpen={tagsDropDownOpen}
            fileTags={fileTags}
            file={file}
            sortedTagListItems={sortedTagListItems}
            tagNameList={tagNameList}
            isFirmOwner={isFirmOwner}
          />
        </div>
        { viewingAs === 'general' || viewingAs === 'admin' ?
          <div className="table-cell -client">
            { client ? 
              <Link to={`/firm/${match.params.firmId}/workspaces/${client._id}`}>{client.name}</Link>
              :
              <span>N/A</span>
            }
          </div>
          :
          null
        }
        {/* <td className="-date">{file.year}</td> */}
        {/* ??ND <div className="table-cell -visibility u-centerText">
          { file.status == 'locked' ? 
              <i className="fas fa-lock"/>
            : file.status == 'visible' ?
              <i onClick={() => this._setStatus('hidden')} className=" fas fa-eye"/>
            : 
              <i onClick={() => this._setStatus('visible')} className="u-danger fad fa-eye-slash"/>
          }
        </div> */}
        <div className="table-cell -date">{DateTime.fromISO(file.updated_at).toLocaleString(DateTime.DATE_SHORT)}</div>
        <Modal
          cardSize='standard'
          closeAction={this._closeClientList}
          isOpen={showClientList}
          modalHeader={'Move file new client'}
          showButtons={true}
          confirmAction={this._saveClientMove}
          confirmText="Save"
          disableConfirm={!this.state.clientId}
        >
          <Select 
            options={options.length ? options.sort((a, b) => (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0)) : null}
            onChange={(e) => this._handleChangeClient(e)}
            value={options.length ? options.find(o => o.value == this.state.clientId) : null}
          />
        </Modal>
      </div>
    )
  }
}

FolderTableListItem.propTypes = {
  checked: PropTypes.bool
  , client: PropTypes.object 
  , disabled: PropTypes.bool
  , dispatch: PropTypes.func.isRequired
  , file: PropTypes.object.isRequired
  , handleSelectFile: PropTypes.func 
  , handleOpenQuickTaskModal: PropTypes.func
  , showOptions: PropTypes.bool
  , viewingAs: PropTypes.oneOf(['workspace', 'general', 'admin', 'client', 'staff']) 
}

FolderTableListItem.defaultProps = {
  checked: false
  , client: null 
  , disabled: false
  , handleSelectFile: null
  , showOptions: false
  , viewingAs: 'workspace'
}

const mapStoreToProps = (store) => {
  return {
    tagStore: store.tag
    , userStore: store.user 
    , loggedInUser: store.user.loggedIn.user
    , clientStore: store.client
    , firmStore: store.firm
    , staffStore: store.staff
    , staffClientStore: store.staffClient
  }
}

export default withRouter(connect(
  mapStoreToProps
)(FolderTableListItem));


// save for later
// <a href={`/api/files/download/${file._id}/${file.filename}`} target="_blank">{file.filename}</a>
