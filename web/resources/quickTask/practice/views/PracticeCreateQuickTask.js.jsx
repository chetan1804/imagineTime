/**
 * View component for /quick-tasks/new
 *
 * Creates a new quickTask from a copy of the defaultItem in the quickTask reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as quickTaskActions from '../../quickTaskActions';
import * as clientActions from '../../../client/clientActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';
import { SelectFromArray } from '../../../../global/components/forms'; 

// import module components
import QuickTaskFileForm from '../../practice/components/QuickTaskFileForm.js.jsx';
import QuickTaskSignatureForm from '../../practice/components/QuickTaskSignatureForm.js.jsx';
import WorkspaceLayout from '../../../client/practice/components/WorkspaceLayout.js.jsx';

class PracticeCreateQuickTask extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      formHelpers: {}
      , quickTask: _.cloneDeep(this.props.defaultQuickTask.obj)
      // NOTE: ^ We don't want to actually change the store's defaultItem, just use a copy
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(quickTaskActions.fetchDefaultQuickTask());
    dispatch(clientActions.fetchListIfNeeded('_firm', match.params.firmId)); 
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      quickTask: _.cloneDeep(nextProps.defaultQuickTask.obj)
    })
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    const newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }


  _handleFormSubmit(e) {
    const { dispatch, history, loggedInUser, match } = this.props;
    e.preventDefault();
    let newQuickTask = _.cloneDeep(this.state.quickTask); 
    newQuickTask._createdBy = loggedInUser._id; 
    newQuickTask._firm = match.params.firmId; 
    dispatch(quickTaskActions.sendCreateQuickTask(this.state.quickTask)).then(quickTaskRes => {
      if(quickTaskRes.success) {
        dispatch(quickTaskActions.invalidateList("all"));
        history.push(`/quick-tasks/${quickTaskRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { match, clientStore } = this.props;
    const { quickTask } = this.state;
    const isEmpty = !quickTask;

    const clientList = clientStore.lists && clientStore.lists._firm && clientStore.lists._firm[match.params.firmId]; 
    const clientListItems = clientList && clientStore.util.getList('_firm', match.params.firmId); 
    return (
      <WorkspaceLayout>
        {isEmpty ?
          <h2> Loading...</h2>
          :
          <div>
            <div>
              <SelectFromArray
                items={[
                  'signature'
                  , 'file'
                ]}
                change={this._handleFormChange}
                label="Type of Request"
                name="quickTask.type"
                value={quickTask.type}
              />
            </div>
            {quickTask.type == 'signature' ? 
                <QuickTaskSignatureForm
                  quickTask={quickTask}
                  cancelLink={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/quick-tasks`}
                  formTitle="Create QuickTask"
                  formType="create"
                  handleFormChange={this._handleFormChange}
                  handleFormSubmit={this._handleFormSubmit}
                  selectedClient={match.params.clientId}
                  clientListItems={clientListItems}
                />
              : quickTask.type == 'file' ? 
                <QuickTaskFileForm
                  quickTask={quickTask}
                  cancelLink={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/quick-tasks`}
                  formTitle="Create QuickTask"
                  formType="create"
                  handleFormChange={this._handleFormChange}
                  handleFormSubmit={this._handleFormSubmit}
                  selectedClient={match.params.clientId}
                  clientListItems={clientListItems}
                />
              : null 
            }
          </div>
        }
      </WorkspaceLayout>
    )
  }
}

PracticeCreateQuickTask.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    defaultQuickTask: store.quickTask.defaultItem
    , clientStore: store.client
    , loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeCreateQuickTask)
);
