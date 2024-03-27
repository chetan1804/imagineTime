/**
 * View component for /admin/subscriptions/new
 *
 * Creates a new subscription from a copy of the defaultItem in the subscription reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as subscriptionActions from '../../subscriptionActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminSubscriptionForm from '../components/AdminSubscriptionForm.js.jsx';
import AdminSubscriptionLayout from '../components/AdminSubscriptionLayout.js.jsx';

class AdminCreateSubscription extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      subscription: _.cloneDeep(this.props.defaultSubscription.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the subscription
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(subscriptionActions.fetchDefaultSubscription());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      subscription: _.cloneDeep(nextProps.defaultSubscription.obj)

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
    dispatch(subscriptionActions.sendCreateSubscription(this.state.subscription)).then(subscriptionRes => {
      if(subscriptionRes.success) {
        dispatch(subscriptionActions.invalidateList());
        history.push(`/admin/subscriptions/${subscriptionRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location, match } = this.props;
    const { subscription, formHelpers } = this.state;
    const isEmpty = (!subscription || subscription.name === null || subscription.name === undefined);
    return (
      <AdminSubscriptionLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          <h2> Loading...</h2>
          :
          <AdminSubscriptionForm
            subscription={subscription}
            cancelLink="/admin/subscriptions"
            formHelpers={formHelpers}
            formTitle="Create Subscription"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            />
        }
      </AdminSubscriptionLayout>
    )
  }
}

AdminCreateSubscription.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    defaultSubscription: store.subscription.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminCreateSubscription)
);
