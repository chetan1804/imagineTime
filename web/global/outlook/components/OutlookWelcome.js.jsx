/* global Office:false */

import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';

import Auth from '../../utils/auth';

import Binder from '../../components/Binder.js.jsx';
import brandingName from '../../enum/brandingName.js.jsx';


class OutlookWelcome extends Binder {
  constructor(props) {
    super(props);

    this.state = {
      errorMessage: null
    };

    this._bind(
      '_handleOnClick'
    );
  }

  _handleOnClick() {
    Office.context.ui.displayDialogAsync(`${window.location.origin}/outlook?customAction=signin`, { height: 50, width: 20 }, (response) => {
      const dialog = response.value;

      if (response.status === Office.AsyncResultStatus.Failed) {
        if (response.error.code === 12007) {
          this.setState({
            errorMessage: 'The sign in dialog may already be open. Please check your desktop for the open window.',
          });
        } else {
          // console.log(response.error.code);
          // console.log(response.error.message);
          this.setState({
            errorMessage: "Code: " + response.error.code + " - " + response.error.message,
          });
        }
      } else {
        dialog.addEventHandler(Office.EventType.DialogMessageReceived, () => {
          dialog.close();
          window.location.reload(); // need to reload the task pane
        });

        dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
          this.setState({
            errorMessage: null,
          });
        });
      }
    });
  }

  componentDidMount() {
    const { history } = this.props;

    if (!Auth.notLoggedIn()) {
      history.replace('/actions');
    }
  }

  render() {
    const { errorMessage } = this.state;

    if(brandingName.title == 'ImagineTime') {
      brandingName.title == 'ImagineShare'
    }
    return (
      <div className="yt-container">
        <h1>Welcome!</h1>
        <h4>Use {brandingName.title} to share documents securely with the {brandingName.title} Client Workspace.</h4>
        <h4>To get started, please sign in.</h4>
        <hr/>

        <Link to="/login" className="yt-btn small info block">Sign in</Link>
        <hr/>
        <Link to="/forgot-password">
          <small>
          <em>
            Forgot Password?
          </em>
          </small>
        </Link>
        {errorMessage && (
          <div className="yt-row" style={{ marginTop: "8px" }}>
            <small className="help-text"><em>{errorMessage}</em></small>
          </div>
        )}
        <br/>
        <br/>
        <br/>
        <div>
          <em>Don't have an account yet? Checkout <a href={brandingName.url} target="_blank">{brandingName.host}</a> to learn how {brandingName.title} help make your practice perfect.</em>
        </div>
      </div>
    );
  }
}

OutlookWelcome.propTypes = {
  history: PropTypes.object.isRequired,
};

export default withRouter(OutlookWelcome);
