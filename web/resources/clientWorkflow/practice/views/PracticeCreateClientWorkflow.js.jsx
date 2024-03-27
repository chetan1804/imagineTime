/**
 * View component for /firm/:firmId/clients/:clientId/client-workflows/new
 *
 * Creates a new client from a copy of the defaultItem in the client reducer
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
import PracticeClientWorkflowForm from '../components/PracticeClientWorkflowForm.js.jsx';
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';


class PracticeCreateClientWorkflow extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      clientWorkflow: _.cloneDeep(this.props.clientWorkflowStore.defaultItem.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , formHelpers: {
        ...this.props.clientWorkflowStore.formHelpers
        , edited: false
        , items: []
      }
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the client
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(clientWorkflowActions.fetchDefaultClientWorkflow());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      clientWorkflow: _.cloneDeep(nextProps.clientWorkflowStore.defaultItem.obj)
    })
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    newState.formHelpers.edited = true;
    this.setState({newState});
  }


  _handleFormSubmit(e) {
    const { dispatch, history, match } = this.props;
    e.preventDefault();
    let newClientWorkflow = {
      ...this.state.clientWorkflow
      , _client: match.params.clientId        
      , _firm: match.params.firmId
      // , dueDate: this.state.formHelpers.dueDate ? new Date(this.state.formHelpers.dueDate) : null 
    };

    dispatch(clientWorkflowActions.sendCreateClientWorkflow(newClientWorkflow)).then(tfRes => {
      if(tfRes.success) {
        dispatch(clientWorkflowActions.invalidateList('_client', match.params.clientId));
        history.push(`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/client-workflows/${tfRes.item._id}/update`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }
  
  render() {
    const {
      clientStore
      , firmStore
      , location
      , match
    } = this.props;

    const { clientWorkflow, formHelpers } = this.state;

    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();

    const isEmpty = (
      clientStore.selected.didInvalidate  
      || firmStore.selected.didInvalidate
      || !selectedClient
      || !selectedClient._id 
      || !selectedFirm
      || !selectedFirm._id
      || !clientWorkflow
    );

    const isFetching = (
      firmStore.selected.isFetching
    )

    return (
      <PracticeLayout>
        <Helmet><title>New Workflow</title></Helmet>
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
          <PracticeClientWorkflowForm
            client={selectedClient}
            cancelLink={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/client-workflows`}
            formHelpers={formHelpers}
            formTitle="Create a new workflow to request information from your client"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            clientWorkflow={clientWorkflow}
          />
        }
        </div>
      </PracticeLayout>
    )
  }
}

PracticeCreateClientWorkflow.propTypes = {
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
  )(PracticeCreateClientWorkflow)
);
