import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import global
import Auth from '../../utils/auth';
import Binder from '../../components/Binder.js.jsx';

// import action
import * as clientActions from '../../../resources/client/clientActions';

class UploadboxWelcome extends Binder {
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

    history.replace('/login');
  }

  componentDidMount() {
    const { dispatch, loggedInUser, history, clientName } = this.props;

    if (!Auth.notLoggedIn()) {
      if (clientName) {
        dispatch(clientActions.fetchList('_user', loggedInUser._id)).then(json => {
            if (json.success && json.list.length) {
                const clients = json.list.filter(client => client.name.toLowerCase() === clientName.toLowerCase());
                if (clients.length) {
                    history.replace(`/upload/${clients[0]._id}`);
                }
            }
        });
      } else {
        history.replace('/');
      }      
    }
  }

  render() {
    const { errorMessage } = this.state;

    return (
      <div className="-column">
        <h2>Welcome!</h2>
        <h4>
            As valued client you get secure password-protected portal
            to store your important documents from anywhere at anytime.
            <br/>
            <br/>
            Whether you're at work, at home or on vacation you always have
            access to your important documents.
            <br/>
            <br/>
            This portal also allows us to work together efficiently.
            <br/>
            <br/>
            To start start the client portal please sign in.
        </h4>
      </div>
    );
  }
}

UploadboxWelcome.propTypes = {
  history: PropTypes.object.isRequired
};

const mapStoreToProps = (store) => {

  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */

  return {
      // loggedInUser: store.user.loggedIn.user
      loggedInUser: store.user.loggedIn.user
      , clientStore: store.client 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(UploadboxWelcome)
);
