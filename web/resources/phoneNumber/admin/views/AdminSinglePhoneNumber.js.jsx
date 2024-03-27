/**
 * View component for /admin/phone-numbers/:phoneNumberId
 *
 * Displays a single phoneNumber from the 'byId' map in the phoneNumber reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as phoneNumberActions from '../../phoneNumberActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminPhoneNumberLayout from '../components/AdminPhoneNumberLayout.js.jsx';


class AdminSinglePhoneNumber extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(phoneNumberActions.fetchSingleIfNeeded(match.params.phoneNumberId));
  }

  render() {
    const { location, phoneNumberStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual phoneNumber object from the map
     */
    const selectedPhoneNumber = phoneNumberStore.selected.getItem();

    const isEmpty = (
      !selectedPhoneNumber
      || !selectedPhoneNumber._id
      || phoneNumberStore.selected.didInvalidate
    );

    const isFetching = (
      phoneNumberStore.selected.isFetching
    )

    return (
      <AdminPhoneNumberLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h3> Single Phone Number </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedPhoneNumber.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the PhoneNumber would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update Phone Number </Link>
          </div>
        }
      </AdminPhoneNumberLayout>
    )
  }
}

AdminSinglePhoneNumber.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    phoneNumberStore: store.phoneNumber
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminSinglePhoneNumber)
);
