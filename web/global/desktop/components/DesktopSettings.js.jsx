import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import Binder from '../../components/Binder.js.jsx';

import * as userActions from '../../../resources/user/userActions';
import brandingName from '../../enum/brandingName.js.jsx';

class DesktopSettings extends Binder {
  constructor(props) {
    super(props);

    this._bind(
      '_handleClose',
      '_handleLogout'
    );
  }

  _handleClose() {
    const { history } = this.props;

    history.goBack();
  }

  _handleLogout() {
    const { dispatch, history } = this.props;

    dispatch(userActions.sendLogout()).then(() => {
      localStorage.clear(); // clear the account selection
      history.replace('/');
    });
  }

  render() {
    const { loggedInUser } = this.props;

    return (
      <div>
        <div className="yt-row center-vert space-between">
          <h4>Hello, {loggedInUser.firstname}</h4>
        </div>
        <h2>Settings</h2>
        <hr />
        <br />
        <div className="-profile-info">
          <div className="-info">
            <strong>
              <small>Email</small>
            </strong>
            <p>{loggedInUser.username}</p>
          </div>
        </div>
        <div className="yt-container">
          <div className="yt-row space-between">
            <button
              type="button"
              className="yt-btn info small link"
              onClick={this._handleClose}
            >
              cancel
            </button>
            <button
              type="button"
              className="yt-btn x-small info"
              onClick={this._handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
        <br/>
        <hr/>
        <br/>
        {/**
         * NOTE: This is hear to make sure folks aren't using old MSI versions and such. 
         * Something Chad can ask for reference when they call into support.  
         * Should manually update this as we make changes. 
        */} 
        <p><em>{brandingName.title} Desktop Version 1.5.2.1 </em></p>
      </div>
    );
  }
}

DesktopSettings.propTypes = {
  dispatch: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
};

const mapStoreToProps = store => ({
  loggedInUser: store.user.loggedIn.user,
});

export default withRouter(connect(mapStoreToProps)(DesktopSettings));
