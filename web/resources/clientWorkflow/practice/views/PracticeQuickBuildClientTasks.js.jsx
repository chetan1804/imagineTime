/**
 * View component for /firm/:firmId/clients/:clientId/client-workflows/:clientWorkflowId/quick-edit
 *
 * Creates a new client from a copy of the defaultItem in the client reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import actions
import * as clientActions from '../../../client/clientActions';
import * as firmActions from '../../../firm/firmActions';
import * as clientTaskActions from '../../../clientTask/clientTaskActions';
import * as clientWorkflowActions from '../../clientWorkflowActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';

// import resource components
import ClientWorkflowItemsEditor from '../../components/ClientWorkflowItemsEditor.js.jsx';
import WorkspaceLayout from '../../../client/practice/components/WorkspaceLayout.js.jsx';

class PracticeQuickBuildClientTasks extends Binder {
  constructor(props) {
    super(props);
    const { match, clientWorkflowStore } = this.props;
    this.state = {
      clientWorkflow: clientWorkflowStore.byId[match.params.clientWorkflowId] ?  _.cloneDeep(clientWorkflowStore.byId[match.params.clientWorkflowId]) : {}
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , formHelpers: {
        ...this.props.clientWorkflowStore.formHelpers
        , edited: false
        , items: clientWorkflowStore.byId[match.params.clientWorkflowId] ? clientWorkflowStore.byId[match.params.clientWorkflowId].items : []
      }
      , taskOptionsOpen: false 
    }
    this._bind(
      '_handleFormChange'
      , '_handleSave'
      , '_createItem'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(clientTaskActions.fetchListIfNeeded('_clientWorkflow', match.params.clientWorkflowId));
    dispatch(clientWorkflowActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(clientWorkflowActions.fetchSingleIfNeeded(match.params.clientWorkflowId));
  }

  componentDidUpdate(prevProps, prevState) {
    const { match, clientWorkflowStore } = this.props;
    if(prevProps.clientWorkflowStore.byId[match.params.clientWorkflowId] !== this.props.clientWorkflowStore.byId[match.params.clientWorkflowId]) {
      // console.log('update state');
      // console.log(clientWorkflowStore.byId[match.params.clientWorkflowId]);
      let formHelpers = {...this.state.formHelpers};
      formHelpers.hasDueDate = clientWorkflowStore.byId[match.params.clientWorkflowId] && clientWorkflowStore.byId[match.params.clientWorkflowId].dueDate ? 'yes' : 'no';
      formHelpers.items = clientWorkflowStore.byId[match.params.clientWorkflowId] ? clientWorkflowStore.byId[match.params.clientWorkflowId].items : []

      this.setState({
        clientWorkflow: clientWorkflowStore.byId[match.params.clientWorkflowId] ?  _.cloneDeep(clientWorkflowStore.byId[match.params.clientWorkflowId]) : {}
        , formHelpers
      })
    }
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


  _handleSave(e) {
    const { dispatch, history, match } = this.props;
    let newClientWorkflow = _.cloneDeep(this.state.clientWorkflow);
    newClientWorkflow.items = this.state.formHelpers.items;
    dispatch(clientWorkflowActions.sendUpdateClientWorkflow(newClientWorkflow)).then(tfRes => {
      if(tfRes.success) {
        history.push(`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/client-workflows/${tfRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  _createItem(creating, type, index) {
    const { dispatch, match } = this.props;
    let items = this.state.formHelpers.items;
    console.log(items);
    if(creating === 'task') {
      let newTask = {
        _client: match.params.clientId 
        , _firm: match.params.firmId
        , type: type 
      }
      dispatch(clientTaskActions.sendCreateClientTask(newTask)).then(taskRes => {
        if(taskRes.success) {
          if(!index) {
            items.push({"_clientTask": taskRes.item._id});
          } 
          this.setState({
            items
            , taskOptionsOpen: false 
          });
        }
      })
    } else {
      console.log('create sub-client-workflow');
    }
  }
  
  render() {
    const {
      clientStore 
      , firmStore 
      , history
      , match 
      , clientWorkflowStore
    } = this.props;
    // console.log(match.params)
    const { clientWorkflow, formHelpers } = this.state;

    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();
    // const selectedClientWorkflow = clientWorkflowStore.selected.getItem();
    const selectedClientWorkflow = clientWorkflowStore.byId[match.params.clientWorkflowId];

    const isEmpty = (
      clientStore.selected.didInvalidate  
      || firmStore.selected.didInvalidate
      || !selectedClient
      || !selectedClient._id 
      || !selectedFirm
      || !selectedFirm._id
      || !clientWorkflow 
      || !selectedClientWorkflow 
      || !selectedClientWorkflow._id
    );


    const isFetching = (
      clientStore.selected.isFetching 
      , firmStore.selected.isFetching
      , clientWorkflowStore.selected.isFetching
    )

    return (
      <WorkspaceLayout>
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
          <Modal
            isOpen={true}
            closeAction={() => history.push(`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/client-workflows/${match.params.clientWorkflowId}`)}
            confirmAction={this._handleSave}
            confirmText="Save"
            cardSize="jumbo"
            fixed={true}
            showClose={false}
            modalHeader={<span className="u-muted">Step 2 of 2</span>}
          >
            <ClientWorkflowItemsEditor
              clientWorkflow={selectedClientWorkflow}
              clientId={match.params.clientId}
              firmId={match.params.firmId}
            />
            <div style={{height: '200px'}}/>

          </Modal>
        }
      </WorkspaceLayout>
    )
  }
}

PracticeQuickBuildClientTasks.propTypes = {
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
  )(PracticeQuickBuildClientTasks)
);
