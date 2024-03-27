import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import Auth from '../../utils/auth';

import Binder from '../../components/Binder.js.jsx';
import brandingName from '../../enum/brandingName.js.jsx';

class DesktopWelcome extends Binder {
  constructor(props) {
    super(props);

    this.state = {
      errorMessage: null,
    };

    this._bind(
      '_handleOnClick'
    );
  }

  _handleOnClick() {
    const { history } = this.props;
    localStorage.clear();
    history.replace('/login');
  }

  componentDidMount() {
    const { history } = this.props;

    if (!Auth.notLoggedIn()) {
      history.replace('/upload');
    }
  }

  render() {
    const { errorMessage } = this.state;

    return (
      <div className="yt-container">
        <h2>Welcome!</h2>
        <h4>Use Secure Print to upload documents securely to the {brandingName.title} Client Workspace.</h4>
        <h4>To get started, please sign in.</h4>
        <hr />
        <br />
        <button className="yt-btn small info block" onClick={this._handleOnClick}>
          Sign in
        </button>
        {errorMessage && (
          <div className="yt-row" style={{ marginTop: "8px" }}>
            <small className="help-text"><em>{errorMessage}</em></small>
          </div>
        )}
      </div>
    );
  }
}

DesktopWelcome.propTypes = {
  history: PropTypes.object.isRequired
};

export default withRouter(DesktopWelcome);
