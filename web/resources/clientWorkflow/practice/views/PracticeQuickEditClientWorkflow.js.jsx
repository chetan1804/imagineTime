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

// import actions
import * as clientActions from '../../../client/clientActions';
import * as firmActions from '../../../firm/firmActions';
import * as taskActions from '../../../clientTask/clientTaskActions';
import * as clientWorkflowActions from '../../clientWorkflowActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';

// import resource components
import WorkspaceLayout from '../../../client/practice/components/WorkspaceLayout.js.jsx';

// import form components
import { 
  ListComparator
  , RadioInput
  , SingleDatePickerInput
  , TextInput 
  , TextAreaInput
} from '../../../../global/components/forms';

class PracticeQuickEditClientClientWorkflow extends Binder {
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
    dispatch(taskActions.fetchListIfNeeded('_clientWorkflow', match.params.clientWorkflowId));
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


  _handleFormSubmit(e) {
    const { dispatch, history, match } = this.props;
    if(e) { e.preventDefault(); }
    let newClientWorkflow = {
      ...this.state.clientWorkflow
    };

    dispatch(clientWorkflowActions.sendUpdateClientWorkflow(newClientWorkflow)).then(tfRes => {
      if(tfRes.success) {
        history.push(`/firm/${match.params.firmId}/clients/${match.params.clientId}/client-workflows/${tfRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }
  
  render() {
    const {
      clientStore 
      , firmStore 
      , match 
      , clientWorkflowStore
    } = this.props;

    const { clientWorkflow, formHelpers } = this.state;

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
            closeAction={() => this.props.history.goBack()}
            confirmAction={this._handleFormSubmit}
            confirmText="Save changes"
            cardSize="large"
            fixed={true}
            showButtons={true}
            modalHeader="Manage clientWorkflow settings"
          >
            <div className="-client-workflow-editor">
              <TextInput
                change={this._handleFormChange}
                classes="jumbo"
                label="Name this clientWorkflow"
                name="clientWorkflow.title"
                required={true}
                value={clientWorkflow.title || ""}
              />
              <TextAreaInput
                change={this._handleFormChange}
                helpText={<span><strong>NOTE: </strong>This will also appear in the body of the notification email</span>}
                label="Describe the purpose of this clientWorkflow"
                name="clientWorkflow.description"
                required={false}
                rows="3"
                value={clientWorkflow.description || ""}
              />
              {/* <RadioInput
                label="Does this clientWorkflow have a due date?"
                options={[
                  {val: 'yes', display: 'Yes'},
                  {val: 'no', display: 'No'},
                ]}
                helpText={formHelpers.hasDueDate === 'yes' ? <div>ClientWorkflow will be due upon date selected below.</div> : <div>ClientWorkflow is open ended. </div>}
                name="formHelpers.hasDueDate"
                value={formHelpers.hasDueDate}
                change={this._handleFormChange}
                inLine={true}
              />
              { formHelpers.hasDueDate === 'yes' ?
                <SingleDatePickerInput
                  change={this._handleFormChange}
                  label="Due date"
                  initialDate={formHelpers.dueDate}
                  name='formHelpers.dueDate'
                  numberOfMonths={1}
                />
                : 
                null 
              } */}
            </div>
          </Modal>
        }
      </WorkspaceLayout>
    )
  }
}

PracticeQuickEditClientClientWorkflow.propTypes = {
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
  )(PracticeQuickEditClientClientWorkflow)
);
