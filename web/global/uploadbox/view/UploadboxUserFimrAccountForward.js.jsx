/**
 * View component for /UserAccountForward
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

// import actions
import * as userActions from '../../../resources/user/userActions';
import * as clientActions from '../../../resources/client/clientActions';
import * as clientUserActions from '../../../resources/clientUser/clientUserActions';
import * as firmActions from '../../../resources/firm/firmActions';
import UploadboxAccount from '../components/UploadboxAccount.js.jsx';

// import global components
import Binder from '../../components/Binder.js.jsx';
import brandingName from '../../enum/brandingName.js.jsx';

// import user components
import UserLayout from '../../../resources/user/components/UserLayout.js.jsx';

class UploadboxUserFimrAccountForward extends Binder {
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
    const { dispatch, history, loggedInUser, match, computedMatch } = this.props;
    dispatch(clientActions.fetchListIfNeeded('_firm', computedMatch.params.firmId)).then(clientStore => {
        if (clientStore.success && clientStore.clients) {
            const clients = clientStore.clients.filter(client => client.status === "visible");
            if (clients.length === 1) {
              history.push(`/upload/${clients[0]._id}`);
            }
          }
    });
    dispatch(clientUserActions.fetchListIfNeeded('_user', loggedInUser._id, 'status', 'active'));
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id)).then(firm => {
        if (firm.success && firm.firms) {
          firm.firms.map(f => {
            dispatch(clientActions.fetchListIfNeeded('_firm', f._id)).then(clientStore => {
  
            });
          })
        }
    });    
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
      , match
      , clientUserListId
    } = this.props;

    const isEmpty = (
        !loggedInUser._id
        || !clientStore
        || clientStore.selected.didInvalidate 
        || !clientUserListId.length
    );

    const isFetching = (
    //   !firmList
    //   || firmList.isFetching
      clientStore.selected.isFetching
      || !clientUserListId.length
    )

    const selectedFirm = firmStore.selected.getItem();
    const firmFetching = (
      firmStore.selected.isFetching
    )

    let firmLogo = brandingName.image.logoBlack;
    if(selectedFirm && selectedFirm._id && selectedFirm.logoUrl) {
      console.log("apply logo")
      firmLogo = `/api/firms/logo/${selectedFirm._id}/${selectedFirm.logoUrl}`
    }

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
          : isFetching  ? 
          /** Still fetching things */
          <div className="-loading-hero">
            <div className="u-centerText">
              <div className="loading"></div>
            </div>
          </div>
          : 
          clientUserListId.length ?
          <div className="-account-forward ">
              <section className="section ">
                <div className="yt-container">
                    <div className="yt-row center-horiz with-gutters ">
                    <div className="yt-col full s_80 m_60 l_50">
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
                                <p>All Firm Clients:</p>
                                {
                                    clientUserListId.length > 10 ?
                                    <div style={{ display: "flex" }}>
                                        <div className="space-between">
                                            <Link className="yt-btn small link" to={'/account'}>Back</Link>
                                        </div>
                                        <div className="space-between">
                                            <button className="yt-btn small link" onClick={this._logout}>Log out</button>
                                        </div>                                                                
                                    </div> : null
                                }
                                <div className="-select-account">
                                <ul className="-account-list">
                                    { clientUserListId.map((cu, i) => 
                                    <li key={cu + i} >
                                        <Link className="-account-select-link" to={`/upload/${clientStore.byId[cu]._id}`}>
                                            <span>{clientStore.byId[cu].name}</span>
                                            <i className="-icon fal fa-angle-right"/>
                                        </Link>
                                    </li>
                                    )}
                                </ul>
                                </div>
                                <div style={{ display: "flex" }}>
                                        <div className="space-between">
                                            <Link className="yt-btn small link" to={'/account'}>Back</Link>
                                        </div>
                                        <div className="space-between">
                                            <button className="yt-btn small link" onClick={this._logout}>Log out</button>
                                        </div>                                                                
                                    </div>                               
                            </div>
                        </div>
                    </div>
                </section>
          </div>
          :
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
                        <h4>You can <Link to="/user/login">try another email</Link>, or if you think this is an error please contact <a href={`mailto:${brandingName.email.support}`}>support</a>. </h4>
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
        {/* <UploadboxAccount logout={this._logout} /> */}
      </UserLayout>
    )
  }
}

UploadboxUserFimrAccountForward.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {
  
    const loggedInUser = store.user ? store.user.loggedIn ? store.user.loggedIn.user : null : null;
    let clientUserListId = [];
    if (loggedInUser) {

        if (store.client && store.client.byId) {
            const listsId = Object.keys(store.client.byId);
            clientUserListId = listsId.filter(id => store.client.byId[id].status == "visible" && props.computedMatch.params.firmId == store.client.byId[id]._firm);
            if (clientUserListId) {
                if (clientUserListId.length === 1) {
                    props.history.push(`/upload/${clientUserListId[0]}`);
                }
            }
        }
    }

    console.log("asd", clientUserListId)

    return {
        clientStore: store.client
        , clientUserStore: store.clientUser 
        , firmStore: store.firm
        , loggedInUser
        , clientUserListId
    }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(UploadboxUserFimrAccountForward)
);
