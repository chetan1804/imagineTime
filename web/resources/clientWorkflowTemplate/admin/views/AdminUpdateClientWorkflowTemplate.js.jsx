/**
 * View component for /admin/client-workflow-templates/:clientWorkflowTemplateId/update
 *
 * Updates a single clientWorkflowTemplate from a copy of the selcted clientWorkflowTemplate
 * as defined in the clientWorkflowTemplate reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import { Helmet } from 'react-helmet'; 

// import actions
import * as clientWorkflowTemplateActions from '../../clientWorkflowTemplateActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientWorkflowTemplateForm from '../components/AdminClientWorkflowTemplateForm.js.jsx';
import AdminClientWorkflowTemplateLayout from '../components/AdminClientWorkflowTemplateLayout.js.jsx';

import ClientWorkflowTemplateItemsEditor from '../../components/ClientWorkflowTemplateItemsEditor.js.jsx';

class AdminUpdateClientWorkflowTemplate extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientWorkflowTemplateActions.fetchSingleIfNeeded(match.params.clientWorkflowTemplateId))
  }

  render() {
    const {
      location
      , clientWorkflowTemplateStore
    } = this.props;

    const selectedClientWorkflowTemplate = clientWorkflowTemplateStore.selected.getItem();

    const isEmpty = (
      !selectedClientWorkflowTemplate
      || !selectedClientWorkflowTemplate._id
    );

    const isFetching = (
      !clientWorkflowTemplateStore.selected.id
      || clientWorkflowTemplateStore.selected.isFetching
    )

    return  (
      <AdminClientWorkflowTemplateLayout>
        <Helmet><title>Admin Update Client WF Template</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <ClientWorkflowTemplateItemsEditor
            clientWorkflowTemplate={selectedClientWorkflowTemplate}
            cancelLink={`/admin/client-workflow-templates/${selectedClientWorkflowTemplate._id}`}
            formTitle="Update ClientWorkflow Template"
            formType="update"
          />
        }
      </AdminClientWorkflowTemplateLayout>
    )
  }
}

AdminUpdateClientWorkflowTemplate.propTypes = {
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
  )(AdminUpdateClientWorkflowTemplate)
);
