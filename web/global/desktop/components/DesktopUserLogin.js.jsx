import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Binder from '../../components/Binder.js.jsx';
import { EmailInput, PasswordInput } from '../../components/forms';

import * as userActions from '../../../resources/user/userActions';

class DesktopUserLogin extends Binder {
  constructor(props) {
    super(props);

    this.state = {
      errorMessage: null,
      password: '',
      submitting: false,
      username: '',
      msalInstance: null
    };

    this._bind(
      '_handleFormChange',
      '_handleFormSubmit',
      '_handleMSAuthCallback'
    );
  }

  _handleMSAuthCallback(err, data, msal) {
    const { msalInstance } = this.state;

    if(msalInstance) return;

    const { dispatch, history, location } = this.props;

    if(data && data.account) {

      this.setState({msalInstance: msal});
      const msAccount = data.account;

      console.log('msAccount', msAccount);
      dispatch(userActions.sendLoginMSAccount(msAccount.userName, msAccount.accountIdentifier)).then((action) => {
        console.log("ms account login");
        if(action.success) {
          this.setState({
            errorMessage: null,
            password: '',
            submitting: false,
            username: '',
          });
          history.replace('/upload');
        } else {          
          if(msal) {
            this.setState({msalInstance: null});
          }
          this.setState({
            errorMessage: response.error || 'Matching user not found.',
            password: '',
            submitting: false,
          });
        }
      })
    }
  }

  _handleFormChange(e) {
    const nextState = this.state;
    nextState[e.target.name] = e.target.value;
    this.setState(nextState);
  }

  _handleFormSubmit(e) {
    e.preventDefault();

    const { dispatch, history } = this.props;
    const { password, username } = this.state;

    this.state = {
      submitting: false
    };

    dispatch(userActions.sendLogin(username, password)).then((response) => {
      localStorage.clear(); // clear the account selection
      if (response.success) {
        this.setState({
          errorMessage: null,
          password: '',
          submitting: false,
          username: '',
        });

        history.replace('/upload');
      } else {
        this.setState({
          errorMessage: response.error || 'Matching user not found.',
          password: '',
          submitting: false,
        });
      }
    });
  }

  render() {
    const {
      errorMessage, password, submitting, username,
    } = this.state;

    const redirectUri = !window.appUrl.includes('localhost') ?
    `https://${window.appUrl}/api/ms/auth` :
    `http://${window.appUrl}/api/ms/auth`

    return (
      <form name="userForm" className="user-form" onSubmit={this._handleFormSubmit}>
        <h2>Sign In</h2>
        <hr />
        <br />
        {errorMessage && (
          <div className="input-group">
            <div className="-error-message">{errorMessage}</div>
          </div>
        )}
        <div>
          <EmailInput
            name="username"
            label="Email Address"
            value={username}
            change={this._handleFormChange}
            required
          />
          <PasswordInput
            name="password"
            label="Password"
            value={password}
            change={this._handleFormChange}
            required
            password
          />
          <div className="input-group">
            <button className="yt-btn info block" disabled={submitting || !username || !password} type="submit">Sign in</button>
          </div>
        </div>
      </form>
    );
  }
}

DesktopUserLogin.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

const mapStoreToProps = store => ({
  // nothing
});

export default connect(mapStoreToProps)(DesktopUserLogin);
