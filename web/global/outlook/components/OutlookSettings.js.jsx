import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import Binder from '../../components/Binder.js.jsx';

import * as userActions from '../../../resources/user/userActions';
import brandingName from '../../enum/brandingName.js.jsx';

class OutlookSettings extends Binder {
  constructor(props) {
    super(props);

    this._bind(
      '_handleClose',
      '_handleLogout'
    );
  }

  _handleClose() {
    const { history } = this.props;
    // history.goBack();    
    // for chrome store purposes history.replace("/action");
    history.replace("/");
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
        <h4>Settings</h4>
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
         * NOTE: This is hear to make sure folks aren't using old manifest versions and such. 
         * Something Chad can ask for reference when they call into support.  
         * Should manually update this as we make changes. 
        */} 
        <p><em>{brandingName.title} OPI Version 1.5.3 </em></p>
      </div>
    );
  }
}

OutlookSettings.propTypes = {
  dispatch: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
};

const mapStoreToProps = store => ({
  loggedInUser: store.user.loggedIn.user,
});

export default withRouter(connect(mapStoreToProps)(OutlookSettings));
