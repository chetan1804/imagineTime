/* global Office:false */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import global
import Binder from '../../components/Binder.js.jsx';
import { EmailInput, PasswordInput } from '../../components/forms';

// import view
import UploadboxWelcome from './UploadboxWelcome.js.jsx';

// import actions
import * as userActions from '../../../resources/user/userActions';

class UploadboxForgotPassword extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      successMessage: null
      , username: ""
      , submitting: false
      , validEmail: false 
    };
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
      , '_handleOnClick'
    );
  }

  _handleFormChange(e) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const isValid = re.test(e.target.value);

    this.setState({
      [e.target.name]: e.target.value
      , validEmail: isValid
    })
  }

  _handleFormSubmit(e) {
    e.preventDefault();
    const { dispatch, history } = this.props;
    this.setState({ submitting: true });
    dispatch(userActions.sendForgotPassword(this.state.username)).then((action) => {
      if(action.success) {
        this.setState({ successMessage: 'ok' });        

        setTimeout(() => {
          history.replace('/login');
        }, 3000);
      } else {
        this.setState({
          successMessage: action.error
          , submitting: false
        });
      }
    })
  }

  _handleOnClick() {
    const { history } = this.props;
    history.replace('/');
  }

  render() {
    const { isOfficeInitialized } = this.props;
    const {
      password, submitting, username, validEmail, successMessage
    } = this.state;

    const isSuccess = successMessage === 'ok';
    const message = successMessage ? successMessage == 'ok' ? 'You should receive an email shortly with password reset instructions.' : successMessage : null;

    return (
        <div className="-login">
            <div className="-column">
                <form name="forgotPassowrdForm" className="user-form" onSubmit={this._handleFormSubmit}>
                    <h2>Forgot Pasword</h2>
                    <hr />
                    <div className="input-group">
                        <div className="-error-message" style={isSuccess ? {color: '#059605'} : {}}>{message}</div>
                    </div>
                    <div>
                    <EmailInput
                        name="username"
                        label="Email Address"
                        value={username}
                        change={this._handleFormChange}
                        required
                    />
                    <div className="input-group">
                        <button className="yt-btn info block" disabled={submitting || !validEmail} type="submit">
                        { submitting ?  'Sending...' : 'Send Password Reset' }
                        </button>
                    </div>
                    <hr/>
                    <p className="-clickable" onClick={this._handleOnClick}>
                        <small>
                        <em>
                        Back To Login
                        </em>
                        </small>
                    </p>
                    </div>
                </form>
            </div>
        </div>        
    );
  }
}

UploadboxForgotPassword.propTypes = {
  dispatch: PropTypes.func.isRequired,
  isOfficeInitialized: PropTypes.bool,
};

UploadboxForgotPassword.defaultProps = {
  isOfficeInitialized: false,
};

const mapStoreToProps = store => ({
  // nothing
});

export default withRouter(connect(mapStoreToProps)(UploadboxForgotPassword));
