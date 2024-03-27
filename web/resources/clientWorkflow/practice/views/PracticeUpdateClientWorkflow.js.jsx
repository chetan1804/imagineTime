/**
 * View component for /firm/:firmId/clients/:clientId/client-workflows/:clientWorkflowId/update
 *
 * Allows staff to update and add items to a workflow.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import { Helmet } from 'react-helmet';

// import actions
import * as clientActions from '../../../client/clientActions';
import * as firmActions from '../../../firm/firmActions';
import * as clientWorkflowActions from '../../clientWorkflowActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';
import ClientWorkflowItemsEditor from '../../components/ClientWorkflowItemsEditor.js.jsx'


class PracticeUpdateClientWorkflow extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(clientWorkflowActions.fetchSingleIfNeeded(match.params.clientWorkflowId));
  }
  
  render() {
    const {
      clientStore
      , firmStore
      , location
      , match
      , clientWorkflowStore
    } = this.props;

    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();
    const selectedClientWorkflow = clientWorkflowStore.selected.getItem();

    const isEmpty = (
      clientStore.selected.didInvalidate  
      || firmStore.selected.didInvalidate
      || !selectedClient
      || !selectedClient._id 
      || !selectedFirm
      || !selectedFirm._id
      || !selectedClientWorkflow
      || !selectedClientWorkflow._id
    );

    const isFetching = (
      !selectedClient
      || !selectedFirm
      || !selectedClientWorkflow
      || clientStore.selected.isFetching
      || firmStore.selected.isFetching
      || clientWorkflowStore.isFetching
    )

    return (
      <PracticeLayout>
        <Helmet><title>Update Client Workflow</title></Helmet>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} />
              <div className="-btns dropdown">
              </div>
            </div>
          </div>
        </div>
        <div className="yt-container fluid">
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <h2>Empty.</h2>
          )
          :
          <ClientWorkflowItemsEditor
            clientWorkflow={selectedClientWorkflow}
            clientId={match.params.clientId}
            firmId={match.params.firmId}
          />
        }
        </div>
      </PracticeLayout>
    )
  }
}

PracticeUpdateClientWorkflow.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    clientStore: store.client 
    , firmStore: store.firm
    , clientWorkflowStore: store.clientWorkflow
    , userStore: store.user 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeUpdateClientWorkflow)
);
