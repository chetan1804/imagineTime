import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import Binder from '../../components/Binder.js.jsx';

import * as userActions from '../../../resources/user/userActions';
import brandingName from '../../enum/brandingName.js.jsx';

class OutlookNotAllowed extends Binder {
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

    return (
      <div className="yt-container">
        <div className="yt-row" style={{ marginTop: "8px" }}>
          <h1>Whoops!</h1>
          <strong>It looks like you don't have an active {brandingName.title} account.</strong>
          <hr />
          <br />
          <p>Unfortunately, that means you're unable to use Imagine Share at this time.</p>
          <br />
          <p>If you'd like more information, please visit <a href={brandingName.url}>{brandingName.url}</a></p>
        </div>
        <br />
        <br />
        <hr />
        <button
          type="button"
          className="yt-btn u-pullRight small link"
          onClick={this._handleLogout}
        >
          Logout
        </button>
      </div>
    );
  }
}

OutlookNotAllowed.propTypes = {
  dispatch: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
};

const mapStoreToProps = store => ({
  loggedInUser: store.user.loggedIn.user,
});

export default withRouter(connect(mapStoreToProps)(OutlookNotAllowed));

