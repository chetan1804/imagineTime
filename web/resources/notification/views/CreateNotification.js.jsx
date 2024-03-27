/**
 * View component for /notifications/new
 *
 * Creates a new notification from a copy of the defaultItem in the notification reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as notificationActions from '../notificationActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../global/components/navigation/Breadcrumbs.js.jsx';

// import notification components
import NotificationForm from '../components/NotificationForm.js.jsx';
import NotificationLayout from '../components/NotificationLayout.js.jsx';

class CreateNotification extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      formHelpers: {}
      , notification: _.cloneDeep(this.props.defaultNotification.obj)
      // NOTE: ^ We don't want to actually change the store's defaultItem, just use a copy
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(notificationActions.fetchDefaultNotification());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      notification: _.cloneDeep(nextProps.defaultNotification.obj)
    })
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState});
  }


  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(notificationActions.sendCreateNotification(this.state.notification)).then(notificationRes => {
      if(notificationRes.success) {
        dispatch(notificationActions.invalidateList("all"));
        history.push(`/notifications/${notificationRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location } = this.props;
    const { notification } = this.state;
    const isEmpty = !notification;
    return (
      <NotificationLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        {isEmpty ?
          <h2> Loading...</h2>
          :
          <NotificationForm
            notification={notification}
            cancelLink="/notifications"
            formTitle="Create Notification"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </NotificationLayout>
    )
  }
}

CreateNotification.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    defaultNotification: store.notification.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(CreateNotification)
);
