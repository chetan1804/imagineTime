/**
 * View component for /admin/client-workflows/:clientWorkflowId
 *
 * Displays a single clientWorkflow from the 'byId' map in the clientWorkflow reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

import { Helmet } from 'react-helmet'; 

// import actions
import * as clientWorkflowActions from '../../clientWorkflowActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientWorkflowLayout from '../components/AdminClientWorkflowLayout.js.jsx';


class AdminSingleClientWorkflow extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientWorkflowActions.fetchSingleIfNeeded(match.params.clientWorkflowId));
  }

  render() {
    const { location, clientWorkflowStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual clientWorkflow object from the map
     */
    const selectedClientWorkflow = clientWorkflowStore.selected.getItem();

    const isEmpty = (
      !selectedClientWorkflow
      || !selectedClientWorkflow._id
      || clientWorkflowStore.selected.didInvalidate
    );

    const isFetching = (
      clientWorkflowStore.selected.isFetching
    )

    return (
      <AdminClientWorkflowLayout>
        <Helmet><title>Admin Single Client Workflow</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h3> Single ClientWorkflow </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedClientWorkflow.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the ClientWorkflow would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update ClientWorkflow </Link>
          </div>
        }
      </AdminClientWorkflowLayout>
    )
  }
}

AdminSingleClientWorkflow.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    clientWorkflowStore: store.clientWorkflow
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminSingleClientWorkflow)
);
