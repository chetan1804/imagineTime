/**
 * View component for /admin/files
 *
 * Generic file list view. Defaults to 'all' with:
 * this.props.dispatch(fileActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as clientActions from '../../clientActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import PortalLayout from '../../../../global/portal/components/PortalLayout.js.jsx';

// import resource components

class UpdateAccountSettings extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, loggedInUser } = this.props
  }

  render() {
    const { 
      clientStore 
      , location 
      , loggedInUser
    } = this.props;



    return (
      <PortalLayout>
        <h1> Update Account Settings</h1>
        <hr/>
      </PortalLayout>
    )
  }
}

UpdateAccountSettings.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    clientStore: store.file
    , loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(UpdateAccountSettings)
);
