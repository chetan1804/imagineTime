/**
 * Reusable component for editing details of a task
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import { DateTime } from 'luxon';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';
import { TextInput, TextAreaInput } from '../../../global/components/forms';

// import resource components 
import ClientTaskEditor from '../../clientTask/components/ClientTaskEditor.js.jsx';
// import { ClientWorkflowItemsEditor as SubClientWorkflowItemsEditor } from './ClientWorkflowItemsEditor.js.jsx';
import ClientTaskOptionsMenu from '../../clientTask/components/ClientTaskOptionsMenu.js.jsx';
import ClientWorkflowStatusIndicator from '../components/ClientWorkflowStatusIndicator.js.jsx';

// import utils

// import actions 
import * as clientTaskActions from '../../clientTask/clientTaskActions';
import * as clientWorkflowActions from '../clientWorkflowActions';
import * as fileActions from '../../file/fileActions';

class ClientWorkflowItemsEditor extends Binder {
  constructor(props) {
    console.log("CLIENT_TASK FLOW EDITOR CONSTRUCTOR CALLED", props)
    super(props);
    this.state = {
      newClientWorkflow: _.cloneDeep(this.props.clientWorkflow)
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {
        ...this.props.clientWorkflowStore.formHelpers
        , edited: false
      }
      , taskOptionsOpen: false 

    }
    this._bind(
      '_createItem'
      , '_deleteItem'
      , '_reorderItem'
      , '_handleChange'
      , '_handleSave'
    );
  }

  componentDidMount() {
    const { dispatch, clientWorkflow, match } = this.props;
    // TODO: once new references are in place we don't need this to be a overridden api
    dispatch(clientTaskActions.fetchListIfNeeded('_clientWorkflow', clientWorkflow._id));
    dispatch(fileActions.fetchListIfNeeded('~client', match.params.clientId, 'status', 'visible'))
  }

  _handleChange(e) {

    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    newState.formHelpers.edited = true;
    this.setState(newState);
  }


  _handleSave(e) {
    const { dispatch } = this.props;
    if(this.state.formHelpers.edited) {
      dispatch(clientWorkflowActions.sendUpdateClientWorkflow(this.state.newClientWorkflow)).then(tfRes => {
        if(tfRes.success) {
          // history.push(`/firm/${match.params.firmId}/clients/${match.params.clientId}/client-workflows/${tfRes.item._id}`)
          this.setState({
            newClientWorkflow: tfRes.item
            , formHelpers: {
              ...this.state.formHelpers 
              , edited: false 
            }  
          });
        } else {
          alert("ERROR - Check logs");
        }
      });
    }
  }

  _createItem(creating, type, index) {
    // console.log('create item', creating, type, index);
    const { dispatch } = this.props;
    this.setState({taskOptionsOpen: false})
    if(creating === 'task') {
      let newTask = {
        _client: this.props.clientId 
        , _firm: this.props.firmId
        , _clientWorkflow: this.props.clientWorkflow._id
        , status: 'draft'
        , type: type 
      }
      dispatch(clientTaskActions.sendCreateClientTask(newTask)).then(taskRes => {
        if(taskRes.success) {
          let newClientWorkflow = _.cloneDeep(this.props.clientWorkflow);
          if(!index) {
            newClientWorkflow.items.push({"_clientTask": taskRes.item._id});
          } else {
            newClientWorkflow.items.splice(index, 0, {"_clientTask": taskRes.item._id});
          }
          dispatch(clientWorkflowActions.sendUpdateClientWorkflow(newClientWorkflow)).then(tfRes => {
            if(tfRes.success) {
              dispatch(clientTaskActions.invalidateList('_clientWorkflow', tfRes.item._id));
              dispatch(clientTaskActions.fetchListIfNeeded('_clientWorkflow', tfRes.item._id));
            }
          });
        }
      })
    } else {
      console.log('create sub-client-workflow');
      let newClientWorkflow = {
        _client: this.props.clientId 
        , _firm: this.props.firmId
        , _parent: this.props.clientWorkflow._id
        , items: []
      }
      dispatch(clientWorkflowActions.sendCreateClientWorkflow(newClientWorkflow)).then(tfRes => {
        if(tfRes.success) {
          let updatedClientWorkflow = _.cloneDeep(this.props.clientWorkflow);
          if(!index) {
            updatedClientWorkflow.items.push({"_clientWorkflow": tfRes.item._id});
          } else {
            updatedClientWorkflow.items.splice(index, 0, {"_clientWorkflow": tfRes.item._id});
          }
          dispatch(clientWorkflowActions.sendUpdateClientWorkflow(updatedClientWorkflow)).then(tfRes2 => {
            if(tfRes2.success) {
              dispatch(clientWorkflowActions.invalidateList('_clientWorkflow', tfRes2.item._id));
              dispatch(clientWorkflowActions.fetchListIfNeeded('_clientWorkflow', tfRes2.item._id));
            }
          });
        }
      })
    }
  }

  _deleteItem(deleting, index) {
    const { dispatch } = this.props;
    let updatedClientWorkflow = _.cloneDeep(this.props.clientWorkflow)
    if(deleting === 'task') {
      let taskId = updatedClientWorkflow.items[index] ? updatedClientWorkflow.items[index]._clientTask : null
      if(taskId) {
        dispatch(clientTaskActions.sendStaffDelete(taskId)).then(taskRes => {
          if(taskRes.success) {
            updatedClientWorkflow.items.splice(index, 1)
            dispatch(clientWorkflowActions.sendUpdateClientWorkflow(updatedClientWorkflow)).then(clientWorkflowRes => {
              if(clientWorkflowRes.success) {
                dispatch(clientTaskActions.invalidateList('_clientWorkflow', clientWorkflowRes.item._id));
                dispatch(clientTaskActions.fetchListIfNeeded('_clientWorkflow', clientWorkflowRes.item._id));
              }
            });
          }
        })
      }
    } else {
      // deleting a sub clientWorkflow.
    }
  }

  _reorderItem(fromIndex, toIndex) {
    const { dispatch } = this.props;
    let updatedClientWorkflow = _.cloneDeep(this.props.clientWorkflow)
    const item = updatedClientWorkflow.items.splice(fromIndex, 1);    
    updatedClientWorkflow.items.splice(toIndex, 0, item[0])
    dispatch(clientWorkflowActions.sendUpdateClientWorkflow(updatedClientWorkflow))
  }

  render() {
    const { newClientWorkflow } = this.state;
    const { 
      clientId
      , firmId 
      , index
      , clientWorkflow
      , clientTaskStore
      , clientWorkflowStore 
      , formTitle
      , formType
      , match
    } = this.props;
    const editorClass = classNames(
      '-client-workflow-editor'
      , { '-sub-tasks': index }
    )
    const header = <div className="formHeader"><h3> {formTitle || "Update Workflow"} </h3></div>
    
    return (
      <div className={editorClass}>
        <div className="yt-col full l_90">
          <div className="yt-row space-between center-vert">
            {header}
            <ClientWorkflowStatusIndicator
              status={clientWorkflow.status}
            />
          </div>
          <br/>
          { isNaN(parseInt(index)) ? 
            <div>
              <TextInput
                blur={this._handleSave}
                change={this._handleChange}
                label="Title"
                name="newClientWorkflow.title"
                value={newClientWorkflow.title || ''}
              />
              <TextAreaInput
                blur={this._handleSave}
                change={this._handleChange}
                helpText={<span><strong>NOTE: </strong>This will also appear in the body of the notification email</span>}
                label="Describe the purpose of this workflow"
                name="newClientWorkflow.description"
                // placeholder={`Type the description of this workflow here...`}
                rows="4"
                value={newClientWorkflow.description || ''}
              />
            </div>
            :
            <div className="-sub-task-title">
              <div className={`-task-type sub-task`}>
                <span className="-icon"><i className="far fa-indent"/></span><span className="-index">{index + 1}</span> 
              </div>
              <TextInput
                blur={this._handleSave}
                change={this._handleChange}
                name="newClientWorkflow.title"
                placeholder={`Type the name of this ${index ? 'sub-':''}clientWorkflow here...`}
                value={newClientWorkflow.title || ''}
              />
            </div>
          }
          <span className="u-muted">Use the "+" button to add tasks to your workflow</span>
          <hr/>
          <div className="-task-list">
            { clientWorkflow.items ? 
              clientWorkflow.items.map((item, i) => 
                <div key={item._clientTask ? item._clientTask + '_' + i : item._clientWorkflow + '_' + i}>
                  { item._clientTask ?
                    <ClientTaskEditor
                      handleCreate={this._createItem}
                      handleDelete={this._deleteItem}
                      reorderItem={this._reorderItem}
                      index={i}
                      clientTask={clientTaskStore.byId[item._clientTask]}
                      clientWorkflow={clientWorkflow}
                    />
                    : this.props.clientWorkflowStore.byId[item._clientWorkflow] ? 
                    renderSubEditor({
                      dispatch: this.props.dispatch
                      , index: i
                      , clientWorkflow: this.props.clientWorkflowStore.byId[item._clientWorkflow]
                      , clientTaskStore
                      , clientWorkflowStore
                      , item // debugging
                      , clientId
                      , firmId
                    })
                    : `...loading clientWorkflow ${item._clientWorkflow}`
                  } 

                </div>
              )
              :
              null 
            }
          </div>
        </div>
        <CloseWrapper
          isOpen={(this.state.taskOptionsOpen )}
          closeAction={() => this.setState({taskOptionsOpen: false})}
        />
        <div className="dropdown">
          <div className="add-new-task" onClick={() => this.setState({taskOptionsOpen: true})}>
            <span className="-icon">
              <i className="far fa-plus"/>
            </span>
            <strong>Add Task</strong>
          </div>
          <ClientTaskOptionsMenu 
            handleCreate={(args) => this._createItem(...args)}
            index={index}
            inserting={false}
            isOpen={this.state.taskOptionsOpen}
          />
        </div>
        <div style={{height: '100px'}}/>
        <div className="yt-tools space-between -toolbar-bottom">
          <Link to={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/client-workflows`} className="yt-btn link">Cancel</Link>
          <Link to={`${match.url.substring(0, match.url.indexOf('/update'))}`} className="yt-btn">Done</Link>
        </div>
      </div>
    )
  }
}

ClientWorkflowItemsEditor.propTypes = {
  clientId: PropTypes.string 
  , dispatch: PropTypes.func.isRequired
  , firmId: PropTypes.string
  , index: PropTypes.number 
  , clientWorkflow: PropTypes.object.isRequired
}

ClientWorkflowItemsEditor.defaultProps = {
  clientId: null 
  , firmId: null 
  , index: null 
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    clientTaskStore: store.clientTask
    , clientWorkflowStore: store.clientWorkflow
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientWorkflowItemsEditor)
);


const renderSubEditor = props => {
  // NOTES:
  /**
   * this separates the render out so you can call it again. 
   * it doesn't do anything in its own right other than return the object
   * 
   * TODOS:
   * one drawback that i;m finding is that this does not have access to withRouter/connect/store
   * it would make a lot of sense to re-organise this componenet to pass all that stuff off to a wrapper component
   * to do the actual logic and have this component only have a few simple props
   * 
   * also, the sub flows are never fetched, nor do they have titles. i am hard fetching one in the didMount
   */

  // console.log("render sub list", props)
  // console.log(ClientWorkflowItemsEditor)
  return <ClientWorkflowItemsEditor
    {...props}
  />
  // return <span>sub-task</span>
  
}