/**
 * Boilerplate code for a new Redux-connected view component.
 * Nice for copy/pasting
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, Switch, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import { DateTime } from 'luxon';

// import actions
import * as clientActions from '../../../client/clientActions'; 

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';
import DeletedRecords from '../../../../global/components/helpers/DeletedRecords.js.jsx';

// import firm components
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';
import NewResourceOptions from './NewResourceOptions.js.jsx';

class ClientSettingsLayout extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      newOptionsOpen: false 
    }
    this._bind(

    )
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
  }

  render() {
    const {
      clientStore 
      , firmStore
      , location 
      , match 
    } = this.props;
    
    // client & firm 
    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();

    let clientFiles;
    if (match.params.firmId && match.params.clientId) {
      clientFiles = [{
        display: "Go to Client Workspace"
        , path: `/firm/${match.params.firmId}/workspaces/${match.params.clientId}/files`
      }]
    }

    return (
      <PracticeLayout isSidebarOpen={false}>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <CloseWrapper
              isOpen={(this.state.newOptionsOpen )}
              closeAction={() => this.setState({newOptionsOpen: false})}
            />
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} otherLinks={clientFiles} />
              <div className="-btns dropdown">
              </div>
            </div>
          </div>
        </div>
        <div className="yt-container fluid">
          <h1 className={`-${selectedClient && selectedClient.status}`}>{selectedClient && selectedClient.name}</h1>
          <div className="tab-bar-nav">
            <ul className="navigation">

              <li>
                <NavLink exact to={`/firm/${match.params.firmId}/clients/${match.params.clientId}`}>Overview</NavLink>
              </li>
              <li>
                <NavLink to={`/firm/${match.params.firmId}/clients/${match.params.clientId}/notifications`}>Notifications</NavLink>
              </li>
              <li>
                <NavLink to={`/firm/${match.params.firmId}/clients/${match.params.clientId}/contacts`}>Contacts</NavLink>
              </li>
              <li>
                <NavLink to={`/firm/${match.params.firmId}/clients/${match.params.clientId}/staff`}>Assigned Staff</NavLink>
              </li>
              {/* <li>
                <NavLink to={`/firm/${match.params.firmId}/clients/${match.params.clientId}/billing`}>Billing</NavLink>
              </li> */}
              {/* <li>
                <NavLink to={`/firm/${match.params.firmId}/clients/${match.params.clientId}/integrations`}>Integrations</NavLink>
              </li> */}
            </ul>
          </div>
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

ClientSettingsLayout.propTypes = {
  dispatch: PropTypes.func.isRequired
}

ClientSettingsLayout.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    addressStore: store.address 
    , clientStore: store.client 
    , clientUserStore: store.clientUser 
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , staffStore: store.staff 
    , staffClientStore: store.staffClient 
    , userStore: store.user
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(ClientSettingsLayout)
);
