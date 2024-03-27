import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ReactTooltip from 'react-tooltip';

import Binder from "../../../global/components/Binder.js.jsx";
import { withRouter } from 'react-router';

import * as constants from '../../../config/constants.js';

import { CheckboxInput, TextInput } from '../../../global/components/forms'

class FolderPermissionTable extends Binder {

  constructor(props) {
    super(props)
    this.state = {
      adminFullAccess: false
      , adminRead: false
      , adminCreate: false
      , adminUpdate: false
      , adminDelete: false
      , adminUpload: false
      , adminDownload: false
      , ownerFullAccess: false
      , ownerRead: false
      , ownerCreate: false
      , ownerUpdate: false
      , ownerDelete: false
      , ownerUpload: false
      , ownerDownload: false
      , staffFullAccess: false
      , staffRead: false
      , staffCreate: false
      , staffUpdate: false
      , staffDelete: false
      , staffUpload: false
      , staffDownload: false
      , contactFullAccess: false
      , contactRead: false
      , contactCreate: false
      , contactUpdate: false
      , contactDelete: false
      , contactUpload: false
      , contactDownload: false
      , showFolderClientPortal: false
      , allowUploadClientPortal: false
    }

    this._bind(
      '_handleFolderPermission'
    )
  }

  componentDidMount() {
    const { selectedFile = {}, selectedFirm, isFolderTemplate } = this.props;

    let selectedPermission = {};

    const firmGroupPermission = selectedFirm.permission;
    if(isFolderTemplate) {
      const { FOLDER_PERMISSION_FIELDS } = constants;

      FOLDER_PERMISSION_FIELDS.map(key => {
        selectedPermission[key] = selectedFile.hasOwnProperty(key) ? !!selectedFile[key] : !!firmGroupPermission[key];
      })
    } else {
      selectedPermission = (selectedFile && selectedFile.permission) ? selectedFile.permission : firmGroupPermission;
    }  
  
    console.log('check selectedFile-', selectedFile);
    console.log('check selectedPermission-', selectedPermission);

    if((selectedPermission && selectedPermission._id) || !!isFolderTemplate) {
      this.setState({
        adminFullAccess: selectedPermission.adminRead 
        && selectedPermission.adminCreate
        && selectedPermission.adminUpdate
        && selectedPermission.adminDelete
        && selectedPermission.adminUpload
        && selectedPermission.adminDownload
        , adminRead: selectedPermission.adminRead
        , adminCreate: selectedPermission.adminCreate
        , adminUpdate: selectedPermission.adminUpdate
        , adminDelete: selectedPermission.adminDelete
        , adminUpload: selectedPermission.adminUpload
        , adminDownload: selectedPermission.adminDownload
        , ownerFullAccess: selectedPermission.ownerRead
        && selectedPermission.ownerCreate
        && selectedPermission.ownerUpdate
        && selectedPermission.ownerDelete
        && selectedPermission.ownerUpload
        && selectedPermission.ownerDownload
        , ownerRead: selectedPermission.ownerRead
        , ownerCreate: selectedPermission.ownerCreate
        , ownerUpdate: selectedPermission.ownerUpdate
        , ownerDelete: selectedPermission.ownerDelete
        , ownerUpload: selectedPermission.ownerUpload
        , ownerDownload: selectedPermission.ownerDownload
        , staffFullAccess: selectedPermission.staffRead
        && selectedPermission.staffCreate
        && selectedPermission.staffUpdate
        && selectedPermission.staffDelete
        && selectedPermission.staffUpload
        && selectedPermission.staffDownload
        , staffRead: selectedPermission.staffRead
        , staffCreate: selectedPermission.staffCreate
        , staffUpdate: selectedPermission.staffUpdate
        , staffDelete: selectedPermission.staffDelete
        , staffUpload: selectedPermission.staffUpload
        , staffDownload: selectedPermission.adminRead
        , contactFullAccess: selectedPermission.contactRead
        && selectedPermission.contactCreate
        && selectedPermission.contactUpdate
        && selectedPermission.contactDelete
        && selectedPermission.contactUpload
        && selectedPermission.contactDownload
        , contactRead: selectedPermission.contactRead
        , contactCreate: selectedPermission.contactCreate
        , contactUpdate: selectedPermission.contactUpdate
        , contactDelete: selectedPermission.contactDelete
        , contactUpload: selectedPermission.contactUpload
        , contactDownload: selectedPermission.contactDownload
        , showFolderClientPortal: selectedPermission.showFolderClientPortal
      }, () => {
        this.props.handleChange(this.state);
      })
    }
  }

  _handleFolderPermission(permission) {
    if(permission == "adminFullAccess") {
      this.setState({
        adminFullAccess: !this.state[permission],
        adminRead: !this.state[permission],
        adminCreate: !this.state[permission],
        adminUpdate: !this.state[permission],
        adminDelete: !this.state[permission],
        adminUpload: !this.state[permission],
        adminDownload: !this.state[permission]
      }, () => {
        this.props.handleChange(this.state)
      })
    } else if(permission == "ownerFullAccess") {
      this.setState({
        ownerFullAccess: !this.state[permission],
        ownerRead: !this.state[permission],
        ownerCreate: !this.state[permission],
        ownerUpdate: !this.state[permission],
        ownerDelete: !this.state[permission],
        ownerUpload: !this.state[permission],
        ownerDownload: !this.state[permission]
      }, () => {
        this.props.handleChange(this.state)
      })
    } else if(permission == "staffFullAccess") {
      this.setState({
        staffFullAccess: !this.state[permission],
        staffRead: !this.state[permission],
        staffCreate: !this.state[permission],
        staffUpdate: !this.state[permission],
        staffDelete: !this.state[permission],
        staffUpload: !this.state[permission],
        staffDownload: !this.state[permission]
      }, () => {
        this.props.handleChange(this.state)
      })
    } else if(permission == "contactFullAccess") {
      this.setState({
        contactFullAccess: !this.state[permission],
        contactRead: !this.state[permission],
        contactCreate: !this.state[permission],
        contactUpdate: !this.state[permission],
        contactDelete: !this.state[permission],
        contactUpload: !this.state[permission],
        contactDownload: !this.state[permission]
      }, () => {
        this.props.handleChange(this.state)
      })
    } else {
      this.setState({
        [permission]: !this.state[permission]
      }, () => {
        const { 
          adminRead, adminCreate, adminUpdate, adminDelete, adminUpload, adminDownload
          , ownerRead, ownerCreate, ownerUpdate, ownerDelete, ownerUpload , ownerDownload
          , staffRead, staffCreate, staffUpdate, staffDelete, staffUpload , staffDownload
          , contactRead, contactCreate, contactUpdate, contactDelete, contactUpload, contactDownload 
          , showFolderClientPortal, allowUploadClientPortal
        } = this.state;

        if(permission.includes("admin")) {
          this.setState({
            adminFullAccess: (adminRead && adminCreate && adminUpdate && adminDelete && adminUpload && adminDownload)
          })
        } else if(permission.includes('owner')) {
          this.setState({
            ownerFullAccess: (ownerRead && ownerCreate && ownerUpdate && ownerDelete && ownerUpload && ownerDownload)
          })
        } else if(permission.includes('staff')) {
          this.setState({
            staffFullAccess: (staffRead && staffCreate && staffUpdate && staffDelete && staffUpload && staffDownload)
          })
        } else if(permission.includes('contact')) {
          this.setState({
            contactFullAccess: (contactRead && contactCreate && contactUpdate && contactDelete && contactUpload && contactDownload)
          })
        }

        this.setState({
          allowUploadClientPortal: showFolderClientPortal ? allowUploadClientPortal : false
        })

        this.props.handleChange(this.state)
      })
    }

  }

  render() {

    const {
      isClientView = false
    } = this.props;

    const {
      adminFullAccess
      , adminRead
      , adminCreate
      , adminDelete
      , adminUpload
      , adminUpdate
      , adminDownload
      , ownerFullAccess
      , ownerRead
      , ownerCreate
      , ownerUpdate
      , ownerDelete
      , ownerUpload 
      , ownerDownload
      , staffFullAccess
      , staffRead
      , staffCreate
      , staffUpdate
      , staffDelete
      , staffUpload
      , staffDownload
      , contactFullAccess
      , contactRead
      , contactCreate
      , contactUpdate
      , contactDelete
      , contactUpload
      , contactDownload
      , showFolderClientPortal
      , allowUploadClientPortal
    } = this.state;

    return (
      <div>
        <div className="-clientfolderpermission-configuration">
          <div className="-folder-configuration">
            <div className="-header">
              <strong>
                Folder Access Permissions
              </strong>
            </div>
            <hr style={{visibility:"hidden"}}/>
            <div className="-body">
              <div className="-setting yt-row space-between">
                <div className="yt-col" style={{textAlign: "center"}}>
                  <p className="-columnHeader">
                    Profiles
                  </p>
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <p className="-columnHeader">
                    Full Access
                  </p>
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <p className="-columnHeader">
                    Read
                    <span className="icon-tooltip" data-tip data-for="permissionRead" >
                      <i className="fas fa-question-circle"/>
                    </span>
                    <ReactTooltip id="permissionRead" place="top" type="info" effect="solid">
                      <span>Allow users to view files only</span>
                    </ReactTooltip>
                  </p>
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <p className="-columnHeader">
                    Create
                    <span className="icon-tooltip" data-tip data-for="permissionCreate" >
                      <i className="fas fa-question-circle"/>
                    </span>
                    <ReactTooltip id="permissionCreate" place="top" type="info" effect="solid">
                      <span>Allow users to create and edit folders</span>
                    </ReactTooltip>
                  </p>
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <p className="-columnHeader">
                    Update
                    <span className="icon-tooltip" data-tip data-for="permissionUpdate" >
                      <i className="fas fa-question-circle"/>
                    </span>
                    <ReactTooltip id="permissionUpdate" place="top" type="info" effect="solid">
                      <span>Allow users to create and edit files and folders</span>
                    </ReactTooltip>
                  </p>
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <p className="-columnHeader">
                    Delete
                    <span className="icon-tooltip" data-tip data-for="permissionDelete" >
                      <i className="fas fa-question-circle"/>
                    </span>
                    <ReactTooltip id="permissionDelete" place="top" type="info" effect="solid">
                      <span>Allow users to delete files and folders</span>
                    </ReactTooltip>
                  </p>
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <p className="-columnHeader">
                    Download
                    <span className="icon-tooltip" data-tip data-for="permissionDownload" >
                      <i className="fas fa-question-circle"/>
                    </span>
                    <ReactTooltip id="permissionDownload" place="top" type="info" effect="solid">
                      <span>Allow users to download files</span>
                    </ReactTooltip>
                  </p>
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <p className="-columnHeader">
                    Upload
                    <span className="icon-tooltip" data-tip data-for="permissionUpload" >
                      <i className="fas fa-question-circle"/>
                    </span>
                    <ReactTooltip id="permissionUpload" place="top" type="info" effect="solid">
                      <span>Allow users to upload files</span>
                    </ReactTooltip>
                  </p>
                </div>
              </div>
              <hr/>
              <div className="-setting yt-row space-between">
                <div className="yt-col" style={{textAlign: "center"}}>
                  <p>
                    <strong>Admin</strong> 
                  </p>
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="adminFullAccess"
                    value={adminFullAccess}
                    checked={adminFullAccess}
                    change={() => this._handleFolderPermission('adminFullAccess')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="adminRead"
                    value={adminRead}
                    checked={adminRead}
                    change={() => this._handleFolderPermission('adminRead')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="adminCreate"
                    value={adminCreate}
                    checked={adminCreate}
                    change={() => this._handleFolderPermission('adminCreate')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="adminUpdate"
                    value={adminUpdate}
                    checked={adminUpdate}
                    change={() => this._handleFolderPermission('adminUpdate')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="adminDelete"
                    value={adminDelete}
                    checked={adminDelete}
                    change={() => this._handleFolderPermission('adminDelete')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="adminDownload"
                    value={adminDownload}
                    checked={adminDownload}
                    change={() => this._handleFolderPermission('adminDownload')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="adminUpload"
                    value={adminUpload}
                    checked={adminUpload}
                    change={() => this._handleFolderPermission('adminUpload')}
                  />
                </div>
              </div>
              <hr/>
              <div className="-setting yt-row space-between">
                <div className="yt-col" style={{textAlign: "center"}}>
                  <p>
                    <strong>Owner</strong>
                  </p>
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="ownerFullAccess"
                    value={ownerFullAccess}
                    checked={ownerFullAccess}
                    change={() => this._handleFolderPermission('ownerFullAccess')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="ownerRead"
                    value={ownerRead}
                    checked={ownerRead}
                    change={() => this._handleFolderPermission('ownerRead')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="ownerCreate"
                    value={ownerCreate}
                    checked={ownerCreate}
                    change={() => this._handleFolderPermission('ownerCreate')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="ownerUpdate"
                    value={ownerUpdate}
                    checked={ownerUpdate}
                    change={() => this._handleFolderPermission('ownerUpdate')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="ownerDelete"
                    value={ownerDelete}
                    checked={ownerDelete}
                    change={() => this._handleFolderPermission('ownerDelete')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="ownerDownload"
                    value={ownerDownload}
                    checked={ownerDownload}
                    change={() => this._handleFolderPermission('ownerDownload')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="ownerUpload"
                    value={ownerUpload}
                    checked={ownerUpload}
                    change={() => this._handleFolderPermission('ownerUpload')}
                  />
                </div>
              </div>
              <hr/>
              <div className="-setting yt-row space-between">
                <div className="yt-col" style={{textAlign: "center"}}>
                  <p>
                    <strong>Staff</strong>
                  </p>
                </div><div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="staffFullAccess"
                    value={staffFullAccess}
                    checked={staffFullAccess}
                    change={() => this._handleFolderPermission('staffFullAccess')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="staffRead"
                    value={staffRead}
                    checked={staffRead}
                    change={() => this._handleFolderPermission('staffRead')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="staffCreate"
                    value={staffCreate}
                    checked={staffCreate}
                    change={() => this._handleFolderPermission('staffCreate')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="staffUpdate"
                    value={staffUpdate}
                    checked={staffUpdate}
                    change={() => this._handleFolderPermission('staffUpdate')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="staffDelete"
                    value={staffDelete}
                    checked={staffDelete}
                    change={() => this._handleFolderPermission('staffDelete')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="staffDownload"
                    value={staffDownload}
                    checked={staffDownload}
                    change={() => this._handleFolderPermission('staffDownload')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="staffUpload"
                    value={staffUpload}
                    checked={staffUpload}
                    change={() => this._handleFolderPermission('staffUpload')}
                  />
                </div>
              </div>
              <hr/>
              <div className="-setting yt-row space-between">
                <div className="yt-col" style={{textAlign: "center"}}>
                  <p>
                    <strong>Contact</strong> 
                  </p>
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="contactFullAccess"
                    value={contactFullAccess}
                    checked={contactFullAccess}
                    change={() => this._handleFolderPermission('contactFullAccess')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="contactRead"
                    value={contactRead}
                    checked={contactRead}
                    change={() => this._handleFolderPermission('contactRead')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="contactCreate"
                    value={contactCreate}
                    checked={contactCreate}
                    change={() => this._handleFolderPermission('contactCreate')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="contactUpdate"
                    value={contactUpdate}
                    checked={contactUpdate}
                    change={() => this._handleFolderPermission('contactUpdate')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="contactDelete"
                    value={contactDelete}
                    checked={contactDelete}
                    change={() => this._handleFolderPermission('contactDelete')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="contactDownload"
                    value={contactDownload}
                    checked={contactDownload}
                    change={() => this._handleFolderPermission('contactDownload')}
                  />
                </div>
                <div className="yt-col" style={{textAlign: "center"}}>
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="contactUpload"
                    value={contactUpload}
                    checked={contactUpload}
                    change={() => this._handleFolderPermission('contactUpload')}
                  />
                </div>
              </div>
            </div>
          </div>
          <hr style={{visibility:"hidden"}}/>
          {
            <div className="-clientportal-configuration">
              <div className="-header">
                <strong>
                  Client Portal Permissions
                </strong>
              </div>
              <hr style={{visibility:"hidden"}}/>
              <div className="-body">
                <div className="-setting yt-row space-between">
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="showFolderClientPortal"
                    value={showFolderClientPortal}
                    checked={showFolderClientPortal}
                    label="Show folder in client portal"
                    change={() => this._handleFolderPermission('showFolderClientPortal')}
                  />
                </div>
                {/* <hr style={{visibility:"hidden"}}/>
                <div className="-setting yt-row space-between">
                  <CheckboxInput
                    classes="permission-checkbox"
                    name="allowUploadClientPortal"
                    value={allowUploadClientPortal}
                    checked={allowUploadClientPortal}
                    label="Allow client upload in client portal"
                    disabled={!showFolderClientPortal}
                    change={() => this._handleFolderPermission('allowUploadClientPortal')}
                  />
                </div> */}
              </div>
            </div> 
          }

        </div>
      </div>
    )
  }
}

const mapStoreToProps = (store) => {
  return {}
}

FolderPermissionTable.defaultProps = {
  
}

export default withRouter(
  connect(
    mapStoreToProps
  )(FolderPermissionTable)
);