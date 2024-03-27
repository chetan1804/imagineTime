/**
 * View for /firm/:firmId/workspaces/:clientId/client-workflow-templates/:clientWorkflowTemplateId
 * Displays a preview of a clientWorkflowTemplate
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries


// import actions
import * as clientTaskTemplateActions from '../../../clientTaskTemplate/clientTaskTemplateActions';
import * as clientWorkflowActions from '../../../clientWorkflow/clientWorkflowActions';
import * as clientWorkflowTemplateActions from '../../clientWorkflowTemplateActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';


// import resource components
import ClientTaskTemplateEditor from '../../../clientTaskTemplate/components/ClientTaskTemplateEditor.js.jsx';

class PracticeClientWorkflowTemplatePreview extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      submitting: false
    }
    this._bind(
      '_createWorkflowFromTemplate'
    )
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientWorkflowTemplateActions.fetchSingleIfNeeded(match.params.clientWorkflowTemplateId))
    // dispatch(clientTaskTemplateActions.fetchListIfNeeded('all')) // Remove this once the below fetch works (after we update the migrations.)
    dispatch(clientTaskTemplateActions.fetchListIfNeeded('_clientWorkflowTemplate', match.params.clientWorkflowTemplateId))
    // fire actions
  }

  componentDidUpdate(prevProps) {
    const { dispatch, match } = this.props;
    if(prevProps.match.params.clientWorkflowTemplateId !== match.params.clientWorkflowTemplateId) {
      dispatch(clientWorkflowTemplateActions.fetchSingleIfNeeded(match.params.clientWorkflowTemplateId))
    }
  }

  _createWorkflowFromTemplate(template) {
    const { dispatch, history, match } = this.props;
    this.setState({
      submitting: true
    });
    const submitObj = {
      firmId: match.params.firmId
      , clientId: match.params.clientId
      , clientWorkflowTemplate: template
    }
    
    dispatch(clientWorkflowActions.sendCreateFromTemplate(submitObj)).then(workflowRes => {
      this.setState({
        submitting: false
      });
      if(workflowRes.success) {
        const workflow = workflowRes.item;
        history.push(`/firm/${workflow._firm}/workspaces/${workflow._client}/client-workflows/${workflow._id}/update`)
      } else {
        alert("Error creating new workflow from template.")
        history.push(`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/client-workflows`)
      }
    });
  }

  render() {
    const { clientTaskTemplateStore, clientWorkflowTemplateStore } = this.props;
    const { submitting } = this.state;
    const selectedClientWorkflowTemplate = clientWorkflowTemplateStore.selected.getItem();

    const isEmpty = (
      !selectedClientWorkflowTemplate
    )

    const isFetching = (
      !selectedClientWorkflowTemplate
      || !clientWorkflowTemplateStore
      || !clientWorkflowTemplateStore.selected
      || clientWorkflowTemplateStore.selected.isFetching
    )
    
    return (
      <div className="-preview-template">
      { isEmpty ?
        isFetching ? <div className="loading"/> : <div>Empty.</div>
        :
        <div className="yt-col full xl_90" style={{opacity: isFetching ? '0.5' : '1'}}>
          <p><strong>Template description: </strong>{selectedClientWorkflowTemplate.purpose}</p>
          <div className="yt-row center-vert space-between">
            <div className="yt-col s_80">
              <h3>{selectedClientWorkflowTemplate.title}</h3>
              <p>{selectedClientWorkflowTemplate.description}</p>
            </div>
            <div className="yt-col s_20">
              <button
                className="yt-btn small u-pullRight"
                disabled={submitting}
                onClick={() => this._createWorkflowFromTemplate(selectedClientWorkflowTemplate)}
              >
              {submitting ? 'Building workflow...' : 'Use this template'}
              </button>
            </div>
          </div>

          <hr/>
          <div className="-task-list">
          { selectedClientWorkflowTemplate.items ?
            selectedClientWorkflowTemplate.items.map((item, i) => 
              <div key={item._clientTaskTemplate ? item._clientTaskTemplate + '_' + i : item._clientWorkflowTemplate + '_' + i}>
                { item._clientTaskTemplate ?
                  <ClientTaskTemplateEditor
                    handleCreate={this._createItem}
                    handleDelete={this._deleteItem}
                    reorderItem={this._reorderItem}
                    index={i}
                    isEditable={false}
                    clientTaskTemplate={clientTaskTemplateStore.byId[item._clientTaskTemplate]}
                    selectedClientWorkflowTemplate={selectedClientWorkflowTemplate}
                  />
                  // : this.props.clientWorkflowStore.byId[item._clientWorkflow] ? 
                  // renderSubEditor({
                  //   dispatch: this.props.dispatch
                  //   , index: i
                  //   , clientWorkflowTemplate: this.props.clientWorkflowTemplateStore.byId[item._clientWorkflowTemplate]
                  //   , clientTaskTemplateStore
                  //   , clientWorkflowTemplateStore
                  //   , item // debugging
                  // })
                  : `...loading clientWorkflowTemplate ${item._clientWorkflowTemplate}`
                }
              </div>
            )
            :
            null 
          }
          </div>
        </div>
      }
      </div>
    )
  }
}

PracticeClientWorkflowTemplatePreview.propTypes = {
  dispatch: PropTypes.func.isRequired
}

PracticeClientWorkflowTemplatePreview.defaultProps = {
}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    clientTaskTemplateStore: store.clientTaskTemplate
    , clientWorkflowTemplateStore: store.clientWorkflowTemplate
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PracticeClientWorkflowTemplatePreview)
);
