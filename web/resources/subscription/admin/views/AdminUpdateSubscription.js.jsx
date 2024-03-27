/**
 * View component for /admin/subscriptions/:subscriptionId/update
 *
 * Updates a single subscription from a copy of the selcted subscription
 * as defined in the subscription reducer
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

class AdminUpdateSubscription extends Binder {
  constructor(props) {
    super(props);
    const { match, subscriptionStore } = this.props;
    this.state = {
      subscription: subscriptionStore.byId[match.params.subscriptionId] ?  _.cloneDeep(subscriptionStore.byId[match.params.subscriptionId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
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
    const { dispatch, match } = this.props;
    dispatch(subscriptionActions.fetchSingleIfNeeded(match.params.subscriptionId))
  }

  componentWillReceiveProps(nextProps) {
    const { match, subscriptionStore } = nextProps;
    this.setState({
      subscription: subscriptionStore.byId[match.params.subscriptionId] ?  _.cloneDeep(subscriptionStore.byId[match.params.subscriptionId]) : {}
      // NOTE: ^ we don't want to actually change the store's subscription, just use a copy
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
    dispatch(subscriptionActions.sendUpdateSubscription(this.state.subscription)).then(subscriptionRes => {
      if(subscriptionRes.success) {
        history.push(`/admin/subscriptions/${subscriptionRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , subscriptionStore
    } = this.props;
    const { subscription, formHelpers } = this.state;

    const selectedSubscription = subscriptionStore.selected.getItem();

    const isEmpty = (
      !subscription
      || !subscription._id
    );

    const isFetching = (
      !subscriptionStore.selected.id
      || subscriptionStore.selected.isFetching
    )

    return  (
      <AdminSubscriptionLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <AdminSubscriptionForm
            subscription={subscription}
            cancelLink={`/admin/subscriptions/${subscription._id}`}
            formHelpers={formHelpers}
            formTitle="Update Subscription"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </AdminSubscriptionLayout>
    )
  }
}

AdminUpdateSubscription.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  return {
    subscriptionStore: store.subscription
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminUpdateSubscription)
);
