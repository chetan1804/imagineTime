/**
 * Basic mobile navigation menu to be used with PortalTopNav
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import actions
import * as userActions from '../../../resources/user/userActions';

// import components
import Binder from '../../components/Binder.js.jsx';

class PracticeMobileNav extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      angleWorkspaces: localStorage.getItem("angleWorkspaces") || "up"
      , angleClientSettings: localStorage.getItem("angleClientSettings") || "up"
      , angleFirmSettings: localStorage.getItem("angleFirmSettings") || "up"
    }
    this._bind(
      '_logout'
    )
  }

  componentWillUnmount() {
    localStorage.setItem("angleWorkspaces", _.cloneDeep(this.state.angleWorkspaces));
    localStorage.setItem("angleClientSettings", _.cloneDeep(this.state.angleClientSettings));
    localStorage.setItem("angleFirmSettings", _.cloneDeep(this.state.angleFirmSettings));
  }

  _logout(e) {
    const { closeAction, dispatch, history } = this.props;
    dispatch(userActions.sendLogout()).then((action) => {
      if(action.success) {
        // redirect to index
        closeAction();
        history.push('/');
      } else {
        alert("ERROR LOGGING OUT - " + action.message);
      }
    })
  }

  render() {
    const { 
      clientStore
      , closeAction
      , firmStore 
      , loggedInUser 
      , isOpen
      , match 
    } = this.props;

    const {
      angleWorkspaces
      , angleClientSettings
      , angleFirmSettings
    } = this.state;

    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();
    const clients = clientStore.util.getList('_user', loggedInUser._id);

    const isFetching = (
      clientStore.selected.isFetching
      || firmStore.selected.isFetching
    )

    const clientId = match.params.clientId;
    const client = isFetching ? null : clientId && clientStore && clientStore.byId && clientStore.byId[clientId] ? clientStore.byId[clientId] : null;

    return(
      <TransitionGroup>
      {isOpen ?
        <CSSTransition
          timeout={500}
          classNames="mobile-menu-anim"
        >
          <div className="mobile-menu main-nav-menu">
            <div className="yt-row right">
              <div className="-close-icon" onClick={closeAction}>
                <i className="fal fa-lg fa-times"/>
              </div>
            </div>
            <ul className="-user-menu">
              {/* <li>
                <Link className="-link"  to={`/portal/${match.params.clientId}/dashboard`}>A</Link>
              </li>
              <hr/> */}
              <br/>
              <li>
                <i className={`-icon fal fa-angle-${angleWorkspaces} u-pullRight`} onClick={() => this.setState({ angleWorkspaces: angleWorkspaces === "up" ? "down" : "up" })} />
                <Link className="-link" to={`/firm/${match.params.firmId}/workspaces`}>
                  <i className="fal fa-users-class"/>All Workspaces
                </Link>
                <div style={{ padding: "10px 0 0 33px" }}><small><i>{clientId && client && client.name ? `with ${client.name}` : "No client selected."}</i></small></div>
                <div className="-container-child-menu" style={angleWorkspaces === "up" ? { height: "288px" } : { height: 0 }}>
                  <ul className="-user-menu">
                    <li>
                      {
                        clientId ? 
                        <Link className="-link" to={`/firm/${match.params.firmId}/workspaces/${clientId}/files`}>
                          <i className="fal fa-file"/>Files
                        </Link>
                        :
                        <a className="-link -disabled-link" disabled={true} onClick={null}><i className="fal fa-file"/>Files</a>
                      }
                    </li>
                    <li>
                      {
                        clientId ? 
                        <Link className="-link" to={`/firm/${match.params.firmId}/workspaces/${clientId}/request-list`} >
                          <i className="fal fa-list"/>Request Lists
                        </Link>
                        :
                        <a className="-link -disabled-link" disabled={true} onClick={null}><i className="fal fa-list"/>Request Lists</a>
                      }
                    </li>
                    <li>
                      {
                        clientId ? 
                        <Link className="-link" to={`/firm/${match.params.firmId}/workspaces/${clientId}`} >
                          <i className="fal fa-chart-bar"/>Activity
                        </Link>
                        :
                        <a className="-link -disabled-link" disabled={true} onClick={null}><i className="fal fa-chart-bar"/>Activity</a>
                      }
                    </li>
                    <li>
                      {
                        clientId ? 
                        <Link className="-link" to={`/firm/${match.params.firmId}/workspaces/${clientId}/quick-tasks`} >
                          <i className="fal fa-tasks"/>Quick Tasks
                        </Link>
                        :
                        <a className="-link -disabled-link" disabled={true} onClick={null}><i className="fal fa-tasks"/>Quick Tasks</a>
                      }
                    </li>
                    <li>
                      {
                        clientId ? 
                        <Link className="-link" to={`/firm/${match.params.firmId}/workspaces/${clientId}/messages`} >
                          <i className="fal fa-envelope-open-text"/>Messages
                        </Link>
                        :
                        <a className="-link -disabled-link" disabled={true} onClick={null}><i className="fal fa-envelope-open-text"/>Messages</a>
                      }
                    </li>
                    <li>
                      {
                        clientId ? 
                        <Link className="-link" to={`/firm/${match.params.firmId}/workspaces/${clientId}/details`} >
                          <i className="fal fa-address-card"/>Details
                        </Link>
                        :
                        <a className="-link -disabled-link" disabled={true} onClick={null}><i className="fal fa-address-card"/>Details</a>
                      }
                    </li>
                    <li>
                      {
                        clientId ? 
                        <Link className="-link" to={`/firm/${match.params.firmId}/workspaces/${clientId}/notifications`} >
                          <i className="fal fa-toggle-on"/>Notifications
                        </Link>
                        :
                        <a className="-link -disabled-link" disabled={true} onClick={null}><i className="fal fa-toggle-on"/>Notifications</a>
                      }
                    </li>
                    <li>
                      {
                        clientId ? 
                        <Link className="-link" to={`/firm/${match.params.firmId}/workspaces/${clientId}/users`} >
                          <i className="fal fa-users"/>Users
                        </Link>
                        :
                        <a className="-link -disabled-link" disabled={true} onClick={null}><i className="fal fa-users"/>Users</a>
                      }
                    </li>
                  </ul>
                </div>
              </li>
              <li>
                <Link className="-link" to={`/firm/${match.params.firmId}/contacts`} >
                  <i className="fal fa-address-card"/>All Contacts
                </Link>
              </li>
              <li>
                <Link className="-link" to={`/firm/${match.params.firmId}/files`}>
                  <i className="fal fa-cabinet-filing"/>All Files
                </Link>
              </li>
              <li>
                <i className={`-icon fal fa-angle-${angleClientSettings} u-pullRight`} onClick={() => this.setState({ angleClientSettings: angleClientSettings === "up" ? "down" : "up" })} />
                <Link className="-link" to={`/firm/${match.params.firmId}/clients`}>
                  <i className="fal fa-users-cog"/>Client Settings
                </Link>
                <div style={{ padding: "10px 0 0 33px" }}><small><i>{clientId && client && client.name ? `with ${client.name}` : "No client selected."}</i></small></div>
                <div className="-container-child-menu" style={angleClientSettings === "up" ? { height: "144px" } : { height: 0 }}>
                  <ul className="-user-menu">
                    <li>
                      {
                        clientId ? 
                        <Link className="-link" to={`/firm/${match.params.firmId}/clients/${clientId}`}>
                          <i className="fal fa-address-card"/>Overview
                        </Link>
                        :
                        <a className="-link -disabled-link" disabled={true} onClick={null}><i className="fal fa-address-card"/>Overview</a>
                      }
                    </li>
                    <li>
                      {
                        clientId ? 
                        <Link className="-link" to={`/firm/${match.params.firmId}/clients/${clientId}/notifications`}>
                          <i className="fal fa-toggle-on"/>Notifications
                        </Link>
                        :
                        <a className="-link -disabled-link" disabled={true} onClick={null}><i className="fal fa-toggle-on"/>Notifications</a>
                      }
                    </li>
                    <li>
                      {
                        clientId ? 
                        <Link className="-link" to={`/firm/${match.params.firmId}/clients/${clientId}/contacts`}>
                          <i className="fal fa-users"/>Contacts
                        </Link>
                        :
                        <a className="-link -disabled-link" disabled={true} onClick={null}><i className="fal fa-users"/>Contacts</a>
                      }
                    </li>
                    <li>
                      {
                        clientId ? 
                        <Link className="-link" to={`/firm/${match.params.firmId}/clients/${clientId}/staff`}>
                          <i className="fal fa-users"/>Assigned Staff
                        </Link>
                        :
                        <a className="-link -disabled-link" disabled={true} onClick={null}><i className="fal fa-users"/>Assigned Staff</a>
                      }
                    </li>
                  </ul>
                </div>
              </li>
              <li>
                <i className={`-icon fal fa-angle-${angleFirmSettings} u-pullRight`} onClick={() => this.setState({ angleFirmSettings: angleFirmSettings === "up" ? "down" : "up" })} />
                <Link className="-link" to={`/firm/${match.params.firmId}/settings`}>
                  <i className="fal fa-sliders-h"/>Firm Settings
                </Link>
                <div className="-container-child-menu" style={angleFirmSettings === "up" ? { height: "180px" } : { height: 0 }}>
                  <ul className="-user-menu" style={{ paddingTop: "10px" }}>
                    <li>
                      <Link className="-link" to={`/firm/${match.params.firmId}/settings`}>
                        <i className="fal fa-address-card"/>Overview
                      </Link>
                    </li>
                    <li>
                      <Link className="-link" to={`/firm/${match.params.firmId}/settings/staff`}>
                        <i className="fal fa-users"/>Members
                      </Link>
                    </li>
                    <li>
                      <Link className="-link" to={`/firm/${match.params.firmId}/settings/tags`}>
                        <i className="fal fa-tags"/>Custom Tags
                      </Link>
                    </li>
                    <li>
                      <Link className="-link" to={`/firm/${match.params.firmId}/settings/advanced`}>
                        <i className="fal fa-cogs"/>Advanced Settings
                      </Link>
                    </li>
                    <li>
                      <Link className="-link" to={`/firm/${match.params.firmId}/settings/folder-templates`}>
                        <i className="fal fa-folders"/>Folder Templates
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>
              <hr/>
              <li>
                <Link className="-link" to="/user/profile">My Profile <i className="fal fa-user u-pullRight"/></Link>
              </li>
              <hr/>
              <li>
                <div className="-action" onClick={this._logout}>Log out</div>
              </li>
            </ul>
          </div>
        </CSSTransition>
        :
        null
      }
    </TransitionGroup>
    )
  }
}

PracticeMobileNav.propTypes = {
  closeAction: PropTypes.func.isRequired
  , dispatch: PropTypes.func.isRequired
  , isOpen: PropTypes.bool.isRequired
}

const mapStoreToProps = (store) => {
  return {
    clientStore: store.client 
    , firmStore: store.firm 
    , fileStore: store.file
    , loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeMobileNav)
);
