/**
 * Boilerplate code for a new Redux-connected view component.
 * Nice for copy/pasting
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as clientActions from '../../../client/clientActions'; 
import * as fileActions from '../../../file/fileActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';
import { TextInput } from '../../../../global/components/forms';
import DeletedRecords from '../../../../global/components/helpers/DeletedRecords.js.jsx';

// import firm components
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';
import UnderlineNav from '../../../../global/components/navigation/UnderlineNav.js.jsx';

// import utilities
import { permissions, routeUtils } from '../../../../global/utils';

class WorkspaceLayout extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      newOptionsOpen: false
      , newWorkflowOptionsOpen: false
      , updateClientNameOpen: false
      , clientName: ''
      , breadcrumbs: {}
    }
    this._bind(
      '_toggleUpdateClientName'
      , '_handleFormChange'
      , '_handleUpdateClientName'
      , '_handleSetBreadcrumbs'
    )

    this.oldFolderId = props.match.params.folderId;
  }

  componentDidMount() {
    const { match } = this.props;
    if (match.params.folderId) {
      this._handleSetBreadcrumbs(match.params.folderId);
    }
  }

  componentWillReceiveProps(nextProps) {
    const nextMatch = nextProps.match;
    const breadcrumbs = _.cloneDeep(this.state.breadcrumbs);
    if (nextMatch.params.folderId && !breadcrumbs[nextMatch.params.folderId]) {
      this._handleSetBreadcrumbs(nextMatch.params.folderId);
    }
  }

  _handleSetBreadcrumbs(folderId) {
    const { match, dispatch, isAllFilesView } = this.props;
    dispatch(fileActions.fetchParentFoldersIfNeeded(folderId, ...routeUtils.listArgsFromObject({ associatedParent: folderId }))).then(json => {
      if (json.success && json.list.length) {
        this.oldFolderId = folderId;
        const breadcrumbs = _.cloneDeep(this.state.breadcrumbs);
        breadcrumbs[folderId] = [];

        let path = `/firm/${match.params.firmId}/`;
        if (match.params.userId) {
          path += `files/${match.params.userId}/personal/`;
        } else if (!match.params.clientId) {
          path += `files/public/`;
        } else if (match.params.clientId) {
          if (isAllFilesView) {
            path += `files/${match.params.clientId}/workspace/`;
          } else {
            path += `workspaces/${match.params.clientId}/files/`;
          }
        }

        json.list.map(file => {
          breadcrumbs[folderId].unshift({ 
            display: file.filename, path: path + file._id + "/folder"
          });
        });
        this.setState({ breadcrumbs });
      }
    });
  }

  componentWillUnmount() {
    this.setState({ breadcrumbs: {} });
    this.oldFolderId = null;
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
  }

  _toggleUpdateClientName() {
    const { clientStore } = this.props;
    this.setState({
      clientName: clientStore.selected.getItem().name 
      , updateClientNameOpen: !this.state.updateClientNameOpen
    }); 
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleUpdateClientName() {
    const { dispatch, clientStore } = this.props; 
    if(this.state.clientName.length > 0) {
      const newClient = _.cloneDeep(clientStore.selected.getItem()); 
      newClient.name = this.state.clientName; 
      dispatch(clientActions.sendUpdateClient(newClient)).then((json) => {
        if(json.success) {
          this.setState({updateClientNameOpen: false, clientName: ''}); 
        }
      })
    } else {
      alert("Text field cannot be blank."); 
    }
  }

  render() {
    const {
      clientStore 
      , firmStore
      , location 
      , match
      , userStore
      , loggedInUser
      , staffStore
      , selectedStaff
      , ownerPermissions
      , isAllFilesView
    } = this.props;
    const { updateClientNameOpen } = this.state;
    const breadcrumbs = _.cloneDeep(this.state.breadcrumbs);
    
    // client & firm 
    const selectedClient = clientStore.selected.getItem();


    let headerTitle;
    let clientOverview;
    
    if (match.params.userId && selectedStaff) {
      if (loggedInUser._id == match.params.userId) {
        headerTitle = "(You) | Personal Files";
      } else {
        headerTitle = `${selectedStaff.firstname} ${selectedStaff.lastname} | Personal Files`;
      }
    } else if (!match.params.clientId) {
      headerTitle = "General Files";
    } else if (match.params.firmId && match.params.clientId && !isAllFilesView && ownerPermissions) {
      clientOverview = [{
        display: "Go to Client Settings"
        , path: `/firm/${match.params.firmId}/clients/${match.params.clientId}`
      }]
    }

    const links = [
      { path: `/firm/${match.params.firmId}/workspaces/${match.params.clientId}/files`, display: "Files" }
      , { path: `/firm/${match.params.firmId}/workspaces/${match.params.clientId}/request-list`, display: "Request Lists" }
      , { path: `/firm/${match.params.firmId}/workspaces/${match.params.clientId}/activity`, display: "Activity" }
      , { path: `/firm/${match.params.firmId}/workspaces/${match.params.clientId}/quick-tasks`, display: "Quick Tasks" }
      , { path: `/firm/${match.params.firmId}/workspaces/${match.params.clientId}/messages`, display: "Messages" }
      // , { path: `/firm/${match.params.firmId}/workspaces/${match.params.clientId}/invoices`, display: "Invoices" }
      // , { path: `/firm/${match.params.firmId}/workspaces/${match.params.clientId}/payments`, display: "Payments" }
      , { path: `/firm/${match.params.firmId}/workspaces/${match.params.clientId}/details`, display: "Details" }
      , { path: `/firm/${match.params.firmId}/workspaces/${match.params.clientId}/notifications`, display: "Notifications" }
      , { path: `/firm/${match.params.firmId}/workspaces/${match.params.clientId}/users`, display: "Users" }
    ];


    let newBreadcrumbs = location.state.breadcrumbs;
    if (match.params.folderId && breadcrumbs[match.params.folderId] && breadcrumbs[match.params.folderId].length) {
      newBreadcrumbs = location.state.breadcrumbs.concat(breadcrumbs[match.params.folderId]);
    } else if (match.params.folderId && this.oldFolderId && breadcrumbs[this.oldFolderId]) {
      newBreadcrumbs = location.state.breadcrumbs.concat(breadcrumbs[this.oldFolderId]);
    }
    
    return (
      <PracticeLayout isSidebarOpen={false}>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <CloseWrapper
              isOpen={(this.state.newOptionsOpen || this.state.newWorkflowOptionsOpen )}
              closeAction={() => this.setState({newOptionsOpen: false, newWorkflowOptionsOpen: false})}
            />
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={newBreadcrumbs} otherLinks={clientOverview} />
            </div>
          </div>
        </div>
        <div className="yt-container fluid">
          <div>
            {updateClientNameOpen ? 
              <div>
                {/* <h1>{selectedClient ? selectedClient.name : <span className="loading"/>}</h1> */}
                <TextInput
                  change={this._handleFormChange}
                  name="clientName"
                  value={this.state.clientName}
                  placeholder="Enter new client name here..."
                />
                <button className="yt-btn x-small link" onClick={this._toggleUpdateClientName}>Cancel</button>
                <button className="yt-btn x-small success" onClick={this._handleUpdateClientName}>Save</button>
              </div>
            :
              <div>
                <h1 onClick={headerTitle ? null : this._toggleUpdateClientName} className={`-${match.params.clientId && selectedClient && selectedClient.status}`}>
                  {headerTitle ? headerTitle : selectedClient && selectedClient.name }
                </h1>
              </div>
            }
          </div>
          {
            isAllFilesView ? null :
            <div className="tab-bar-nav">
              <UnderlineNav links={links} classes="-client-workspace" />
            </div>
          }
          <div className="-workspace-content">
            {
              match.params.clientId && selectedClient && selectedClient.status === "deleted" ? 
              <DeletedRecords textErrorDisplay="The client has been deleted." />
              :
              this.props.children
            }
          </div>
        </div>
        
      </PracticeLayout>
    )
  }
}

WorkspaceLayout.propTypes = {
  dispatch: PropTypes.func.isRequired
}

WorkspaceLayout.defaultProps = {

}


const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  const match = props.match;
  const location = props.location;
  const userStore = store.user;
  const staffStore = store.staff;
  const loggedInUser = store.user.loggedIn.user;
  const selectedStaff = userStore.byId[match.params.userId] && match.params.userId ? userStore.byId[match.params.userId] : null;
  const ownerPermissions = permissions.isStaffOwner(staffStore, loggedInUser, match.params.firmId);
  const isAllFilesView = location.pathname.split('/')[3] ? location.pathname.split('/')[3] === "files" : false;

  return {
    addressStore: store.address 
    , clientStore: store.client 
    , clientUserStore: store.clientUser 
    , firmStore: store.firm 
    , loggedInUser
    , staffStore
    , staffClientStore: store.staffClient 
    , userStore
    , fileStore: store.file
    , selectedStaff
    , isAllFilesView
    , ownerPermissions
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(WorkspaceLayout)
);
