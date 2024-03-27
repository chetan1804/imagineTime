/**
 * View component for /admin/activities/new
 *
 * Creates a new activity from a copy of the defaultItem in the activity reducer
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

class AdminCreateActivity extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      activity: _.cloneDeep(this.props.defaultActivity.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
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
    const { dispatch } = this.props;
    dispatch(activityActions.fetchDefaultActivity());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      activity: _.cloneDeep(nextProps.defaultActivity.obj)

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
    dispatch(activityActions.sendCreateActivity(this.state.activity)).then(activityRes => {
      if(activityRes.success) {
        dispatch(activityActions.invalidateList());
        history.push(`/admin/activities/${activityRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location, match } = this.props;
    const { activity, formHelpers } = this.state;
    const isEmpty = (!activity || activity.name === null || activity.name === undefined);
    return (
      <AdminActivityLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          <h2> Loading...</h2>
          :
          <AdminActivityForm
            activity={activity}
            cancelLink="/admin/activities"
            formHelpers={formHelpers}
            formTitle="Create Activity"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            />
        }
      </AdminActivityLayout>
    )
  }
}

AdminCreateActivity.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    defaultActivity: store.activity.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminCreateActivity)
);
