/**
 * View component for /admin/client-workflows/:clientWorkflowId/update
 *
 * Updates a single clientWorkflow from a copy of the selcted clientWorkflow
 * as defined in the clientWorkflow reducer
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
import * as clientWorkflowActions from '../../clientWorkflowActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientWorkflowForm from '../components/AdminClientWorkflowForm.js.jsx';
import AdminClientWorkflowLayout from '../components/AdminClientWorkflowLayout.js.jsx';

class AdminUpdateClientWorkflow extends Binder {
  constructor(props) {
    super(props);
    const { match, clientWorkflowStore } = this.props;
    this.state = {
      clientWorkflow: clientWorkflowStore.byId[match.params.clientWorkflowId] ?  _.cloneDeep(clientWorkflowStore.byId[match.params.clientWorkflowId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the clientWorkflow
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientWorkflowActions.fetchSingleIfNeeded(match.params.clientWorkflowId))
  }

  componentDidUpdate(prevProps, prevState) {
    const { match, clientWorkflowStore } = this.props;
    if(prevProps.match.params.clientWorkflowId !== match.params.clientWorkflowId){
      this.setState({
        clientWorkflow: clientWorkflowStore.byId[match.params.clientWorkflowId] ?  _.cloneDeep(clientWorkflowStore.byId[match.params.clientWorkflowId]) : {}
        // NOTE: ^ we don't want to actually change the store's clientWorkflow, just use a copy
      });
    }
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
    dispatch(clientWorkflowActions.sendUpdateClientWorkflow(this.state.clientWorkflow)).then(clientWorkflowRes => {
      if(clientWorkflowRes.success) {
        history.push(`/admin/client-workflows/${clientWorkflowRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , clientWorkflowStore
    } = this.props;
    const { clientWorkflow, formHelpers } = this.state;

    const selectedClientWorkflow = clientWorkflowStore.selected.getItem();

    const isEmpty = (
      !clientWorkflow
      || !clientWorkflow._id
    );

    const isFetching = (
      !clientWorkflowStore.selected.id
      || clientWorkflowStore.selected.isFetching
    );

    return  (
      <AdminClientWorkflowLayout>
        <Helmet><title>Admin Update Client Workflow</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <AdminClientWorkflowForm
            clientWorkflow={clientWorkflow}
            cancelLink={`/admin/client-workflows/${clientWorkflow._id}`}
            formHelpers={formHelpers}
            formTitle="Update ClientWorkflow"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </AdminClientWorkflowLayout>
    )
  }
}

AdminUpdateClientWorkflow.propTypes = {
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
  )(AdminUpdateClientWorkflow)
);
