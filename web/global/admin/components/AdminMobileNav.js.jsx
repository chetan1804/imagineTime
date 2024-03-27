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

class AdminMobileNav extends Binder {
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
                <Link className="-link"  to="/admin">Dashboard</Link>
              </li>
              <hr/>
              <li>
                <Link className="-link" to="/admin/firms">Firms <i className="fal fa-tasks u-pullRight"/></Link>
              </li>
              <li>
                <Link className="-link" to="/admin/users">Users <i className="fal fa-users u-pullRight"/></Link>
              </li>
              <li>
                <Link className="-link" to="/admin/client-workflow-templates">Client Workflow <i className="fal fa-chart-bar u-pullRight"/></Link>
              </li>
              <li>
                <Link className="-link" to="/admin/tags">Tags <i className="fal fa-tags u-pullRight"/></Link>
              </li>
              <li>
                <Link className="-link" to="/admin/clients">All Clients <i className="fal fa-users u-pullRight"/></Link>
              </li>
              <li>
                <Link className="-link" to="/admin/staff">All Staff <i className="fal fa-users u-pullRight"/></Link>
              </li>
              <li>
                <Link className="-link" to="/admin/quick-tasks">All Quick Tasks <i className="fal fa-tasks u-pullRight"/></Link>
              </li>
              <li>
                <Link className="-link" to="/admin/share-links">ShareLinks <i className="fal fa-tasks u-pullRight"/></Link>
              </li>
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

AdminMobileNav.propTypes = {
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
  )(AdminMobileNav)
);
