import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import global
import Binder from '../../components/Binder.js.jsx';
import { EmailInput, PasswordInput } from '../../components/forms';
import Auth from '../../utils/auth';

// import actions
import * as userActions from '../../../resources/user/userActions';
import * as clientActions from '../../../resources/client/clientActions';

// import components 
import UploadboxLoading from '../components/UploadboxLoading.js.jsx';

class UploadboxUserLogin extends Binder {
  constructor(props) {
    super(props);

    this.state = {
      errorMessage: null,
      password: '',
      submitting: false,
      username: '',
      client: null,
      loading: false
    };

    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
      , '_handleOnClick'
    );
  }

  componentDidMount() {
    const { history } = this.props;

    if (!Auth.notLoggedIn()) {
      history.replace('/account');
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
      submitting: true
    };

    dispatch(userActions.sendLogin(username, password)).then((response) => {
      localStorage.clear(); // clear the account selection
      if (response.success) {
        // this.setState({
        //   errorMessage: null,
        //   password: '',
        //   submitting: false,
        //   username: '',
        // });
        history.replace('/account');
      } else {
        this.setState({
          errorMessage: response.error || 'Matching user not found.',
          password: '',
          submitting: false,
        });
      }
    });
  }

  _handleOnClick() {
    const { history } = this.props;
    history.replace('/forgot-password');
  }

  render() {
    const {
      errorMessage, password, submitting, username, loading
    } = this.state;
    
    return (
        loading ? <UploadboxLoading /> :
        <div className="-login">
            <div className="-column">
                <form name="userForm" className="user-form" onSubmit={this._handleFormSubmit}>
                    <h2>Sign In</h2>
                    <hr />
                    <div className="input-group">
                         <div className="-error-message">{errorMessage}</div>
                    </div>                   
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
                    <hr/>
                    <p className="-clickable" onClick={this._handleOnClick}>
                        <small>
                        <em>
                        Forgot Password?
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

UploadboxUserLogin.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

const mapStoreToProps = store => ({
  loggedInUser: store.user.loggedIn.user
  , clientStore: store.client 
});

export default connect(mapStoreToProps)(UploadboxUserLogin);
