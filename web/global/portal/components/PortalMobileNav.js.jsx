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

class PortalMobileNav extends Binder {
  constructor(props) {
    super(props);
    this._bind(
      '_logout'
    )
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

    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();
    const clients = clientStore.util.getList('_user', loggedInUser._id);

    const isFetching = (
      clientStore.selected.isFetching
      || firmStore.selected.isFetching
    )
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
              <li>
                <Link className="-link"  to={`/portal/${match.params.clientId}/dashboard`}>Dashboard</Link>
              </li>
              <hr/>
              <li>
                <Link className="-link" to={`/portal/${match.params.clientId}/client-workflows`}>My Tasks <i className="fal fa-tasks u-pullRight"/></Link>
              </li>
              <li>
                <Link className="-link" to={`/portal/${match.params.clientId}/files`} >Files <i className="fal fa-archive u-pullRight"/></Link>
              </li>
              <li>
                <Link className="-link" to={`/portal/${match.params.clientId}/quick-tasks`} >Quick Tasks <i className="fal fa-tasks u-pullRight"/></Link>
              </li>
              <li>
                <Link className="-link" to={`/portal/${match.params.clientId}/request`} >Request Lists <i className="fal fa-list u-pullRight"/></Link>
              </li>
              <li>
                <Link className="-link" to={`/portal/${match.params.clientId}/request-task`} >Request List Tasks <i className="fal fa-list u-pullRight"/></Link>
              </li>
              <li>
                <Link className="-link" to={`/portal/${match.params.clientId}/client-posts`} >Message Board <i className="fal fa-envelope-open-text u-pullRight"/></Link>
              </li>
              <li>
                <Link className="-link" to={`/portal/${match.params.clientId}/account`}>Account <i className="fal fa-sliders-h u-pullRight"/></Link>
              </li>
              { clients && clients.length > 1 ?
                <div>
                  <hr/>
                  <small>Switch accounts:</small>
                  {clients.map((c, i) =>
                    <li key={c._id + i}>
                      <Link className="-link"  to={`/portal/${c._id}`}>{c.name} <i className="fal fa-angle-right u-pullRight"/></Link>
                    </li>
                  )}
                </div>
                :
                null 
              }
              <hr/>
              <li>
                <Link className="-link" to="/user/profile">My Profile <i className="fal fa-user u-pullRight"/></Link>
              </li>
              
              <hr/>
              <li>
                <a className="-link" href="/">Help</a>
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

PortalMobileNav.propTypes = {
  closeAction: PropTypes.func.isRequired
  , dispatch: PropTypes.func.isRequired
  , isOpen: PropTypes.bool.isRequired
}

const mapStoreToProps = (store) => {
  return {
    clientStore: store.client 
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PortalMobileNav)
);
