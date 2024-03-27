// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import actions
import * as notificationActions from '../../notification/notificationActions';
import * as fileActivityActions from '../../fileActivity/fileActivityActions';

class NotificationSocket extends Binder {
  constructor(props) {
    super(props);
    // register and fire socket.io events
    const {
      dispatch
      , loggedInUser
      , socket
    } = props;
    

    socket.on('connect', () => {
      // console.log('socket connected!!!');
      if(loggedInUser && loggedInUser._id) {
        // console.log('subscribing to userid');
        socket.emit('subscribe', loggedInUser._id);
      }
    })

    socket.on('disconnect', reason => {
      // console.log('socket disconnected!!!');
      // console.log(reason);
      socket.open();
    })
    // new OR updated notification
    // TODO: Set up separate events for new_notification and updated_notification since we don't
    // need to addNotificationToList on an updated notification.
    socket.on('receive_notification', notification => {
      console.log("receive_notification", notification)
      // console.log('Notification received', notification)
      dispatch(notificationActions.addSingleNotificationToMap(notification))
      dispatch(notificationActions.addNotificationToList(notification, '_user', notification._user));
    });

    socket.on('receive_file_activity', fileActivity => {
      dispatch(fileActivityActions.addSingleFileActivityToMap(fileActivity))
      dispatch(fileActivityActions.addFileActivityToList(fileActivity, '_user', fileActivity._user));
    })
  }
  componentDidMount() {
    const { loggedInUser, socket } = this.props;
    if(socket && socket.disconnected) {
      // Open the socket connection.
      socket.open();
    } else if(socket && socket.connected && loggedInUser && loggedInUser._id) {
      /**
       * Send a subscribe event to the server with loggedInUser._id. This creates a private channel
       * that we can use to send notifications directly to their associated user.
       */
      socket.emit('subscribe', loggedInUser._id);
    }
  }

  componentWillUnmount() {
    const { socket } = this.props;
    // remove listeners
    socket.off('connect')
    socket.off('disconnect')
    socket.off('receive_notification')
    socket.off('receive_file_activity');
  }

  render() {
    return (
      null
    )
  }
}

NotificationSocket.propTypes = {
  dispatch: PropTypes.func.isRequired
  , socket: PropTypes.object.isRequired
}

NotificationSocket.defaultProps = {
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    loggedInUser: store.user.loggedIn.user
    , socket: store.user.socket
  }
}

export default connect(mapStoreToProps)(NotificationSocket);
