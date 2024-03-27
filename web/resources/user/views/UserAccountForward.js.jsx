/**
 * View component for /user/forward
 *
 * Display a list of the logged in user's accounts so they can select one.
 * If they only have one account they are redirected there.
 * If they haven't onboarded they are redirected to the user/finish flow.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, Redirect, withRouter } from 'react-router-dom';

// import third-party libraries
import classNames from 'classnames';
import { Helmet } from 'react-helmet';
import queryString from 'query-string';
import axios from 'axios';

// import actions
import * as userActions from '../userActions';
import * as clientActions from '../../client/clientActions';
import * as clientUserActions from '../../clientUser/clientUserActions';
import * as firmActions from '../../firm/firmActions';
import * as staffActions from '../../staff/staffActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import FirmDomainForwarder from '../../../global/components/navigation/FirmDomainForwarder.js.jsx';
import brandingName from '../../../global/enum/brandingName.js.jsx';

// import user components
import UserLayout from '../components/UserLayout.js.jsx';

class UserAccountForward extends Binder {
  constructor(props) {
    super(props);
    this.state = {
    }
    this._bind(
      '_logout'
      // , '_setClient' // TODO: Investigate this further 
    );
  }

  componentDidMount() {
    const { dispatch, loggedInUser, history } = this.props;
    dispatch(firmActions.fetchSingleFirmByDomain());
    if (window && window.currentUser && window.currentUser._id && loggedInUser && loggedInUser) {
      dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
      dispatch(clientUserActions.fetchListIfNeeded('_user', loggedInUser._id, 'status', 'active'));
      dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
      dispatch(staffActions.fetchListIfNeeded('_user', loggedInUser._id, 'status', 'active'));
    }
  }

  _logout() {
    const { dispatch, history } = this.props;
    dispatch(userActions.sendLogout()).then((action) => {
      if(action.success) {
        // redirect to index
        localStorage.clear();
        history.push('/');
      } else {
        alert("ERROR LOGGING OUT - " + action.message);
      }
    })
  }

  /**
   * TODO: investigate trying to set the logged in client/staff objects to see if we can get
   * the redirects to fire (if needed) before the dispatches fire in componentDidMount 
   */
  // _setClient(clientId) {
  //   console.log('set client', clientId)
  //   const { dispatch } = this.props;
  //   dispatch(clientUserActions.fetchClientUserLoggedInByClientIfNeeded(clientId))
  // }

  render() {
    const { 
      clientStore 
      , clientUserStore
      , firmStore 
      , loggedInUser 
      , staffStore
    } = this.props;

    const { from } = this.props.location.state || null;

    // get clientUser list 
    const clientUserList = clientUserStore.util.getListInfo('_user', loggedInUser._id, 'status', 'active');
    const clientUserListItems = clientUserStore.util.getList('_user', loggedInUser._id, 'status', 'active');

    // get client list 
    const clientListItems = clientUserListItems ? clientStore.util.getList('_id', clientUserListItems.map(cu => cu._client)) : [];
    
    // get staff list 
    const staffList = staffStore.util.getListInfo('_user', loggedInUser._id, 'status', 'active')    
    const staffListItems = staffStore.util.getList('_user', loggedInUser._id, 'status', 'active')

    // get firm list 
    const firmList = firmStore.lists && firmStore.lists._user ? firmStore.lists._user[loggedInUser._id] : null;
    const firmListItems = firmStore.util.getList('_user', loggedInUser._id);
    let isEmpty = !loggedInUser._id;

    const isFetching = (
      !clientUserListItems
      || !clientUserList
      || clientUserList.isFetching
      || !staffListItems
      || !staffList
      || staffList.isFetching
      || !firmList
      || firmList.isFetching
    )

    const clientUsersEmpty = (
      !clientUserListItems
      || !clientUserList
      || !firmListItems
    );

    const staffEmpty = (
      !staffListItems
      || !staffList
      || !firmListItems
    );

    const userHasOnboarded = (
      loggedInUser.onBoarded
    )

    const selectedFirm = firmStore.selected.getItem();

    const firmEmpty = (
      !selectedFirm
      || !selectedFirm._id
      || firmStore.selected.didInvalidate
    );

    const firmFetching = (
      firmStore.selected.isFetching
    )


    let firmLogo = brandingName.image.logoBlack;
    if(selectedFirm && selectedFirm._id && selectedFirm.logoUrl) {
      console.log("apply logo")
      firmLogo = `/api/firms/logo/${selectedFirm._id}/${selectedFirm.logoUrl}`
    }

    console.log('window.appUrl', window.appUrl)

    return (
      <UserLayout>
        <Helmet><title>Select Your Account</title></Helmet>
        { isEmpty ?
          ( isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div> 
            : 
            <h2>Hmm.  You got here without being a user... That shouldn't happen. </h2>
          )
          : isFetching ? 
          /** Still fetching things */
          <div className="-loading-hero">
            <div className="u-centerText">
              <div className="loading"></div>
            </div>
          </div>
          : !clientUsersEmpty && clientUserListItems.length > 0 && !staffEmpty && staffListItems.length > 0 ?
          /** User has both clientUser accounts and staff accounts - show both lists */
          <div className="-account-forward ">
            <section className="section ">
              <div className="yt-container">
                <div className="yt-row center-horiz with-gutters ">
                  <div className="yt-col full s_80 m_60 l_50">
                    <div style={{width: "50%", marginTop: "64px"}}>
                      { firmFetching ? 
                        <div className="loading"></div>
                        : 
                        <img src={firmLogo}/>
                      }
                    </div>
                    <h1>Welcome back, {loggedInUser.firstname}!</h1>
                    <p className="u-muted">Select an account to continue.</p>
                  </div>
                </div>
              </div>
            </section>
            <section className="section ">
              <div className="yt-container">
                <div className="yt-row center-horiz with-gutters ">
                  <div className="yt-col full s_80 m_60 l_50">
                    <p>My client accounts:</p>
                    <div className="-select-account">
                      <ul className="-account-list">
                        { clientUserListItems.map((cu, i) => 
                          <li key={cu._id + i} >
                            { firmStore.byId[cu._firm] && firmStore.byId[cu._firm].domain
                            ?
                              <a className="-account-select-link" href={`https://${firmStore.byId[cu._firm].domain}/portal/${cu._client}`}>
                                <span>{clientStore.byId[cu._client] ? clientStore.byId[cu._client].name : ''}</span>
                                <i className="-icon fal fa-angle-right"/>
                              </a>
                            :
                            !window.appUrl.includes('localhost') ?
                              <a className="-account-select-link" href={`https://${window.appUrl}/portal/${cu._client}`}>
                                <span>{clientStore.byId[cu._client] ? clientStore.byId[cu._client].name : ''}</span>
                                <i className="-icon fal fa-angle-right"/>
                              </a>
                            :
                              <a className="-account-select-link" href={`http://${window.appUrl}/portal/${cu._client}`}>
                                <span>{clientStore.byId[cu._client] ? clientStore.byId[cu._client].name : ''}</span>
                                <i className="-icon fal fa-angle-right"/>
                              </a>
                            }
                          </li>
                        )}
                      </ul>
                    </div>
                    <br/>
                    <br/>

                    <div className="yt-row space-between">
                      <button className="yt-btn small link " onClick={this._logout}>Log out</button>
                      {loggedInUser.admin ? 
                        <Link to="/admin" className="yt-btn small link">Go to admin</Link>
                        :
                        null  
                      }
                    </div>
                  </div>
                </div>
              </div>
            </section>            
            <section className="section gray-bg -firm-list">
              <div className="yt-container">
                <div className="yt-row center-horiz with-gutters ">
                  <div className="yt-col full s_80 m_60 l_50">
                    <p>My firms:</p>
                    <div className="-select-account">
                      <ul className="-account-list">
                        { staffListItems.map((staff, i) => 
                          <li key={staff._id + i} >
                            { firmStore.byId[staff._firm] && firmStore.byId[staff._firm].domain
                            ?
                              <a className="-account-select-link" href={`https://${firmStore.byId[staff._firm].domain}/firm/${staff._firm}`}>
                                <span>{firmStore.byId[staff._firm] ? firmStore.byId[staff._firm].name : ''}</span>
                                <i className="-icon fal fa-angle-right"/>
                              </a>
                            :
                            !window.appUrl.includes('localhost')
                            ?
                              <a className="-account-select-link" href={`https://${window.appUrl}/firm/${staff._firm}`}>
                                <span>{firmStore.byId[staff._firm] ? firmStore.byId[staff._firm].name : ''}</span>
                                <i className="-icon fal fa-angle-right"/>
                              </a>
                            :
                              <a className="-account-select-link" href={`http://${window.appUrl}/firm/${staff._firm}`}>
                                <span>{firmStore.byId[staff._firm] ? firmStore.byId[staff._firm].name : ''}</span>
                                <i className="-icon fal fa-angle-right"/>
                              </a>
                            }
                          </li>
                        )}
                      </ul>
                    </div>
                    <br/>
                    <br/>
                    <div className="yt-row space-between">
                      <button className="yt-btn small link " onClick={this._logout}>Log out</button>
                      {loggedInUser.admin ? 
                        <Link to="/admin" className="yt-btn small link">Go to admin</Link>
                        :
                        null  
                      }
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
          : !clientUsersEmpty && clientUserListItems.length > 1 ?
          /** User has more than one client account - show list  */
          <div className="-account-forward ">
            <section className="section ">
              <div className="yt-container">
                <div className="yt-row center-horiz with-gutters ">
                  <div className="yt-col full s_80 m_60 l_50">
                    <div style={{width: "50%", marginTop: "64px"}}>
                      { firmFetching ? 
                        <div className="loading"></div>
                        : 
                        <img src={firmLogo}/>
                      }
                    </div>
                    <h1>Welcome back, {loggedInUser.firstname}!</h1>
                    <p className="u-muted">Select an account to continue.</p>
                  </div>
                </div>
              </div>
            </section>
            <section className="section ">
              <div className="yt-container">
                <div className="yt-row center-horiz with-gutters ">
                  <div className="yt-col full s_80 m_60 l_50">
                    <div className="-select-account">
                      <ul className="-account-list">
                        { clientUserListItems.map((cu, i) => 
                          <li key={cu._id + i} >
                            { firmStore.byId[cu._firm] && firmStore.byId[cu._firm].domain
                            ?
                              <a className="-account-select-link" href={`https://${firmStore.byId[cu._firm].domain}/portal/${cu._client}`}>
                                <span>{clientStore.byId[cu._client] ? clientStore.byId[cu._client].name : ''}</span>
                                <i className="-icon fal fa-angle-right"/>
                              </a>
                            :
                            !window.appUrl.includes('localhost')
                            ?
                              <a className="-account-select-link" href={`https://${window.appUrl}/portal/${cu._client}`}>
                                <span>{clientStore.byId[cu._client] ? clientStore.byId[cu._client].name : ''}</span>
                                <i className="-icon fal fa-angle-right"/>
                              </a>
                            :
                              <a className="-account-select-link" href={`http://${window.appUrl}/portal/${cu._client}`}>
                                <span>{clientStore.byId[cu._client] ? clientStore.byId[cu._client].name : ''}</span>
                                <i className="-icon fal fa-angle-right"/>
                              </a>
                            }
                          </li>
                        )}
                      </ul>
                    </div>
                    <br/>
                    <br/>
                    <div className="yt-row space-between">
                      <button className="yt-btn small link " onClick={this._logout}>Log out</button>
                      {loggedInUser.admin ? 
                        <Link to="/admin" className="yt-btn small link">Go to admin</Link>
                        :
                        null  
                      }
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
          : !staffEmpty && staffListItems.length > 1 ?
          /** User has more than one staff account - show list  */
          <div className="-account-forward ">
          <section className="section gray-bg ">
            <div className="yt-container">
              <div className="yt-row center-horiz with-gutters ">
                <div className="yt-col full s_80 m_60 l_50">
                  <div style={{width: "50%", marginTop: "64px"}}>
                    { firmFetching ? 
                      <div className="loading"></div>
                      : 
                      <img src={firmLogo}/>
                    }
                  </div>
                  <h1>Welcome back, {loggedInUser.firstname}!</h1>
                  <p className="u-muted">Select a firm to continue.</p>
                </div>
              </div>
            </div>
          </section>
          <section className="section gray-bg -firm-list">
            <div className="yt-container">
              <div className="yt-row center-horiz with-gutters ">
                <div className="yt-col full s_80 m_60 l_50">
                  <div className="-select-account">
                    <ul className="-account-list">
                      { staffListItems.map((staff, i) => 
                        <li key={staff._id + i} >
                          { firmStore.byId[staff._firm] && firmStore.byId[staff._firm].domain
                          ?
                            <a className="-account-select-link" href={`https://${firmStore.byId[staff._firm].domain}/firm/${staff._firm}`}>
                              <span>{firmStore.byId[staff._firm] ? firmStore.byId[staff._firm].name : ''}</span>
                              <i className="-icon fal fa-angle-right"/>
                            </a>
                          :
                          !window.appUrl.includes('localhost')
                          ?
                            <a className="-account-select-link" href={`https://${window.appUrl}/firm/${staff._firm}`}>
                              <span>{firmStore.byId[staff._firm] ? firmStore.byId[staff._firm].name : ''}</span>
                              <i className="-icon fal fa-angle-right"/>
                            </a>
                          :
                            <a className="-account-select-link" href={`http://${window.appUrl}/firm/${staff._firm}`}>
                              <span>{firmStore.byId[staff._firm] ? firmStore.byId[staff._firm].name : ''}</span>
                              <i className="-icon fal fa-angle-right"/>
                            </a>
                          }
                        </li>
                      )}
                    </ul>
                  </div>
                  <br/>
                  <br/>
                  <div className="yt-row space-between">
                    <button className="yt-btn small link " onClick={this._logout}>Log out</button>
                          {loggedInUser.admin ? 
                          <Link to="/admin" className="yt-btn small link">Go to admin</Link>
                          :
                          null  
                        }
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
          : !clientUsersEmpty && clientUserListItems.length === 1 ?
          /** User has only one client account - Redirect */
            // !userHasOnboarded ?
            //   /** User has not on-boarded. Redirect.  */
            //   <FirmDomainForwarder 
            //     firm={firmStore.byId[clientUserListItems[0]._firm]}
            //     path={`/user/finish/welcome`}
            //   />
            //   // <Redirect to={`/user/finish/welcome`}/>
            //   :
              <FirmDomainForwarder 
                firm={firmStore.byId[clientUserListItems[0]._firm]}
                path={`/portal/${clientUserListItems[0]._client}/files`}
              />
          : !staffEmpty && staffListItems.length === 1 ?
          /** User has only one staff account - Redirect  */
          // !userHasOnboarded ? 
          // /** User has not on-boarded. Redirect.  */
          // <FirmDomainForwarder 
          //   firm={firmStore.byId[staffListItems[0]._firm]}
          //   path={`/user/finish/welcome`}
          // />
          // // <Redirect to={`/user/finish/welcome`}/>
          // :
          // <Redirect to={`/firm/${staffListItems[0]._firm}/dashboard`}/>
          <FirmDomainForwarder 
            firm={firmStore.byId[staffListItems[0]._firm]}
            // This was causing infinite redirects if they were coming from a route that they weren't allowed to access.
            // path={from ? from.pathname : `/firm/${staffListItems[0]._firm}/workspaces`}
            path={`/firm/${staffListItems[0]._firm}/workspaces`}
          />
          // <Redirect to={`/firm/${staffListItems[0]._firm}/workspaces`}/>
          : (loggedInUser.roles && loggedInUser.roles.indexOf('admin') > -1) || loggedInUser.admin ? 
          /** DEPREC - old style roles array - User is admin - Redirect to /admin */
          <FirmDomainForwarder 
            firm={null}
            path={`/admin`}
          />
          // <Redirect to={`/admin`}/>
          :
          /** User logged in, but has no client, staff or admin account  */
          <section className="section white-bg the-404">
            <div className="hero flex three-quarter ">
              <div className="yt-container slim">
                <div className="yt-row center-horiz with-gutters ">
                  <div className="yt-col full s_80 m_60 l_50">
                    <div style={{width: "50%", marginTop: "64px"}}>
                      { firmFetching ? 
                        <div className="loading"></div>
                        : 
                        <img src={firmLogo}/>
                      }
                    </div>
                    <h1> Whoops! </h1>
                    <h3 className="light-weight">Looks like you don't have an active account.</h3>
                    <hr/>
                    <h4>You can <Link to="/user/login">try another email</Link>, or if you think this is an error please contact <a href={`mailto:${brandingName.email.support}`}>{brandingName.email.support}</a>. </h4>
                    <br/>
                    <br/>
                    <div className="yt-row space-between">
                      <button className="yt-btn small link " onClick={this._logout}>Log out</button>
                      {loggedInUser.admin ? 
                        <Link to="/admin" className="yt-btn small link">Go to admin</Link>
                        :
                        null  
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        }
      </UserLayout>
    )
  }
}

UserAccountForward.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  return {
    clientStore: store.client
    , clientUserStore: store.clientUser 
    , firmStore: store.firm
    , loggedInUser: store.user.loggedIn.user
    , staffStore: store.staff 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(UserAccountForward)
);
