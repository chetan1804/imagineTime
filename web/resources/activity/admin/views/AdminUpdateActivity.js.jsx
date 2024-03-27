/**
 * View component for /admin/activities/:activityId/update
 *
 * Updates a single activity from a copy of the selcted activity
 * as defined in the activity reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as activityActions from '../../activityActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminActivityForm from '../components/AdminActivityForm.js.jsx';
import AdminActivityLayout from '../components/AdminActivityLayout.js.jsx';

class AdminUpdateActivity extends Binder {
  constructor(props) {
    super(props);
    const { match, activityStore } = this.props;
    this.state = {
      activity: activityStore.byId[match.params.activityId] ?  _.cloneDeep(activityStore.byId[match.params.activityId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the activity
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(activityActions.fetchSingleIfNeeded(match.params.activityId))
  }

  componentWillReceiveProps(nextProps) {
    const { match, activityStore } = nextProps;
    this.setState({
      activity: activityStore.byId[match.params.activityId] ?  _.cloneDeep(activityStore.byId[match.params.activityId]) : {}
      // NOTE: ^ we don't want to actually change the store's activity, just use a copy
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
    dispatch(activityActions.sendUpdateActivity(this.state.activity)).then(activityRes => {
      if(activityRes.success) {
        history.push(`/admin/activities/${activityRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , activityStore
    } = this.props;
    const { activity, formHelpers } = this.state;

    const selectedActivity = activityStore.selected.getItem();

    const isEmpty = (
      !activity
      || !activity._id
    );

    const isFetching = (
      !activityStore.selected.id
      || activityStore.selected.isFetching
    )

    return  (
      <AdminActivityLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <AdminActivityForm
            activity={activity}
            cancelLink={`/admin/activities/${activity._id}`}
            formHelpers={formHelpers}
            formTitle="Update Activity"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </AdminActivityLayout>
    )
  }
}

AdminUpdateActivity.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  return {
    activityStore: store.activity
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminUpdateActivity)
);
