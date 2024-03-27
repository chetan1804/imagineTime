/**
 * View component for /admin/client-workflow-templates/:clientWorkflowTemplateId
 *
 * Displays a single clientWorkflowTemplate from the 'byId' map in the clientWorkflowTemplate reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

import { Helmet } from 'react-helmet'; 

// import actions
import * as clientWorkflowTemplateActions from '../../clientWorkflowTemplateActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientWorkflowTemplateLayout from '../components/AdminClientWorkflowTemplateLayout.js.jsx';


class AdminSingleClientWorkflowTemplate extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientWorkflowTemplateActions.fetchSingleIfNeeded(match.params.clientWorkflowTemplateId));
  }

  render() {
    const { location, clientWorkflowTemplateStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual clientWorkflowTemplate object from the map
     */
    const selectedClientWorkflowTemplate = clientWorkflowTemplateStore.selected.getItem();

    const isEmpty = (
      !selectedClientWorkflowTemplate
      || !selectedClientWorkflowTemplate._id
      || clientWorkflowTemplateStore.selected.didInvalidate
    );

    const isFetching = (
      clientWorkflowTemplateStore.selected.isFetching
    )

    return (
      <AdminClientWorkflowTemplateLayout>
        <Helmet><title>Admin Single Client WF Template</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h3> Single ClientWorkflow Template </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedClientWorkflowTemplate.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the ClientWorkflowTemplate would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update ClientWorkflow Template </Link>
          </div>
        }
      </AdminClientWorkflowTemplateLayout>
    )
  }
}

AdminSingleClientWorkflowTemplate.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    clientWorkflowTemplateStore: store.clientWorkflowTemplate
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminSingleClientWorkflowTemplate)
);
