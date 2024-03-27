/**
 * View component for /notifications/:notificationId/update
 *
 * Updates a single notification from a copy of the selcted notification
 * as defined in the notification reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as notificationActions from '../notificationActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import NotificationForm from '../components/NotificationForm.js.jsx';
import NotificationLayout from '../components/NotificationLayout.js.jsx';

class UpdateNotification extends Binder {
  constructor(props) {
    super(props);
    const { match, notificationStore } = this.props;
    this.state = {
      notification: notificationStore.byId[match.params.notificationId] ?  _.cloneDeep(notificationStore.byId[match.params.notificationId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the notification
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(notificationActions.fetchSingleIfNeeded(match.params.notificationId))
  }

  componentWillReceiveProps(nextProps) {
    const { match, notificationStore } = nextProps;
    this.setState({
      notification: notificationStore.byId[match.params.notificationId] ?  _.cloneDeep(notificationStore.byId[match.params.notificationId]) : {}
      // NOTE: ^ we don't want to actually change the store's notification, just use a copy
    })
  }

  _handleFormChange(e) {
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState});
  }

  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(notificationActions.sendUpdateNotification(this.state.notification)).then(notificationRes => {
      if(notificationRes.success) {
        history.push(`/notifications/${notificationRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , notificationStore
    } = this.props;
    const { notification, formHelpers } = this.state;

    const selectedNotification = notificationStore.selected.getItem();

    const isEmpty = (
      !notification
      || !notification._id
    );

    const isFetching = (
      !notificationStore.selected.id
      || notificationStore.selected.isFetching
    )

    return  (
      <NotificationLayout>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <NotificationForm
            notification={notification}
            cancelLink={`/notifications/${notification._id}`}
            formHelpers={formHelpers}
            formTitle="Update Notification"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </NotificationLayout>
    )
  }
}

UpdateNotification.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    notificationStore: store.notification
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(UpdateNotification)
);
